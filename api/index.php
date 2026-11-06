<?php

header('Content-Type: application/json; charset=utf-8');
$config = is_file(__DIR__ . '/config.php') ? require __DIR__ . '/config.php' : array();
header('Access-Control-Allow-Origin: ' . (isset($config['cors_origin']) ? $config['cors_origin'] : '*'));
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function respond($data, $status = 200)
{
    http_response_code($status);
    echo json_encode(array('data' => $data), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail($message, $status)
{
    http_response_code($status);
    echo json_encode(array('error' => array('message' => $message)), JSON_UNESCAPED_UNICODE);
    exit;
}

function setupFail($code, $message)
{
    http_response_code(503);
    echo json_encode(array(
        'error' => array(
            'code'    => $code,
            'message' => $message,
        ),
    ), JSON_UNESCAPED_UNICODE);
    exit;
}

function integerParam($name, $required = false)
{
    $value = isset($_GET[$name]) ? $_GET[$name] : null;
    if ($value === null || $value === '') {
        if ($required) fail("Parameter '{$name}' diperlukan.", 400);
        return null;
    }
    if (filter_var($value, FILTER_VALIDATE_INT) === false || (int) $value < 1) {
        fail("Parameter '{$name}' harus integer positif.", 400);
    }
    return (int) $value;
}

function coordinate($name)
{
    $value = isset($_GET[$name]) ? $_GET[$name] : null;
    if ($value === null || $value === '') return null;
    if (!is_numeric($value) || !is_finite((float) $value)) fail("Parameter '{$name}' harus numerik.", 400);
    $number = (float) $value;
    if ($name === 'origin_lat' && ($number < -90 || $number > 90)) fail('origin_lat harus -90 hingga 90.', 400);
    if ($name === 'origin_lng' && ($number < -180 || $number > 180)) fail('origin_lng harus -180 hingga 180.', 400);
    return $number;
}

function routeCodeParam($required = false)
{
    $value = isset($_GET['route_code']) ? $_GET['route_code'] : null;
    if ($value === null || $value === '') {
        if ($required) fail("Parameter 'route_code' diperlukan.", 400);
        return null;
    }
    if (!is_string($value) || !preg_match('/^[A-Za-z0-9_-]{1,20}$/D', $value)) {
        fail("Parameter 'route_code' tidak valid.", 400);
    }
    return $value;
}

/*
 * Cadangan berbasis file: dipakai saat database tidak bisa dihubungi
 * (kredensial salah, host tidak terjangkau, tabel belum di-import).
 * Sumber data: /data/stops.json dan /data/routes/{KODE}.json
 */
function fileFallback($path)
{
    $dir = dirname(__DIR__) . '/data';

    if ($path === 'destinations') {
        $rows = array();
        foreach (rutesolo_fallback_destinations() as $d) {
            $rows[] = array(
                'id'          => (int) $d['id'],
                'name'        => (string) $d['name'],
                'category'    => isset($d['category']) ? (string) $d['category'] : '',
                'description' => isset($d['description']) ? (string) $d['description'] : '',
                'tags'        => (isset($d['tags']) && is_array($d['tags'])) ? $d['tags'] : array(),
                'latitude'    => (float) $d['latitude'],
                'longitude'   => (float) $d['longitude'],
                'image_url'   => isset($d['image_url']) ? $d['image_url'] : null,
            );
        }
        if (!$rows) return;
        header('X-Data-Source: file-fallback');
        respond($rows);
    }

    if ($path === 'modes') {
        header('X-Data-Source: file-fallback');
        respond(rutesolo_fallback_modes());
    }

    if ($path === 'routes') {
        $destinationId = integerParam('destination_id');
        $modeId        = integerParam('mode_id');
        $rows = array();
        foreach (rutesolo_fallback_routes() as $r) {
            if ($destinationId !== null && $r['destination_id'] !== $destinationId) continue;
            if ($modeId !== null && $r['mode_id'] !== $modeId) continue;
            $rows[] = $r;
        }
        if (!$rows) return;
        header('X-Data-Source: file-fallback');
        respond($rows);
    }

    if ($path === 'stops') {
        $file = $dir . '/stops.json';
        if (!is_file($file)) return;
        $rows = json_decode((string) file_get_contents($file), true);
        if (!is_array($rows)) return;
        $routeCode = routeCodeParam();
        $stops = array();
        foreach ($rows as $row) {
            if (!is_array($row) || count($row) < 4) continue;
            $codes = (isset($row[4]) && is_array($row[4])) ? $row[4] : array();
            if ($routeCode !== null && !in_array($routeCode, $codes, true)) continue;
            $hub = !empty($row[5]);
            $services = array();
            foreach ($codes as $code) {
                $services[] = array('route_code' => (string) $code, 'is_departure_hub' => $hub);
            }
            $stops[] = array(
                'id'        => (int) $row[0],
                'name'      => (string) $row[1],
                'latitude'  => (float) $row[2],
                'longitude' => (float) $row[3],
                'services'  => $services,
            );
        }
        header('X-Data-Source: file-fallback');
        respond($stops);
    }

    if ($path === 'transit-routes') {
        // Sama dengan isi tabel transit_routes di schema.sql (null = tidak diketahui)
        $loops = array('F8' => true, 'F10' => true, 'S1' => null, 'S2' => null);
        $routeCode = routeCodeParam();

        if ($routeCode === null) {
            $codes = array();
            $files = glob($dir . '/routes/*.json');
            if (!$files) return;
            foreach ($files as $f) $codes[] = basename($f, '.json');
            sort($codes);
            $list = array();
            foreach ($codes as $code) {
                $list[] = array(
                    'route_code' => $code,
                    'is_loop'    => array_key_exists($code, $loops) ? $loops[$code] : false,
                );
            }
            header('X-Data-Source: file-fallback');
            respond($list);
        }

        // $routeCode sudah divalidasi regex [A-Za-z0-9_-], aman dari path traversal
        $file = $dir . '/routes/' . $routeCode . '.json';
        if (!is_file($file)) return;
        $json = json_decode((string) file_get_contents($file), true);
        if (!is_array($json) || empty($json['segments']) || !is_array($json['segments'])) return;
        header('X-Data-Source: file-fallback');
        respond(array(
            'route_code' => $routeCode,
            'is_loop'    => array_key_exists($routeCode, $loops) ? $loops[$routeCode] : false,
            'segments'   => array_values($json['segments']),
            'stops'      => array(),
        ));
    }
}

require_once __DIR__ . '/fallback.php';

$path = parse_url(isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '', PHP_URL_PATH);
if (!$path) $path = '';
$path = preg_replace('#^.*/api(?:/index\.php)?#', '', $path);
$path = trim($path, '/');
if ($path === '' && isset($_GET['path']) && is_string($_GET['path'])) {
    $path = trim($_GET['path'], '/');
}

try {
    if (!is_file(__DIR__ . '/config.php')) {
        fileFallback($path);
        setupFail('database_config_missing', 'Konfigurasi database belum tersedia.');
    }
    require __DIR__ . '/db.php';
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') fail('Method not allowed.', 405);

    if ($path === 'health') {
        try {
            db()->query('SELECT 1')->fetchColumn();
            $requiredTables = array(
                'destinations',
                'transport_modes',
                'routes',
                'transit_routes',
                'transport_stops',
                'route_stop_services',
                'route_stop_labels',
                'route_geometry_points',
            );
            $placeholders = implode(',', array_fill(0, count($requiredTables), '?'));
            $tableQuery = db()->prepare(
                'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN (' . $placeholders . ')'
            );
            $tableQuery->execute($requiredTables);
            if ((int) $tableQuery->fetchColumn() !== count($requiredTables)) {
                setupFail('schema_missing', 'Schema belum lengkap.');
            }
            respond(array('status' => 'ok', 'database' => 'connected', 'schema' => 'ready'));
        } catch (PDOException $error) {
            error_log('RuteSolo health database error: ' . $error->getMessage());
            setupFail('database_unavailable', 'Koneksi database gagal.');
        }
    }

    if ($path === 'destinations') {
        $rows = db()->query('SELECT id, name, category, description, tags, latitude, longitude, image_url FROM destinations ORDER BY id')->fetchAll();
        foreach ($rows as &$row) {
            $row['id']        = (int)   $row['id'];
            $row['latitude']  = (float) $row['latitude'];
            $row['longitude'] = (float) $row['longitude'];
            $decodedTags = $row['tags'] === null ? array() : json_decode($row['tags'], true);
            $row['tags'] = is_array($decodedTags) ? $decodedTags : array();
        }
        respond($rows);
    }

    if ($path === 'modes') {
        $rows = db()->query('SELECT id, slug, name, icon, color FROM transport_modes ORDER BY id')->fetchAll();
        foreach ($rows as &$row) $row['id'] = (int) $row['id'];
        respond($rows);
    }

    if ($path === 'routes') {
        $destinationId = integerParam('destination_id');
        $modeId        = integerParam('mode_id');
        $lat           = coordinate('origin_lat');
        $lng           = coordinate('origin_lng');
        if (($lat === null) !== ($lng === null)) fail('origin_lat dan origin_lng harus disediakan bersama.', 400);
        $sql    = 'SELECT r.id, r.destination_id, d.name AS destination_name, r.mode_id, m.slug AS mode, m.name AS mode_name, r.description, r.fare, r.duration_minutes, d.latitude, d.longitude FROM routes r JOIN destinations d ON d.id=r.destination_id JOIN transport_modes m ON m.id=r.mode_id WHERE 1=1';
        $params = array();
        if ($destinationId !== null) { $sql .= ' AND r.destination_id = :destination_id'; $params['destination_id'] = $destinationId; }
        if ($modeId        !== null) { $sql .= ' AND r.mode_id = :mode_id';               $params['mode_id']        = $modeId; }
        if ($lat !== null) {
            $sql .= ' ORDER BY (6371 * ACOS(LEAST(1, GREATEST(-1, COS(RADIANS(:lat1))*COS(RADIANS(d.latitude))*COS(RADIANS(d.longitude)-RADIANS(:lng))*1+SIN(RADIANS(:lat2))*SIN(RADIANS(d.latitude)))))) ASC, r.duration_minutes ASC';
            $params['lat1'] = $lat;
            $params['lat2'] = $lat;
            $params['lng']  = $lng;
        } else {
            $sql .= ' ORDER BY r.destination_id, r.duration_minutes';
        }
        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['id']               = (int)   $row['id'];
            $row['destination_id']   = (int)   $row['destination_id'];
            $row['mode_id']          = (int)   $row['mode_id'];
            $row['duration_minutes'] = (int)   $row['duration_minutes'];
            $row['latitude']         = (float) $row['latitude'];
            $row['longitude']        = (float) $row['longitude'];
        }
        respond($rows);
    }

    if ($path === 'stops') {
        $routeCode = routeCodeParam();
        $sql = 'SELECT s.id, s.stop_name, s.latitude, s.longitude, svc.route_code, svc.is_departure_hub
                FROM transport_stops s
                LEFT JOIN route_stop_services svc ON svc.stop_id = s.id';
        $params = array();
        if ($routeCode !== null) {
            $sql .= ' WHERE svc.route_code = :route_code';
            $params['route_code'] = $routeCode;
        }
        $sql .= ' ORDER BY s.id, svc.route_code';
        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        $stops = array();
        foreach ($rows as $row) {
            $stopId = (int) $row['id'];
            if (!isset($stops[$stopId])) {
                $stops[$stopId] = array(
                    'id' => $stopId,
                    'name' => $row['stop_name'],
                    'latitude' => (float) $row['latitude'],
                    'longitude' => (float) $row['longitude'],
                    'services' => array(),
                );
            }
            if ($row['route_code'] !== null) {
                $stops[$stopId]['services'][] = array(
                    'route_code' => $row['route_code'],
                    'is_departure_hub' => (bool) $row['is_departure_hub'],
                );
            }
        }
        respond(array_values($stops));
    }

    if ($path === 'transit-routes') {
        $routeCode = routeCodeParam();
        if ($routeCode === null) {
            $rows = db()->query('SELECT route_code, is_loop FROM transit_routes ORDER BY route_code')->fetchAll();
            foreach ($rows as &$row) {
                $row['is_loop'] = $row['is_loop'] === null ? null : (bool) $row['is_loop'];
            }
            respond($rows);
        }

        $routeQuery = db()->prepare('SELECT is_loop FROM transit_routes WHERE route_code = :route_code');
        $routeQuery->execute(array('route_code' => $routeCode));
        $route = $routeQuery->fetch();
        if (!$route) fail('Rute transit tidak ditemukan.', 404);

        $geometryQuery = db()->prepare(
            'SELECT segment_index, point_order, longitude, latitude
             FROM route_geometry_points
             WHERE route_code = :route_code
             ORDER BY segment_index, point_order'
        );
        $geometryQuery->execute(array('route_code' => $routeCode));
        $geometryRows = $geometryQuery->fetchAll();
        if (!$geometryRows) {
            error_log('RuteSolo API transit geometry missing for route: ' . $routeCode);
            fileFallback($path);
            setupFail('schema_incomplete', 'Geometri rute transit belum tersedia.');
        }

        $segments = array();
        foreach ($geometryRows as $row) {
            $segmentIndex = (int) $row['segment_index'];
            if (!isset($segments[$segmentIndex])) $segments[$segmentIndex] = array();
            $segments[$segmentIndex][] = array((float) $row['longitude'], (float) $row['latitude']);
        }

        $stopsQuery = db()->prepare(
            'SELECT stop_name, vertex_index
             FROM route_stop_labels
             WHERE route_code = :route_code
             ORDER BY vertex_index, stop_name'
        );
        $stopsQuery->execute(array('route_code' => $routeCode));
        $routeStops = array();
        foreach ($stopsQuery->fetchAll() as $row) {
            $routeStops[] = array(
                'name' => $row['stop_name'],
                'vertex' => (int) $row['vertex_index'],
            );
        }

        respond(array(
            'route_code' => $routeCode,
            'is_loop' => $route['is_loop'] === null ? null : (bool) $route['is_loop'],
            'segments' => array_values($segments),
            'stops' => $routeStops,
        ));
    }

    fail('Endpoint not found.', 404);

} catch (PDOException $error) {
    error_log('RuteSolo API database error: ' . $error->getMessage());
    fileFallback($path);
    setupFail('database_unavailable', 'Database tidak tersedia.');
} catch (Throwable $error) {
    error_log('RuteSolo API runtime error: ' . $error->getMessage());
    fail('Internal server error.', 500);
}
