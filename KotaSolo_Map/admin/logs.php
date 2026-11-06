<?php
declare(strict_types=1);

require_once __DIR__ . '/../api/log-config.php';

session_start();

// Logout
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: logs.php');
    exit;
}

// Login
$loginError = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['password'])) {
    if (hash_equals(ADMIN_PASSWORD, (string)$_POST['password'])) {
        $_SESSION['admin_ok'] = true;
        session_regenerate_id(true);
        header('Location: logs.php');
        exit;
    }
    $loginError = 'Password salah.';
}

// Download
if (($_SESSION['admin_ok'] ?? false) && isset($_GET['download'])) {
    $file = basename((string)$_GET['download']);
    $path = LOG_DIR . '/' . $file;
    if (!preg_match('/^activity-\d{4}-\d{2}-\d{2}\.jsonl$/', $file) || !is_file($path)) {
        http_response_code(404);
        exit('File not found');
    }
    $format = $_GET['format'] ?? 'jsonl';

    if ($format === 'csv') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . pathinfo($file, PATHINFO_FILENAME) . '.csv"');
        echo "\xEF\xBB\xBF";
        $out = fopen('php://output', 'w');
        $fields = ['id','sessionId','type','time','userLat','userLng','userAccuracy',
                   'destinationId','destinationName','destinationCategory','destinationLat','destinationLng',
                   'route','routeUrl','description','category','layer','visible','theme',
                   'nearbyCount','radiusMeters','movedMeters','accuracy','url','ipHash','receivedAt'];
        fputcsv($out, $fields);
        $fh = fopen($path, 'r');
        while (($line = fgets($fh)) !== false) {
            $e = json_decode($line, true);
            if (!is_array($e)) continue;
            fputcsv($out, [
                $e['id'] ?? '', $e['sessionId'] ?? '', $e['type'] ?? '', $e['time'] ?? '',
                $e['userPoint']['lat'] ?? '', $e['userPoint']['lng'] ?? '', $e['userPoint']['accuracy'] ?? '',
                $e['destination']['id'] ?? '', $e['destination']['name'] ?? '', $e['destination']['category'] ?? '',
                $e['destination']['lat'] ?? '', $e['destination']['lng'] ?? '',
                $e['route'] ?? '', $e['routeUrl'] ?? '', $e['description'] ?? '',
                $e['category'] ?? '', $e['layer'] ?? '', $e['visible'] ?? '', $e['theme'] ?? '',
                $e['nearbyCount'] ?? '', $e['radiusMeters'] ?? '', $e['movedMeters'] ?? '',
                $e['accuracy'] ?? '', $e['url'] ?? '', $e['ipHash'] ?? '', $e['receivedAt'] ?? '',
            ]);
        }
        fclose($fh);
        fclose($out);
        exit;
    }

    // JSON
    header('Content-Type: application/json; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . pathinfo($file, PATHINFO_FILENAME) . '.json"');
    $entries = [];
    $fh = fopen($path, 'r');
    while (($line = fgets($fh)) !== false) {
        $e = json_decode($line, true);
        if (is_array($e)) $entries[] = $e;
    }
    fclose($fh);
    echo json_encode($entries, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Activity Log — Admin</title>
<style>
  body { font-family: system-ui, sans-serif; background: #241916; color: #f2eadb; margin: 0; padding: 24px; }
  h1 { font-size: 20px; margin: 0; }
  a { color: #c49a58; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 16px; }
  th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid rgba(242,234,219,0.1); }
  th { background: #30221d; position: sticky; top: 0; }
  tr:hover { background: #2a1d18; }
  .btn { display: inline-block; padding: 8px 14px; border-radius: 8px; background: #a84b36; color: #fff; text-decoration: none; font-size: 13px; margin-right: 6px; border: 0; cursor: pointer; }
  .btn--ghost { background: transparent; border: 1px solid #c49a58; color: #c49a58; }
  .login-box { max-width: 320px; margin: 100px auto; padding: 32px; background: #30221d; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
  .login-box input { width: 100%; padding: 10px; margin: 10px 0; border-radius: 6px; border: 1px solid #c49a58; background: #241916; color: inherit; box-sizing: border-box; font-size: 14px; }
  .login-box button { width: 100%; padding: 10px; background: #a84b36; color: #fff; border: 0; border-radius: 6px; cursor: pointer; font-weight: 600; }
  .error { color: #ff8b7a; font-size: 13px; margin-top: 8px; }
  .empty { opacity: 0.6; text-align: center; padding: 40px; }
  .stats { display: flex; gap: 24px; margin: 16px 0; font-size: 14px; color: #c8b9a7; }
  .stats strong { color: #c49a58; font-size: 20px; display: block; }
  code { font-size: 12px; opacity: 0.85; }
</style>
</head>
<body>

<?php if (!($_SESSION['admin_ok'] ?? false)): ?>
  <div class="login-box">
    <h1 style="text-align:center;">🔒 Admin Logs</h1>
    <p style="font-size:12px;opacity:0.6;text-align:center;margin:4px 0 16px;">Akses khusus pemilik web.</p>
    <form method="POST">
      <input type="password" name="password" placeholder="Password admin" autofocus required>
      <button type="submit">Masuk</button>
    </form>
    <?php if ($loginError): ?>
      <p class="error"><?= htmlspecialchars($loginError) ?></p>
    <?php endif; ?>
  </div>
<?php else: ?>

  <?php
    $files = [];
    if (is_dir(LOG_DIR)) {
        foreach (glob(LOG_DIR . '/activity-*.jsonl') ?: [] as $f) {
            $n = 0;
            $fh = fopen($f, 'r');
            while (fgets($fh) !== false) $n++;
            fclose($fh);
            $files[] = [
                'name'  => basename($f),
                'size'  => filesize($f),
                'mtime' => filemtime($f),
                'lines' => $n,
            ];
        }
        usort($files, fn($a, $b) => $b['mtime'] <=> $a['mtime']);
    }
    $totalEntries = array_sum(array_column($files, 'lines'));
  ?>

  <div style="display:flex; justify-content:space-between; align-items:center;">
    <h1>📊 Activity Log</h1>
    <a href="?logout=1" class="btn btn--ghost">Logout</a>
  </div>

  <div class="stats">
    <div><strong><?= count($files) ?></strong>file harian</div>
    <div><strong><?= number_format($totalEntries) ?></strong>total entri</div>
  </div>

  <?php if (empty($files)): ?>
    <div class="empty">Belum ada log. Data akan masuk setelah pengguna membuka peta.</div>
  <?php else: ?>
    <table>
      <thead>
        <tr>
          <th>File</th>
          <th>Ukuran</th>
          <th>Entri</th>
          <th>Diperbarui</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($files as $f): ?>
          <tr>
            <td><code><?= htmlspecialchars($f['name']) ?></code></td>
            <td><?= number_format($f['size'] / 1024, 1) ?> KB</td>
            <td><?= number_format($f['lines']) ?></td>
            <td><?= date('Y-m-d H:i:s', $f['mtime']) ?></td>
            <td>
              <a class="btn" href="?download=<?= urlencode($f['name']) ?>&format=jsonl">JSON</a>
              <a class="btn btn--ghost" href="?download=<?= urlencode($f['name']) ?>&format=csv">CSV</a>
            </td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  <?php endif; ?>

<?php endif; ?>

</body>
</html>