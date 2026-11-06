<?php
$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    throw new RuntimeException('Database configuration missing.');
}
$config = require $configFile;
$GLOBALS['_dbConfig'] = isset($config['db']) ? $config['db'] : array();

function db()
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $db = $GLOBALS['_dbConfig'];
    $charset = isset($db['charset']) ? $db['charset'] : 'utf8mb4';
    $dsn = 'mysql:host=' . $db['host'] . ';port=' . (int)$db['port'] . ';dbname=' . $db['name'] . ';charset=' . $charset;
    $pdo = new PDO($dsn, $db['user'], $db['password'], array(
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::ATTR_TIMEOUT            => 5, // jangan menggantung kalau host DB tidak terjangkau
    ));
    $pdo->exec("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
    $pdo->exec("SET CHARACTER SET utf8mb4");
    return $pdo;
}
