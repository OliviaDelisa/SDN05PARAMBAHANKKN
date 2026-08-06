-- ========================================================
-- UKS DIGITAL SDN 05 PARAMBAHAN - MYSQL DATABASE SCHEMA
-- File ini dapat langsung di-import di phpMyAdmin / MySQL Workbench / DBeaver
-- Database Name: uks_digital
--
-- ⚠️  PERINGATAN — BACA SEBELUM MENJALANKAN
-- Skrip ini memuat DROP TABLE. Menjalankannya pada database yang sudah
-- berisi data akan MENGHAPUS SELURUH data siswa dan rekam kunjungan UKS
-- secara permanen. Buat cadangan terlebih dahulu.
--
-- Untuk instalasi baru, Anda TIDAK perlu file ini: jalankan `npm start`
-- dan db/initDB.js akan membentuk skema secara otomatis tanpa menghapus
-- apa pun. File ini disediakan hanya untuk import manual.
-- ========================================================

CREATE DATABASE IF NOT EXISTS uks_digital CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE uks_digital;

-- Urutan DROP mengikuti ketergantungan foreign key (anak dulu, induk terakhir)
DROP TABLE IF EXISTS kunjungan;
DROP TABLE IF EXISTS siswa;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS pengaturan_sekolah;

-- 1. Table Users (Pengguna & Akun UKS)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_lengkap VARCHAR(100) NOT NULL,
  username VARCHAR(20) UNIQUE NOT NULL COMMENT 'Huruf kecil, angka, underscore. Min 4, Max 20 karakter. Tidak boleh dimulai angka.',
  nip VARCHAR(20) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt ($2b$...). JANGAN pernah menyimpan teks biasa.',
  no_telepon VARCHAR(15),
  role ENUM('Admin', 'Dokter Kecil UKS') NOT NULL DEFAULT 'Dokter Kecil UKS',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Akun Utama Admin (username: siti_rahmawati / Pass: admin)
-- Nilai di bawah adalah hash bcrypt dari kata 'admin', BUKAN teks biasa.
-- Ganti password ini segera setelah login pertama.
INSERT INTO users (id, nama_lengkap, username, nip, no_telepon, password, role)
VALUES (1, 'Ibu Siti Rahmawati', 'siti_rahmawati', '198507152010012003', '081234567890',
        '$2b$10$nslkMokmKuq918Ch9DsPU.LNyB2eFRLuEfc1eujfXOHtntzP2.zkC', 'Admin');

-- Akun Admin dibuat lewat script agar password-nya di-hash dari .env:
--   npm run seed:admin

-- 2. Table Siswa (Database Induk Siswa SDN 05 Parambahan - Kosong Bersih)
CREATE TABLE siswa (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nis VARCHAR(20) UNIQUE NOT NULL,
  nama VARCHAR(100) NOT NULL,
  kelas VARCHAR(5) NOT NULL,
  jenis_kelamin ENUM('Laki-laki', 'Perempuan') NOT NULL,
  tanggal_lahir DATE,
  nama_wali VARCHAR(100),
  telepon_wali VARCHAR(15),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_kelas (kelas),
  INDEX idx_nama (nama)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Table Kunjungan (Rekam Kunjungan UKS - Kosong Bersih)
CREATE TABLE kunjungan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  siswa_id INT,
  siswa_nama VARCHAR(100) NOT NULL,
  siswa_nis VARCHAR(20) NOT NULL,
  kelas VARCHAR(5) NOT NULL,
  waktu_masuk DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  waktu_keluar DATETIME,
  keluhan_utama VARCHAR(255) NOT NULL,
  keterangan TEXT,
  is_darurat TINYINT(1) DEFAULT 0,
  tindakan VARCHAR(255),
  status ENUM(
    'Kembali ke Kelas',
    'Istirahat di UKS',
    'Dijemput Wali',
    'Dirujuk ke Klinik'
  ) NOT NULL DEFAULT 'Istirahat di UKS',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_waktu (waktu_masuk),
  INDEX idx_status (status),
  INDEX idx_siswa (siswa_id),
  -- ON DELETE SET NULL disengaja: saat siswa dihapus, riwayat kunjungannya
  -- HARUS tetap ada (nama/NIS/kelas sudah disalin ke baris ini), hanya
  -- tautannya yang dilepas. Rekam kesehatan tidak boleh ikut terhapus.
  CONSTRAINT fk_kunjungan_siswa FOREIGN KEY (siswa_id) REFERENCES siswa(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Table Pengaturan Sekolah
CREATE TABLE pengaturan_sekolah (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_sekolah VARCHAR(200),
  npsn VARCHAR(20),
  telepon_sekolah VARCHAR(15),
  kepala_sekolah VARCHAR(100),
  kepala_nip VARCHAR(20),
  alamat TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO pengaturan_sekolah (id, nama_sekolah, npsn, telepon_sekolah, kepala_sekolah, kepala_nip, alamat)
VALUES (1, 'SDN 05 Parambahan', '10301599', '0751234567', 'Muswar Dedi, S.Pd.', '198510082010011013', 'Jl. Pendidikan No. 5, Nagari Parambahan, Kec. Bukit Sundi, Kab. Solok');
