-- ========================================================
-- UKS DIGITAL SDN 05 PARAMBAHAN - MYSQL DATABASE SCHEMA
-- File ini dapat langsung di-import di phpMyAdmin / MySQL Workbench / DBeaver
-- Database Name: uks_digital
-- ========================================================

CREATE DATABASE IF NOT EXISTS uks_digital CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE uks_digital;

-- 1. Table Users (Pengguna & Akun Petugas/Dokter Kecil)
DROP TABLE IF EXISTS kunjungan;
DROP TABLE IF EXISTS siswa;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS pengaturan_sekolah;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_lengkap VARCHAR(100) NOT NULL,
  username VARCHAR(20) UNIQUE NOT NULL COMMENT 'Huruf kecil, angka, underscore. Min 4, Max 20 karakter. Tidak boleh dimulai angka.',
  nip VARCHAR(20) UNIQUE NOT NULL,
  no_telepon VARCHAR(15),
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'Petugas UKS',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Akun Utama Petugas UKS (username: siti_rahmawati / Pass: admin)
INSERT INTO users (id, nama_lengkap, username, nip, no_telepon, password, role)
VALUES (1, 'Ibu Siti Rahmawati', 'siti_rahmawati', '198507152010012003', '081234567890', 'admin', 'Petugas UKS Utama');

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
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Table Pengaturan Sekolah
CREATE TABLE pengaturan_sekolah (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_sekolah VARCHAR(200),
  npsn VARCHAR(20),
  telepon_sekolah VARCHAR(15),
  kepala_sekolah VARCHAR(100),
  alamat TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO pengaturan_sekolah (id, nama_sekolah, npsn, telepon_sekolah, kepala_sekolah, alamat)
VALUES (1, 'SDN 05 Parambahan', '10303456', '0751234567', 'Bapak Ahmad Fauzi, S.Pd.', 'Jl. Pendidikan No. 5, Nagari Parambahan, Kec. Bukit Sundi, Kab. Solok');
