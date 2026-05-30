<?php
// ============================================================
//  api.php  –  REST-ish API endpoint
//
//  GET  /api.php?action=list              → daftar curhat
//  GET  /api.php?action=replies&id=N      → balasan sebuah curhat
//  POST /api.php  body: action=post_curhat → kirim curhat baru
//  POST /api.php  body: action=post_reply  → kirim balasan
// ============================================================

require_once __DIR__ . '/config.php';

// ── CORS preflight ──────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = '';

if ($method === 'GET') {
    $action = $_GET['action'] ?? '';
} elseif ($method === 'POST') {
    // Support JSON body
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (str_contains($contentType, 'application/json')) {
        $body   = json_decode(file_get_contents('php://input'), true) ?? [];
        $action = $body['action'] ?? '';
    } else {
        $body   = $_POST;
        $action = $body['action'] ?? '';
    }
}

// ── Route ───────────────────────────────────────────────────
try {
    $db = getDB();

    switch ($action) {

        // ── Ambil daftar curhat (paginasi sederhana) ─────────
        case 'list':
            $page  = max(1, (int)($_GET['page'] ?? 1));
            $limit = 10;
            $offset = ($page - 1) * $limit;

            $stmt = $db->prepare(
                'SELECT id, nama, isi, created_at,
                        (SELECT COUNT(*) FROM balasan WHERE curhat_id = c.id) AS jumlah_balasan
                 FROM curhatan c
                 ORDER BY created_at DESC
                 LIMIT :limit OFFSET :offset'
            );
            $stmt->bindValue(':limit',  $limit,  PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            $rows = $stmt->fetchAll();

            $total = (int)$db->query('SELECT COUNT(*) FROM curhatan')->fetchColumn();

            foreach ($rows as &$r) {
                $r['time_ago']        = timeAgo($r['created_at']);
                $r['jumlah_balasan']  = (int)$r['jumlah_balasan'];
            }
            unset($r);

            jsonResponse([
                'success' => true,
                'data'    => $rows,
                'meta'    => [
                    'total'    => $total,
                    'page'     => $page,
                    'per_page' => $limit,
                    'has_more' => ($offset + $limit) < $total,
                ],
            ]);

        // ── Ambil balasan sebuah curhat ───────────────────────
        case 'replies':
            $id = (int)($_GET['id'] ?? 0);
            if ($id < 1) jsonResponse(['success' => false, 'message' => 'ID tidak valid'], 400);

            $stmt = $db->prepare(
                'SELECT id, nama, isi, created_at
                 FROM balasan
                 WHERE curhat_id = :id
                 ORDER BY created_at ASC'
            );
            $stmt->execute([':id' => $id]);
            $rows = $stmt->fetchAll();

            foreach ($rows as &$r) {
                $r['time_ago'] = timeAgo($r['created_at']);
            }
            unset($r);

            jsonResponse(['success' => true, 'data' => $rows]);

        // ── Kirim curhat baru ─────────────────────────────────
        case 'post_curhat':
            $nama = sanitize($body['nama'] ?? '');
            $isi  = sanitize($body['isi']  ?? '');

            // Validasi server-side
            if (mb_strlen($isi) < 10) {
                jsonResponse(['success' => false, 'message' => 'Curhat terlalu pendek (min. 10 karakter)'], 422);
            }
            if (mb_strlen($isi) > 2000) {
                jsonResponse(['success' => false, 'message' => 'Curhat terlalu panjang (maks. 2000 karakter)'], 422);
            }
            if (mb_strlen($nama) > 80) {
                jsonResponse(['success' => false, 'message' => 'Nama terlalu panjang (maks. 80 karakter)'], 422);
            }

            if ($nama === '') $nama = generateAnon();

            $stmt = $db->prepare(
                'INSERT INTO curhatan (nama, isi) VALUES (:nama, :isi)'
            );
            $stmt->execute([':nama' => $nama, ':isi' => $isi]);
            $newId = (int)$db->lastInsertId();

            // Kembalikan baris yang baru dibuat
            $row = $db->query(
                "SELECT id, nama, isi, created_at,
                        0 AS jumlah_balasan
                 FROM curhatan WHERE id = $newId"
            )->fetch();
            $row['time_ago'] = 'Baru saja';

            jsonResponse(['success' => true, 'message' => 'Curhat berhasil dikirim!', 'data' => $row], 201);

        // ── Kirim balasan ─────────────────────────────────────
        case 'post_reply':
            $curhatId = (int)($body['curhat_id'] ?? 0);
            $nama     = sanitize($body['nama'] ?? '');
            $isi      = sanitize($body['isi']  ?? '');

            if ($curhatId < 1) jsonResponse(['success' => false, 'message' => 'ID curhat tidak valid'], 400);
            if (mb_strlen($isi) < 2) {
                jsonResponse(['success' => false, 'message' => 'Balasan terlalu pendek (min. 2 karakter)'], 422);
            }
            if (mb_strlen($isi) > 1000) {
                jsonResponse(['success' => false, 'message' => 'Balasan terlalu panjang (maks. 1000 karakter)'], 422);
            }

            // Pastikan curhat ada
            $exists = $db->prepare('SELECT id FROM curhatan WHERE id = :id');
            $exists->execute([':id' => $curhatId]);
            if (!$exists->fetch()) {
                jsonResponse(['success' => false, 'message' => 'Curhat tidak ditemukan'], 404);
            }

            if ($nama === '') $nama = generateAnon();

            $stmt = $db->prepare(
                'INSERT INTO balasan (curhat_id, nama, isi) VALUES (:curhat_id, :nama, :isi)'
            );
            $stmt->execute([':curhat_id' => $curhatId, ':nama' => $nama, ':isi' => $isi]);
            $newId = (int)$db->lastInsertId();

            $row = $db->query(
                "SELECT id, nama, isi, created_at FROM balasan WHERE id = $newId"
            )->fetch();
            $row['time_ago'] = 'Baru saja';

            jsonResponse(['success' => true, 'message' => 'Balasan terkirim!', 'data' => $row], 201);

        default:
            jsonResponse(['success' => false, 'message' => 'Action tidak dikenal'], 400);
    }

} catch (PDOException $e) {
    // Jangan tampilkan detail error ke client di production!
    error_log('[CurhatPortal] DB Error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Terjadi kesalahan pada server'], 500);
} catch (Throwable $e) {
    error_log('[CurhatPortal] Error: ' . $e->getMessage());
    jsonResponse(['success' => false, 'message' => 'Terjadi kesalahan yang tidak terduga'], 500);
}
