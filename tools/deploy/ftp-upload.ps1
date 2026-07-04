param(
    [string]$ConfigPath = "tools/deploy/ftp.local.json",
    [switch]$List,
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function ConvertFrom-DpapiSecret {
    param([Parameter(Mandatory = $true)][string]$Value)

    $secure = ConvertTo-SecureString $Value
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    }
    finally {
        if ($ptr -ne [IntPtr]::Zero) {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
        }
    }
}

function Join-RemotePath {
    param([string]$Base, [string]$Relative)

    $cleanBase = ($Base -replace "\\", "/").TrimEnd("/")
    $cleanRelative = ($Relative -replace "\\", "/").TrimStart("/")
    if ([string]::IsNullOrWhiteSpace($cleanBase)) {
        return "/$cleanRelative"
    }
    if ([string]::IsNullOrWhiteSpace($cleanRelative)) {
        return $cleanBase
    }
    return "$cleanBase/$cleanRelative"
}

function Get-RelativeUploadPath {
    param(
        [Parameter(Mandatory = $true)][string]$Root,
        [Parameter(Mandatory = $true)][string]$Path
    )

    $rootPath = (Resolve-Path -LiteralPath $Root).Path.TrimEnd("\") + "\"
    $fullPath = (Resolve-Path -LiteralPath $Path).Path
    return ($fullPath.Substring($rootPath.Length) -replace "\\", "/")
}

function Quote-Sh {
    param([Parameter(Mandatory = $true)][string]$Value)

    return "'" + ($Value -replace "'", "'\''") + "'"
}

function New-FtpRequest {
    param(
        [Parameter(Mandatory = $true)][object]$Config,
        [Parameter(Mandatory = $true)][string]$RemotePath,
        [Parameter(Mandatory = $true)][string]$Method,
        [Parameter(Mandatory = $true)][string]$Password
    )

    $scheme = if (($Config.protocol -as [string]) -eq "ftps") { "ftps" } else { "ftp" }
    $hostName = [string]$Config.host
    $port = if ($Config.port) { [int]$Config.port } else { 21 }
    $path = ($RemotePath -replace "\\", "/").TrimStart("/")
    $uri = [Uri]"${scheme}://${hostName}:${port}/$path"
    $request = [System.Net.FtpWebRequest]::Create($uri)
    $request.Method = $Method
    $request.Credentials = [System.Net.NetworkCredential]::new([string]$Config.username, $Password)
    $request.UseBinary = $true
    $request.UsePassive = $true
    $request.KeepAlive = $false
    if ($scheme -eq "ftps") {
        $request.EnableSsl = $true
    }
    return $request
}

function Invoke-FtpList {
    param([object]$Config, [string]$Password)

    $remotePath = if ($Config.remotePath) { [string]$Config.remotePath } else { "/" }
    $request = New-FtpRequest -Config $Config -RemotePath $remotePath -Method ([System.Net.WebRequestMethods+Ftp]::ListDirectoryDetails) -Password $Password
    $response = $request.GetResponse()
    try {
        $reader = [System.IO.StreamReader]::new($response.GetResponseStream())
        try {
            return $reader.ReadToEnd()
        }
        finally {
            $reader.Dispose()
        }
    }
    finally {
        $response.Dispose()
    }
}

function Ensure-FtpDirectory {
    param(
        [object]$Config,
        [string]$RemoteDirectory,
        [string]$Password,
        [hashtable]$Known
    )

    $clean = ($RemoteDirectory -replace "\\", "/").Trim("/")
    if ([string]::IsNullOrWhiteSpace($clean)) {
        return
    }

    $current = ""
    foreach ($segment in ($clean -split "/")) {
        if ([string]::IsNullOrWhiteSpace($segment)) {
            continue
        }
        $current = if ($current) { "$current/$segment" } else { $segment }
        if ($Known.ContainsKey($current)) {
            continue
        }

        $request = New-FtpRequest -Config $Config -RemotePath $current -Method ([System.Net.WebRequestMethods+Ftp]::MakeDirectory) -Password $Password
        try {
            $response = $request.GetResponse()
            $response.Dispose()
        }
        catch [System.Net.WebException] {
            if ($_.Exception.Response) {
                $_.Exception.Response.Dispose()
            }
        }
        $Known[$current] = $true
    }
}

function Test-ExcludedPath {
    param([string]$RelativePath, [object[]]$Patterns)

    $path = ($RelativePath -replace "\\", "/")
    foreach ($pattern in $Patterns) {
        $normalized = ([string]$pattern -replace "\\", "/")
        if ($path -like $normalized) {
            return $true
        }
    }
    return $false
}

function New-StaticStorefrontSnapshot {
    $snapshotPath = Join-Path $env:TEMP ("teiko-static-" + [guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Path $snapshotPath | Out-Null

    Get-ChildItem -LiteralPath "public" -Force | Where-Object { $_.Name -ne ".idea" } | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination $snapshotPath -Recurse -Force
    }
    New-Item -ItemType Directory -Path (Join-Path $snapshotPath "api") -Force | Out-Null

    $projectRootUrl = "file:///" + ((Resolve-Path -LiteralPath ".").Path -replace "\\", "/")
    $nodeScript = @"
import fs from "node:fs";
import path from "node:path";
import { initDb, hasSeedData, seedDatabase, getSettings, listSlides, listProducts } from "$projectRootUrl/src/db.mjs";
import { seedPayload } from "$projectRootUrl/src/seed-data.mjs";

await initDb();
if (!hasSeedData()) seedDatabase(seedPayload);
const out = process.env.TEIKO_STATIC_EXPORT;
fs.writeFileSync(
  path.join(out, "api", "storefront"),
  JSON.stringify({
    settings: getSettings(),
    slides: listSlides({ activeOnly: true }),
    products: listProducts({ activeOnly: true })
  }, null, 2) + "\n",
  "utf8"
);
fs.writeFileSync(
  path.join(out, "health"),
  JSON.stringify({ ok: true, service: "teiko-showcase-static" }, null, 2) + "\n",
  "utf8"
);
"@

    $scriptPath = Join-Path $env:TEMP ("teiko-static-export-" + [guid]::NewGuid().ToString("N") + ".mjs")
    Set-Content -LiteralPath $scriptPath -Value $nodeScript -Encoding UTF8

    $env:TEIKO_STATIC_EXPORT = $snapshotPath
    try {
        node $scriptPath
        if ($LASTEXITCODE -ne 0) {
            throw "Static storefront export failed with exit code $LASTEXITCODE."
        }
    }
    finally {
        Remove-Item Env:\TEIKO_STATIC_EXPORT -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $scriptPath -Force -ErrorAction SilentlyContinue
    }

    return $snapshotPath
}

if (-not (Test-Path -LiteralPath $ConfigPath)) {
    throw "FTP config not found: $ConfigPath"
}

$config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
$password = ConvertFrom-DpapiSecret -Value ([string]$config.passwordDpapi)

try {
    if (([string]$config.protocol) -eq "sftp") {
        $psftp = Get-Command psftp.exe -ErrorAction Stop
        $plink = Get-Command plink.exe -ErrorAction Stop

        if ($List) {
            $batchPath = Join-Path $env:TEMP ("teiko-sftp-list-" + [guid]::NewGuid().ToString("N") + ".txt")
            @(
                "cd $($config.remotePath)"
                "pwd"
                "ls"
                "quit"
            ) | Set-Content -LiteralPath $batchPath -Encoding ASCII
            try {
                & $psftp.Source -batch -pw $password "$($config.username)@$($config.host)" -b $batchPath
            }
            finally {
                Remove-Item -LiteralPath $batchPath -Force -ErrorAction SilentlyContinue
            }
            exit 0
        }

        $generatedRoot = $null
        if (([string]$config.deploymentMode) -eq "static-storefront-snapshot") {
            $generatedRoot = New-StaticStorefrontSnapshot
            $localRoot = Resolve-Path -LiteralPath $generatedRoot
        }
        else {
            $localRoot = Resolve-Path -LiteralPath ([string]$config.localPath)
        }
        $remoteRoot = [string]$config.remotePath
        if ([string]::IsNullOrWhiteSpace($remoteRoot)) {
            throw "remotePath is empty in $ConfigPath"
        }

        $excludePatterns = @($config.exclude)
        $files = @(Get-ChildItem -LiteralPath $localRoot -Recurse -File -Force | Where-Object {
            $relative = Get-RelativeUploadPath -Root $localRoot -Path $_.FullName
            -not (Test-ExcludedPath -RelativePath $relative -Patterns $excludePatterns)
        })

        if ($DryRun) {
            Write-Host "SFTP dry run: $($files.Count) files selected from $localRoot to $remoteRoot"
            $files | Select-Object -First 20 | ForEach-Object {
                Get-RelativeUploadPath -Root $localRoot -Path $_.FullName
            }
            if ($files.Count -gt 20) {
                Write-Host "... $($files.Count - 20) more"
            }
            if ($generatedRoot) {
                Remove-Item -LiteralPath $generatedRoot -Recurse -Force -ErrorAction SilentlyContinue
            }
            exit 0
        }

        $directories = @($files | ForEach-Object {
            $relative = Get-RelativeUploadPath -Root $localRoot -Path $_.FullName
            $directory = Split-Path -Parent $relative
            if ($directory) { $directory -replace "\\", "/" }
        } | Sort-Object -Unique)
        $mkdirTargets = @((Quote-Sh $remoteRoot)) + @($directories | ForEach-Object {
            Quote-Sh (Join-RemotePath -Base $remoteRoot -Relative $_)
        })
        & $plink.Source -batch -pw $password "$($config.username)@$($config.host)" ("mkdir -p " + ($mkdirTargets -join " "))

        $batchPath = Join-Path $env:TEMP ("teiko-sftp-upload-" + [guid]::NewGuid().ToString("N") + ".txt")
        $commands = New-Object System.Collections.Generic.List[string]
        $commands.Add("cd $remoteRoot")
        foreach ($file in $files) {
            $relative = Get-RelativeUploadPath -Root $localRoot -Path $file.FullName
            $commands.Add(('put "{0}" "{1}"' -f $file.FullName, $relative))
        }
        $commands.Add("quit")
        $commands | Set-Content -LiteralPath $batchPath -Encoding ASCII
        try {
            & $psftp.Source -batch -pw $password "$($config.username)@$($config.host)" -b $batchPath
        }
        finally {
            Remove-Item -LiteralPath $batchPath -Force -ErrorAction SilentlyContinue
        }

        Write-Host "SFTP upload complete: $($files.Count) files uploaded to $remoteRoot"
        if ($generatedRoot) {
            Remove-Item -LiteralPath $generatedRoot -Recurse -Force -ErrorAction SilentlyContinue
        }
        exit 0
    }

    if ($List) {
        Invoke-FtpList -Config $config -Password $password
        exit 0
    }

    $localRoot = Resolve-Path -LiteralPath ([string]$config.localPath)
    $remoteRoot = [string]$config.remotePath
    if ([string]::IsNullOrWhiteSpace($remoteRoot)) {
        throw "remotePath is empty in $ConfigPath"
    }

    $excludePatterns = @($config.exclude)
    $files = @(Get-ChildItem -LiteralPath $localRoot -Recurse -File -Force | Where-Object {
        $relative = Get-RelativeUploadPath -Root $localRoot -Path $_.FullName
        -not (Test-ExcludedPath -RelativePath $relative -Patterns $excludePatterns)
    })

    if ($DryRun) {
        Write-Host "FTP dry run: $($files.Count) files selected from $localRoot to $remoteRoot"
        $files | Select-Object -First 20 | ForEach-Object {
            Get-RelativeUploadPath -Root $localRoot -Path $_.FullName
        }
        if ($files.Count -gt 20) {
            Write-Host "... $($files.Count - 20) more"
        }
        exit 0
    }

    $knownDirectories = @{}
    $uploaded = 0
    foreach ($file in $files) {
        $relative = Get-RelativeUploadPath -Root $localRoot -Path $file.FullName
        $remotePath = Join-RemotePath -Base $remoteRoot -Relative $relative
        $remoteDirectory = Split-Path -Parent $remotePath
        Ensure-FtpDirectory -Config $config -RemoteDirectory $remoteDirectory -Password $password -Known $knownDirectories

        $request = New-FtpRequest -Config $config -RemotePath $remotePath -Method ([System.Net.WebRequestMethods+Ftp]::UploadFile) -Password $password
        $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
        $request.ContentLength = $bytes.Length
        $stream = $request.GetRequestStream()
        try {
            $stream.Write($bytes, 0, $bytes.Length)
        }
        finally {
            $stream.Dispose()
        }

        $response = $request.GetResponse()
        try {
            $uploaded += 1
        }
        finally {
            $response.Dispose()
        }
    }

    Write-Host "FTP upload complete: $uploaded files uploaded to $remoteRoot"
}
finally {
    $password = $null
}
