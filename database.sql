-- Portal Curhat Anonim - Database Schema
-- Run this SQL on your MySQL server to set up the database

CREATE DATABASE IF NOT EXISTS curhat_portal 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE curhat_portal;

-- Table: curhatan (main posts)
CREATE TABLE IF NOT EXISTS curhatan (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nama        VARCHAR(80)   NOT NULL DEFAULT 'Anonim',
    isi         TEXT          NOT NULL,
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: balasan (replies)
CREATE TABLE IF NOT EXISTS balasan (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    curhat_id     INT UNSIGNED NOT NULL,
    nama          VARCHAR(80)  NOT NULL DEFAULT 'Anonim',
    isi           TEXT         NOT NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (curhat_id) REFERENCES curhatan(id) ON DELETE CASCADE,
    INDEX idx_curhat_id (curhat_id),
    INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data (optional, for demo purposes)
INSERT INTO curhatan (nama, isi, created_at) VALUES
('Anonim #4721', 'Kadang aku merasa seperti orang asing di tengah keramaian. Senyum terus tapi di dalam lelah banget. Apakah ada yang merasakan hal yang sama?', NOW() - INTERVAL 2 HOUR),
('Anonim #8834', 'Baru saja putus setelah 3 tahun bersama. Rasanya kayak dirobek dari dalam. Tapi aku percaya semua ada hikmahnya.', NOW() - INTERVAL 5 HOUR),
('Anonim #1209', 'Hari ini akhirnya aku berani bilang "tidak" ke atasan yang selalu minta lembur tanpa bayar. Deg-degan banget tapi legaaaa.', NOW() - INTERVAL 1 DAY);

INSERT INTO balasan (curhat_id, nama, isi, created_at) VALUES
(1, 'Anonim #3311', 'Aku juga sering ngerasain itu. Kamu ga sendirian. Semoga kamu baik-baik saja ya 💙', NOW() - INTERVAL 1 HOUR),
(2, 'Anonim #5542', 'Sabar ya, waktu akan menyembuhkan segalanya. Percayalah kamu layak dapat yang lebih baik!', NOW() - INTERVAL 4 HOUR);
