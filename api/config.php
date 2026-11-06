<?php

return [
    'db' => [
        'host'     => getenv('RUTESOLO_DB_HOST') ?: 'sql306.infinityfree.com',
        'port'     => (int) (getenv('RUTESOLO_DB_PORT') ?: 3306),
        'name'     => getenv('RUTESOLO_DB_NAME') ?: 'if0_43005606_db',
        'user'     => getenv('RUTESOLO_DB_USER') ?: 'if0_43005606',
        'password' => getenv('RUTESOLO_DB_PASSWORD') ?: 'PASSWORD_DATABASE',
        'charset'  => getenv('RUTESOLO_DB_CHARSET') ?: 'utf8mb4',
    ],

    'cors_origin' => getenv('RUTESOLO_CORS_ORIGIN') ?: '*',

    'gemini_api_key' => 'AQ.Ab8RN6Kmte_J-IBk5WX1zX9VZmJY_7d23Mfq1MK8HmbRwQ9sgQ',
    // Sementara true untuk diagnosa; set false setelah chatbot beres.
    'debug' => true,

    'gemini_model'   => 'gemini-3.5-flash-lite',
];
