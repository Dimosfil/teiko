# Encoding Safety

## Problem

Windows PowerShell can corrupt Russian text when sending API request bodies as
plain strings. A JSON string passed to `Invoke-RestMethod -Body` without an
explicit UTF-8 byte body and `charset=utf-8` can arrive at the Node API with
Cyrillic characters already replaced by `?`. The API then stores the corrupted
text in SQLite, and the browser renders literal `????`.

## Rule

- Keep source files in UTF-8.
- For API writes containing Russian or any non-ASCII text, prefer Node `fetch`
  or another client that sends UTF-8 JSON by default.
- If PowerShell must be used, send UTF-8 bytes and include
  `application/json; charset=utf-8`.
- After writing content through an API or admin tool, read it back and check for
  literal `????` and replacement characters `�`.
- For mojibake, inspect whole fragments such as `Рџ`, `Рљ`, `СЃ`, or `С‚` where
  readable Russian is expected. Do not flag a single normal Cyrillic letter such
  as `Р` or `С`; those letters can occur in valid Russian text.
- Do not trust terminal display alone: distinguish console mojibake from stored
  data by checking the API response and browser output.

## Safe PowerShell Shape

```powershell
$json = $payload | ConvertTo-Json -Depth 20
$bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
Invoke-RestMethod `
  -Uri "http://127.0.0.1:3000/api/admin/settings" `
  -Method Put `
  -ContentType "application/json; charset=utf-8" `
  -Headers @{ "x-admin-password" = "admin123" } `
  -Body $bytes
```

## Safer Node Shape

```javascript
await fetch("http://127.0.0.1:3000/api/admin/settings", {
  method: "PUT",
  headers: {
    "content-type": "application/json; charset=utf-8",
    "x-admin-password": "admin123"
  },
  body: JSON.stringify(payload)
});
```
