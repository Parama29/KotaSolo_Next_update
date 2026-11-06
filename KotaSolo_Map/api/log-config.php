<?php
declare(strict_types=1);

/**
 * Konfigurasi sistem log aktivitas.
 * GANTI nilai di bawah sebelum deploy.
 */

// Shared token — harus sama dengan CONFIG.log.token di js/map-config.js
// Meski terlihat di browser, ini hanya mencegah POST liar dari luar.
// Untuk keamanan lebih, gunakan HTTPS + origin check (sudah ada).
const LOG_SHARED_TOKEN = 'GANTI-DENGAN-STRING-ACAK-MIN-32-KARAKTER-xxxxxxxxxxxx';

// Password panel admin — hanya pemilik web yang tahu.
const ADMIN_PASSWORD = 'GANTI-PASSWORD-ADMIN-ANDA-YANG-KUAT';

// Origin yang diizinkan mengirim log.
const ALLOWED_ORIGINS = [
    'http://localhost',
    'http://127.0.0.1',
    // 'https://domain-anda.com',  ← tambahkan domain produksi
];

// Folder penyimpanan log.
// OPSI A (paling aman): di luar public_html
// const LOG_DIR = __DIR__ . '/../../logs';
// OPSI B: di dalam project (butuh .htaccess proteksi — lihat logs/.htaccess)
const LOG_DIR = __DIR__ . '/../logs';

const MAX_ENTRIES_PER_REQUEST = 500;
const MAX_BODY_BYTES = 1024 * 1024; // 1 MB