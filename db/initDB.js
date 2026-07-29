import pool from './db.js'

export async function initDatabase() {
  try {
    console.log('🔄 Initializing MySQL Database Schema...')

    // 1. Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_lengkap VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE,
        nip VARCHAR(20),
        no_telepon VARCHAR(15),
        password_hash VARCHAR(255),
        role ENUM('petugas', 'admin') DEFAULT 'petugas',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // 2. Siswa Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS siswa (
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
      );
    `)

    // 3. Kunjungan Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS kunjungan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        siswa_id INT NOT NULL,
        petugas_id INT,
        waktu_masuk DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        waktu_keluar DATETIME,
        keluhan_utama VARCHAR(255) NOT NULL,
        keterangan TEXT,
        is_darurat BOOLEAN DEFAULT FALSE,
        tindakan VARCHAR(255),
        status ENUM(
          'Kembali ke Kelas',
          'Istirahat di UKS',
          'Dijemput Wali',
          'Dirujuk ke Klinik'
        ) NOT NULL DEFAULT 'Istirahat di UKS',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
        FOREIGN KEY (petugas_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_waktu (waktu_masuk),
        INDEX idx_siswa (siswa_id),
        INDEX idx_status (status),
        INDEX idx_darurat (is_darurat)
      );
    `)

    // 4. Pengaturan Sekolah Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pengaturan_sekolah (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_sekolah VARCHAR(200),
        npsn VARCHAR(20),
        telepon_sekolah VARCHAR(15),
        kepala_sekolah VARCHAR(100),
        alamat TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `)

    console.log('✅ MySQL Database Tables Initialized Successfully!')
  } catch (err) {
    console.warn('⚠️ Database initialization notice (MySQL connection might be offline):', err.message)
  }
}

// Allow direct CLI execution: node db/initDB.js
if (process.argv[1]?.endsWith('initDB.js')) {
  initDatabase().then(() => process.exit(0))
}
