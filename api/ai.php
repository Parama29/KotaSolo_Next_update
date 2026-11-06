<?php

header('Content-Type: application/json; charset=utf-8');

$configFile = __DIR__ . '/config.php';

if (!is_file($configFile)) {
    http_response_code(500);
    echo json_encode([
        'error' => [
            'message' => 'Konfigurasi RuteSolo tidak ditemukan.'
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$config = require $configFile;

/*
|--------------------------------------------------------------------------
| Hanya endpoint POST
|--------------------------------------------------------------------------
*/

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode([
        'error' => [
            'message' => 'Method not allowed.'
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/*
|--------------------------------------------------------------------------
| Ambil API Key Gemini
|--------------------------------------------------------------------------
*/

$apiKey = '';

if (isset($config['gemini_api_key'])) {
    $apiKey = trim((string) $config['gemini_api_key']);
}

if ($apiKey === '') {
    $apiKey = trim((string) (getenv('GEMINI_API_KEY') ?: ''));
}

if ($apiKey === '') {
    http_response_code(503);
    echo json_encode([
        'error' => [
            'message' => 'Gemini API key belum dikonfigurasi.'
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

$model = isset($config['gemini_model'])
    ? trim((string) $config['gemini_model'])
    : '';

if ($model === '') {
    $model = trim((string) (getenv('RUTESOLO_AI_MODEL') ?: 'gemini-3.5-flash-lite'));
}

/*
|--------------------------------------------------------------------------
| Baca request JSON dari frontend
|--------------------------------------------------------------------------
*/

$rawInput = file_get_contents('php://input');

if ($rawInput === false || trim($rawInput) === '') {
    http_response_code(400);
    echo json_encode([
        'error' => [
            'message' => 'Request body kosong.'
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$payload = json_decode($rawInput, true);

if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode([
        'error' => [
            'message' => 'Format JSON tidak valid.'
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/*
|--------------------------------------------------------------------------
| Pesan terbaru
|--------------------------------------------------------------------------
*/

$message = isset($payload['message'])
    ? trim((string) $payload['message'])
    : '';

if ($message === '') {
    http_response_code(400);
    echo json_encode([
        'error' => [
            'message' => 'Pesan tidak boleh kosong.'
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/*
|--------------------------------------------------------------------------
| Batasi panjang input
|--------------------------------------------------------------------------
*/

if (mb_strlen($message) > 4000) {
    http_response_code(400);
    echo json_encode([
        'error' => [
            'message' => 'Pesan terlalu panjang.'
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/*
|--------------------------------------------------------------------------
| Riwayat percakapan
|--------------------------------------------------------------------------
|
| Frontend dapat mengirim:
|
| {
|   "message": "Ada wisata kuliner?",
|   "history": [
|      {"role":"user","text":"Halo"},
|      {"role":"model","text":"Halo, ada yang bisa saya bantu?"}
|   ]
| }
|
*/

$history = [];

if (isset($payload['history']) && is_array($payload['history'])) {
    foreach ($payload['history'] as $item) {

        if (!is_array($item)) {
            continue;
        }

        $role = isset($item['role'])
            ? (string) $item['role']
            : '';

        $text = isset($item['text'])
            ? trim((string) $item['text'])
            : '';

        /*
         * Gemini hanya menerima role user/model untuk contents.
         */
        if (!in_array($role, ['user', 'model'], true)) {
            continue;
        }

        if ($text === '') {
            continue;
        }

        if (mb_strlen($text) > 4000) {
            $text = mb_substr($text, 0, 4000);
        }

        $history[] = [
            'role' => $role,
            'parts' => [
                [
                    'text' => $text
                ]
            ]
        ];
    }
}

/*
|--------------------------------------------------------------------------
| Batasi history
|--------------------------------------------------------------------------
|
| Kita tidak perlu mengirim seluruh percakapan.
| Ambil 12 pesan terakhir.
|
*/

if (count($history) > 12) {
    $history = array_slice($history, -12);
}

/*
|--------------------------------------------------------------------------
| Ambil knowledge RuteSolo dari database
|--------------------------------------------------------------------------
*/

$knowledge = '';
$knowledgeSource = 'none';
$knowledgeError = '';

try {

    require_once __DIR__ . '/db.php';

    /*
     * Destinasi
     */
    $destinations = db()->query(
        'SELECT id, name, category, description, tags, latitude, longitude
         FROM destinations
         ORDER BY id'
    )->fetchAll();

    /*
     * Transport modes
     */
    $modes = db()->query(
        'SELECT id, slug, name
         FROM transport_modes
         ORDER BY id'
    )->fetchAll();

    /*
     * Routes
     */
    $routes = db()->query(
        'SELECT
            r.destination_id,
            d.name AS destination_name,
            m.slug AS mode_slug,
            m.name AS mode_name,
            r.description,
            r.fare,
            r.duration_minutes
         FROM routes r
         JOIN destinations d ON d.id = r.destination_id
         JOIN transport_modes m ON m.id = r.mode_id
         ORDER BY r.destination_id, r.duration_minutes'
    )->fetchAll();

    /*
     * Koneksi berhasil tapi tabel kosong (belum di-import)? Anggap gagal
     * supaya data cadangan dari file dipakai.
     */
    if (empty($destinations)) {
        throw new RuntimeException('Tabel destinations kosong.');
    }

    $knowledgeSource = 'database';

    /*
     * Format knowledge menjadi teks sederhana
     */
    $knowledge .= "DATA RESMI RUTESOLO\n\n";

    $knowledge .= "MODA TRANSPORTASI:\n";

    foreach ($modes as $mode) {
        $knowledge .= '- ' .
            $mode['name'] .
            ' (' .
            $mode['slug'] .
            ")\n";
    }

    $knowledge .= "\nDESTINASI:\n";

    foreach ($destinations as $destination) {

        $tags = [];

        if (!empty($destination['tags'])) {
            $decodedTags = json_decode(
                $destination['tags'],
                true
            );

            if (is_array($decodedTags)) {
                $tags = $decodedTags;
            }
        }

        $knowledge .= "\n";
        $knowledge .= "ID: " . $destination['id'] . "\n";
        $knowledge .= "Nama: " . $destination['name'] . "\n";
        $knowledge .= "Kategori: " . $destination['category'] . "\n";
        $knowledge .= "Deskripsi: " . $destination['description'] . "\n";

        if (!empty($tags)) {
            $knowledge .= "Tag: " . implode(', ', $tags) . "\n";
        }

        $knowledge .= "Koordinat: " .
            $destination['latitude'] .
            ", " .
            $destination['longitude'] .
            "\n";
    }

    $knowledge .= "\nRUTE TRANSPORTASI:\n";

    foreach ($routes as $route) {

        $knowledge .= "\n";
        $knowledge .= "Destinasi: " .
            $route['destination_name'] .
            "\n";

        $knowledge .= "Moda: " .
            $route['mode_name'] .
            "\n";

        $knowledge .= "Rute: " .
            $route['description'] .
            "\n";

        $knowledge .= "Tarif: " .
            $route['fare'] .
            "\n";

        $knowledge .= "Durasi: " .
            $route['duration_minutes'] .
            " menit\n";
    }

} catch (Throwable $e) {

    /*
     * Jangan kirim detail database ke browser.
     */
    $knowledgeError = get_class($e) . ': ' . $e->getMessage();

    error_log(
        'RuteSolo AI database error: ' .
        $e->getMessage()
    );

    /*
     * Database tidak terjangkau: pakai data cadangan dari file
     * (data/destinations.json) supaya AI tetap punya data resmi.
     */
    require_once __DIR__ . '/fallback.php';
    $knowledge = rutesolo_fallback_knowledge();
    $knowledgeSource = $knowledge === '' ? 'none' : 'file';

    if ($knowledge === '') {
        $knowledge = "Data database RuteSolo sedang tidak tersedia.";
    }
}

/*
|--------------------------------------------------------------------------
| System Instruction
|--------------------------------------------------------------------------
*/

$systemInstruction = <<<PROMPT
Kamu adalah RuteSolo AI, asisten virtual resmi untuk website RuteSolo.

Tugas utama:
- Membantu pengguna menemukan destinasi wisata di Solo.
- Memberikan rekomendasi berdasarkan data RuteSolo.
- Membantu memahami pilihan transportasi.
- Menjelaskan rute, tarif, dan durasi berdasarkan DATA RESMI RUTESOLO.
- Berbicara natural seperti asisten wisata sungguhan.
- Gunakan bahasa Indonesia yang ramah, jelas, dan tidak terlalu formal.

ATURAN PENTING:
1. Prioritaskan DATA RESMI RUTESOLO di bawah ini.
2. Jangan mengarang rute, tarif, durasi, atau destinasi yang tidak ada dalam data.
3. Jika informasi tidak tersedia di data, katakan bahwa informasi tersebut belum tersedia di RuteSolo.
4. Jangan mengklaim memiliki data real-time jika memang tidak diberikan.
5. Jangan menyebut dirimu sebagai Gemini.
6. Sebut dirimu sebagai RuteSolo AI.
7. Jawaban harus langsung membantu pengguna.
8. Gunakan format teks yang mudah dibaca.
9. Untuk pertanyaan sederhana, jawab singkat.
10. Untuk rekomendasi, berikan beberapa pilihan beserta alasan singkat.
11. Jika DATA RESMI RUTESOLO berisi daftar destinasi, JANGAN pernah mengatakan database tidak tersedia. Langsung berikan rekomendasi dari data tersebut.
12. Jika pengguna meminta rekomendasi tanpa detail, tawarkan 3-5 destinasi dari data beserta kategori dan alasan singkat.

DATA RESMI RUTESOLO:
{$knowledge}
PROMPT;

/*
|--------------------------------------------------------------------------
| Susun contents untuk Gemini
|--------------------------------------------------------------------------
*/

$contents = $history;

/*
 * Pesan terbaru
 */
$contents[] = [
    'role' => 'user',
    'parts' => [
        [
            'text' => $message
        ]
    ]
];

/*
|--------------------------------------------------------------------------
| Request Gemini API
|--------------------------------------------------------------------------
*/

$url =
    'https://generativelanguage.googleapis.com/v1beta/models/' .
    rawurlencode($model) .
    ':generateContent';

$requestBody = [
    'systemInstruction' => [
        'parts' => [
            [
                'text' => $systemInstruction
            ]
        ]
    ],
    'contents' => $contents,
    'generationConfig' => [
        'temperature' => 0.7,
        'maxOutputTokens' => 800
    ]
];

$jsonBody = json_encode(
    $requestBody,
    JSON_UNESCAPED_UNICODE |
    JSON_UNESCAPED_SLASHES
);

if ($jsonBody === false) {
    http_response_code(500);
    echo json_encode([
        'error' => [
            'message' => 'Gagal membuat request Gemini.'
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/*
|--------------------------------------------------------------------------
| cURL request
|--------------------------------------------------------------------------
*/

$ch = curl_init($url);

curl_setopt_array($ch, [
    CURLOPT_POST => true,

    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'x-goog-api-key: ' . $apiKey
    ],

    CURLOPT_POSTFIELDS => $jsonBody,

    CURLOPT_RETURNTRANSFER => true,

    CURLOPT_CONNECTTIMEOUT => 10,

    CURLOPT_TIMEOUT => 45,

    CURLOPT_SSL_VERIFYPEER => true,

    CURLOPT_SSL_VERIFYHOST => 2
]);

$response = curl_exec($ch);

if ($response === false) {

    $curlError = curl_error($ch);

    curl_close($ch);

    error_log(
        'RuteSolo Gemini cURL error: ' .
        $curlError
    );

    http_response_code(502);

    echo json_encode([
        'error' => [
            'message' => 'Tidak dapat terhubung ke layanan AI.'
        ]
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

$httpCode = curl_getinfo(
    $ch,
    CURLINFO_HTTP_CODE
);

curl_close($ch);

/*
|--------------------------------------------------------------------------
| Decode response
|--------------------------------------------------------------------------
*/

$data = json_decode(
    $response,
    true
);

if (!is_array($data)) {

    error_log(
        'RuteSolo Gemini invalid response: ' .
        $response
    );

    http_response_code(502);

    echo json_encode([
        'error' => [
            'message' => 'Respons AI tidak valid.'
        ]
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

/*
|--------------------------------------------------------------------------
| Handle Gemini API error
|--------------------------------------------------------------------------
*/

if ($httpCode < 200 || $httpCode >= 300) {

    $errorMessage =
        isset($data['error']['message'])
        ? $data['error']['message']
        : 'Gemini API mengembalikan error.';

    error_log(
        'RuteSolo Gemini API error [' .
        $httpCode .
        ']: ' .
        $errorMessage
    );

    http_response_code(
        $httpCode >= 400 && $httpCode < 600
            ? $httpCode
            : 502
    );

    echo json_encode([
        'error' => [
            'message' => 'Layanan AI sedang mengalami masalah.'
        ]
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

/*
|--------------------------------------------------------------------------
| Ambil text dari response Gemini
|--------------------------------------------------------------------------
*/

$reply = '';

if (
    isset($data['candidates'][0]['content']['parts']) &&
    is_array($data['candidates'][0]['content']['parts'])
) {

    foreach (
        $data['candidates'][0]['content']['parts']
        as $part
    ) {

        if (
            isset($part['text']) &&
            is_string($part['text'])
        ) {
            $reply .= $part['text'];
        }
    }
}

$reply = trim($reply);

/*
|--------------------------------------------------------------------------
| Jika Gemini tidak menghasilkan text
|--------------------------------------------------------------------------
*/

if ($reply === '') {

    error_log(
        'RuteSolo Gemini empty response: ' .
        $response
    );

    http_response_code(502);

    echo json_encode([
        'error' => [
            'message' => 'AI tidak menghasilkan jawaban.'
        ]
    ], JSON_UNESCAPED_UNICODE);

    exit;
}

/*
|--------------------------------------------------------------------------
| Response ke frontend
|--------------------------------------------------------------------------
*/

echo json_encode([
    'reply' => $reply,
    'model' => $model,
    'knowledge_source' => $knowledgeSource,
    'knowledge_error' => (!empty($config['debug']) ? $knowledgeError : null)
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

exit;
