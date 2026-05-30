# 🌿 Ruang Curhat — Portal Curhat Anonim

Website tempat berbagi cerita secara anonim, tanpa login, penuh dukungan.

---

## 📁 Struktur File

```
curhat-portal/
├── index.html       ← Halaman utama (frontend)
├── style.css        ← Stylesheet modern
├── app.js           ← Logika JavaScript (vanilla)
├── api.php          ← REST API endpoint
├── config.php       ← Konfigurasi database & helper
├── database.sql     ← Schema & seed data MySQL
└── README.md
```

---

## 🚀 Cara Setup

### 1. Siapkan Database MySQL

Masuk ke MySQL dan jalankan:

```sql
SOURCE /path/to/curhat-portal/database.sql;
```

Atau pakai **phpMyAdmin**:
- Buka tab **Import**
- Pilih file `database.sql`
- Klik **Go**

### 2. Konfigurasi Koneksi

Buka `config.php` dan sesuaikan:

```php
define('DB_HOST', 'localhost');   // Host MySQL
define('DB_PORT', '3306');        // Port (default 3306)
define('DB_NAME', 'curhat_portal');
define('DB_USER', 'root');        // ← Username MySQL kamu
define('DB_PASS', '');            // ← Password MySQL kamu
```

### 3. Upload ke Server / Jalankan Lokal

**Lokal dengan XAMPP / Laragon:**
- Copy folder `curhat-portal/` ke `htdocs/` (XAMPP) atau `www/` (Laragon)
- Akses: `http://localhost/curhat-portal/`

**Lokal dengan PHP built-in server:**
```bash
cd curhat-portal
php -S localhost:8000
```
Akses: `http://localhost:8000`

**VPS / Shared Hosting:**
- Upload semua file ke folder public (misal `/public_html/curhat/`)
- Pastikan PHP 7.4+ dan PDO MySQL extension aktif
- Akses sesuai domain kamu

---

## ✨ Fitur

| Fitur | Keterangan |
|---|---|
| Tulis Curhat | Form dengan validasi client + server |
| Nama Samaran | Otomatis generate `Anonim #xxxx` jika kosong |
| Daftar Curhat | Feed realtime, paginasi 10 per halaman |
| Balas Curhat | Siapapun bisa balas secara anonim |
| Waktu Relatif | "2 menit lalu", "3 jam lalu" (Bahasa Indonesia) |
| Mobile Ready | Responsive untuk semua ukuran layar |

---

## 🔒 Catatan Keamanan

- Semua input di-sanitize dengan `htmlspecialchars()` dan prepared statements (PDO)
- Tidak ada data pribadi yang disimpan
- Untuk production: tambahkan rate limiting di `api.php` untuk mencegah spam
- Pertimbangkan menambahkan CAPTCHA jika traffic tinggi

---

## 📋 Requirements

- PHP 7.4+
- MySQL 5.7+ / MariaDB 10.3+
- PDO & pdo_mysql extension (biasanya sudah aktif default)
- Web server (Apache/Nginx) atau PHP built-in server

---

## 🎨 Tech Stack

- **Frontend**: HTML5, CSS3 (custom), Vanilla JavaScript
- **Backend**: PHP (native, tanpa framework)
- **Database**: MySQL dengan PDO
- **Font**: Lora (display) + DM Sans (body) via Google Fonts
