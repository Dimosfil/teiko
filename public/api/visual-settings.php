<?php
header('Content-Type: application/json; charset=utf-8');

$publicDir = dirname(__DIR__);
$settingsDir = $publicDir . DIRECTORY_SEPARATOR . 'visual-settings';
$indexPath = $settingsDir . DIRECTORY_SEPARATOR . 'index.json';
$legacyDefaultPath = $publicDir . DIRECTORY_SEPARATOR . 'visual-settings.json';
$defaultPreset = ['id' => 'default', 'name' => 'Default'];

function respond($status, $payload) {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

function normalize_preset_id($value, $fallback = 'default') {
    $id = strtolower(trim((string) $value));
    $id = preg_replace('/[^a-z0-9_-]+/', '-', $id) ?? '';
    $id = trim($id, '-');
    return substr($id !== '' ? $id : $fallback, 0, 48);
}

function read_json($path, $fallback) {
    if (!is_file($path)) {
        return $fallback;
    }
    $raw = file_get_contents($path);
    if ($raw === false) {
        return $fallback;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : $fallback;
}

function write_json($path, $payload) {
    $dir = dirname($path);
    if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
        respond(500, ['error' => "Cannot create directory: $dir"]);
    }
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json === false || file_put_contents($path, $json . PHP_EOL, LOCK_EX) === false) {
        respond(500, ['error' => "Cannot write file: $path"]);
    }
}

function preset_path($settingsDir, $id) {
    return $settingsDir . DIRECTORY_SEPARATOR . normalize_preset_id($id) . '.json';
}

function seed_store($settingsDir, $indexPath, $legacyDefaultPath, $defaultPreset) {
    $defaultPath = preset_path($settingsDir, 'default');
    if (!is_file($defaultPath)) {
        $settings = read_json($legacyDefaultPath, []);
        write_json($defaultPath, is_array($settings) ? $settings : []);
    }
    if (!is_file($indexPath)) {
        write_json($indexPath, ['activePreset' => 'default', 'presets' => [$defaultPreset]]);
    }
}

function read_index($indexPath, $defaultPreset) {
    $index = read_json($indexPath, []);
    $presets = is_array($index['presets'] ?? null) ? $index['presets'] : [];
    array_unshift($presets, $defaultPreset);

    $seen = [];
    $normalized = [];
    foreach ($presets as $preset) {
        if (!is_array($preset)) {
            continue;
        }
        $id = normalize_preset_id((string) ($preset['id'] ?? $preset['name'] ?? ''), '');
        if ($id === '' || isset($seen[$id])) {
            continue;
        }
        $seen[$id] = true;
        $normalized[] = [
            'id' => $id,
            'name' => trim((string) ($preset['name'] ?? $id)) ?: $id,
        ];
    }

    return [
        'activePreset' => normalize_preset_id((string) ($index['activePreset'] ?? 'default')),
        'presets' => $normalized,
    ];
}

function read_preset($settingsDir, $id, $legacyDefaultPath) {
    $safeId = normalize_preset_id($id);
    $preset = read_json(preset_path($settingsDir, $safeId), null);
    if (is_array($preset)) {
        return $preset;
    }
    return $safeId === 'default' ? read_json($legacyDefaultPath, []) : [];
}

seed_store($settingsDir, $indexPath, $legacyDefaultPath, $defaultPreset);

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$id = normalize_preset_id((string) ($_GET['id'] ?? $_POST['id'] ?? 'default'));

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        respond(200, read_preset($settingsDir, $id, $legacyDefaultPath));
    }
    $index = read_index($indexPath, $defaultPreset);
    respond(200, $index + ['settings' => read_preset($settingsDir, $index['activePreset'], $legacyDefaultPath)]);
}

if (!in_array($method, ['POST', 'PUT'], true)) {
    respond(405, ['error' => 'Method not allowed']);
}

$body = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($body)) {
    respond(400, ['error' => 'Visual settings payload must be JSON']);
}

$settings = $body['settings'] ?? $body;
if (!is_array($settings)) {
    respond(400, ['error' => 'Visual settings payload must be an object']);
}

$id = normalize_preset_id((string) ($body['id'] ?? $_GET['id'] ?? 'default'));
$index = read_index($indexPath, $defaultPreset);
$existingName = $id;
foreach ($index['presets'] as $preset) {
    if (($preset['id'] ?? '') === $id) {
        $existingName = (string) ($preset['name'] ?? $id);
        break;
    }
}

$name = trim((string) ($body['name'] ?? $existingName)) ?: $id;
$presets = array_values(array_filter($index['presets'], function ($preset) use ($id) {
    return ($preset['id'] ?? '') !== $id;
}));
$presets[] = ['id' => $id, 'name' => $name];
usort($presets, function ($a, $b) {
    if (($a['id'] ?? '') === 'default') {
        return -1;
    }
    if (($b['id'] ?? '') === 'default') {
        return 1;
    }
    return strcmp((string) ($a['name'] ?? ''), (string) ($b['name'] ?? ''));
});

$activate = !in_array(strtolower((string) ($_GET['activate'] ?? '')), ['0', 'false', 'no'], true) && (($body['activate'] ?? true) !== false);
$nextIndex = [
    'activePreset' => $activate ? $id : $index['activePreset'],
    'presets' => $presets,
];

write_json(preset_path($settingsDir, $id), $settings);
if ($id === 'default') {
    write_json($legacyDefaultPath, $settings);
}
write_json($indexPath, $nextIndex);

respond(200, ['id' => $id, 'name' => $name, 'index' => $nextIndex, 'settings' => $settings]);
