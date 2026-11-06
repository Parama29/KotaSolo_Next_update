<?php
declare(strict_types=1);

require_once __DIR__ . '/log-config.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// --- Method check ---
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

// --- Origin check (best-effort) ---
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    $allowed = false;
    foreach (ALLOWED_ORIGINS as $o) {
        if (strcasecmp($origin, $o) === 0) { $allowed = true; break; }
    }
    // Allow same-origin juga
    if (!$allowed && isset($_SERVER['HTTP_HOST'])) {
        if (stripos($origin, '//' . $_SERVER['HTTP_HOST']) !== false) $allowed = true;
    }
    if (!$allowed) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'Origin not allowed']);
        exit;
    }
}

// --- Token check (header ATAU query untuk sendBeacon) ---
$token = (string)($_SERVER['HTTP_X_LOG_TOKEN'] ?? '');
if ($token === '') $token = (string)($_GET['t'] ?? '');

if (!hash_equals(LOG_SHARED_TOKEN, $token)) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Unauthorized']);
    exit;
}

// --- Body size ---
$raw = file_get_contents('php://input');
if ($raw === false || strlen($raw) > MAX_BODY_BYTES) {
    http_response_code(413);
    echo json_encode(['ok' => false, 'error' => 'Payload too large']);
    exit;
}

// --- Parse ---
$data = json_decode($raw, true);
if (!is_array($data) || !isset($data['entries']) || !is_array($data['entries'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid payload']);
    exit;
}

$entries = $data['entries'];
if (count($entries) === 0) {
    echo json_encode(['ok' => true, 'received' => 0]);
    exit;
}
if (count($entries) > MAX_ENTRIES_PER_REQUEST) {
    $entries = array_slice($entries, 0, MAX_ENTRIES_PER_REQUEST);
}

// --- Sanitize: hanya field yang dikenal ---
$clean = [];
foreach ($entries as $e) {
    if (!is_array($e)) continue;
    $clean[] = [
        'id'           => (string)($e['id'] ?? ''),
        'sessionId'    => (string)($e['sessionId'] ?? ''),
        'type'         => (string)($e['type'] ?? ''),
        'time'         => (string)($e['time'] ?? ''),
        'url'          => substr((string)($e['url'] ?? ''), 0, 500),
        'userPoint'    => is_array($e['userPoint'] ?? null) ? [
            'lat'      => $e['userPoint']['lat'] ?? null,
            'lng'      => $e['userPoint']['lng'] ?? null,
            'accuracy' => $e['userPoint']['accuracy'] ?? null,
        ] : null,
        'destination'  => is_array($e['destination'] ?? null) ? [
            'id'       => $e['destination']['id'] ?? null,
            'name'     => $e['destination']['name'] ?? null,
            'category' => $e['destination']['category'] ?? null,
            'lat'      => $e['destination']['lat'] ?? null,
            'lng'      => $e['destination']['lng'] ?? null,
        ] : null,
        'route'        => $e['route'] ?? null,
        'routeUrl'     => $e['routeUrl'] ?? null,
        'description'  => $e['description'] ?? null,
        'category'     => $e['category'] ?? null,
        'layer'        => $e['layer'] ?? null,
        'visible'      => $e['visible'] ?? null,
        'theme'        => $e['theme'] ?? null,
        'nearbyCount'  => $e['nearbyCount'] ?? null,
        'radiusMeters' => $e['radiusMeters'] ?? null,
        'movedMeters'  => $e['movedMeters'] ?? null,
        'accuracy'     => $e['accuracy'] ?? null,
        'userAgent'    => substr((string)($e['userAgent'] ?? ''), 0, 500),
        'viewport'     => is_array($e['viewport'] ?? null) ? [
            'w' => (int)($e['viewport']['w'] ?? 0),
            'h' => (int)($e['viewport']['h'] ?? 0),
        ] : null,
        'receivedAt'   => date('c'),
        'ipHash'       => hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . LOG_SHARED_TOKEN),
    ];
}

// --- Ensure dir ---
if (!is_dir(LOG_DIR)) {
    if (!mkdir(LOG_DIR, 0755, true) && !is_dir(LOG_DIR)) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Cannot create log dir']);
        exit;
    }
}

// --- Append JSONL (satu entri per baris, tahan crash) ---
$file = LOG_DIR . '/activity-' . date('Y-m-d') . '.jsonl';
$handle = @fopen($file, 'ab');
if (!$handle) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Cannot write log']);
    exit;
}

$written = 0;
foreach ($clean as $entry) {
    $line = json_encode($entry, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($line !== false && fwrite($handle, $line . "\n") !== false) $written++;
}
fflush($handle);
fclose($handle);

@chmod($file, 0640);
@chmod(LOG_DIR, 0750);

echo json_encode(['ok' => true, 'received' => $written]);