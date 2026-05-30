<?php
// ============================================================
//  config.php  –  Konfigurasi koneksi database
//  Sesuaikan nilai-nilai di bawah dengan server kamu
// ============================================================

define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'curhat_portal');
define('DB_USER', 'root');        // ← ganti dengan username MySQL kamu
define('DB_PASS', '');            // ← ganti dengan password MySQL kamu
define('DB_CHARSET', 'utf8mb4');

/**
 * Membuat dan mengembalikan koneksi PDO.
 * Akan melempar PDOException jika koneksi gagal.
 */
function getDB(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            DB_HOST, DB_PORT, DB_NAME, DB_CHARSET
        );

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    }

    return $pdo;
}

// Header helper: kirim JSON dan stop
function jsonResponse(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    // Izinkan request dari localhost (dev)
    header('Access-Control-Allow-Origin: *');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// Sanitasi input teks biasa
function sanitize(string $input): string
{
    return trim(htmlspecialchars($input, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
}

// Generate nama anonim otomatis
function generateAnon(): string
{
    return 'Anonim #' . str_pad(random_int(1, 9999), 4, '0', STR_PAD_LEFT);
}

// Format waktu relatif (dalam Bahasa Indonesia)
function timeAgo(string $datetime): string
{
    $diff = time() - strtotime($datetime);

    if ($diff < 60)         return 'Baru saja';
    if ($diff < 3600)       return floor($diff / 60) . ' menit lalu';
    if ($diff < 86400)      return floor($diff / 3600) . ' jam lalu';
    if ($diff < 2592000)    return floor($diff / 86400) . ' hari lalu';
    if ($diff < 31536000)   return floor($diff / 2592000) . ' bulan lalu';
    return floor($diff / 31536000) . ' tahun lalu';
}
