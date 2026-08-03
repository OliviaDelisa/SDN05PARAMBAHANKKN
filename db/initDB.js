import mysql from 'mysql2/promise'
import pool from './db.js'
import dotenv from 'dotenv'

dotenv.config()

export async function initDatabase() {
  let host = process.env.DB_HOST || '127.0.0.1'
  let port = parseInt(process.env.DB_PORT || '3306', 10)

  if (host.includes(':')) {
    const parts = host.split(':')
    host = parts[0]
    port = parseInt(parts[1], 10) || 3306
  }

  const user = process.env.DB_USER || 'root'
  const password = process.env.DB_PASSWORD || ''
  const dbName = process.env.DB_NAME || 'uks_digital'

  try {
    console.log(`🔄 Connecting to MySQL server at 127.0.0.1:${port}...`)
    const rootConnection = await mysql.createConnection({ host: '127.0.0.1', port, user, password })
    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`)
    await rootConnection.end()
    console.log(`✅ MySQL Database \`${dbName}\` verified / created successfully!`)

    console.log('🔄 Initializing MySQL Schema Tables...')

    // Users Table — pakai username, bukan email
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_lengkap VARCHAR(100) NOT NULL,
        username VARCHAR(20) UNIQUE NOT NULL,
        nip VARCHAR(20) UNIQUE NOT NULL,
        no_telepon VARCHAR(15),
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'Petugas UKS',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    // Migrasi: jika kolom email masih ada (tabel lama), tambah kolom username
    try {
      const [cols] = await pool.query(`SHOW COLUMNS FROM users LIKE 'email'`)
      if (cols.length > 0) {
        console.log('🔄 Migrasi: mengganti kolom email → username...')
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(20) UNIQUE`)
        // Isi username dari NIP untuk user yang sudah ada
        await pool.query(`UPDATE users SET username = LOWER(CONCAT('user_', nip)) WHERE username IS NULL OR username = ''`)
        await pool.query(`ALTER TABLE users DROP COLUMN email`)
        console.log('✅ Migrasi kolom email → username selesai!')
      }
    } catch (migErr) {
      // Kolom sudah benar, abaikan
    }

    // Seed default admin user jika tabel masih kosong
    const [users] = await pool.query('SELECT COUNT(*) as count FROM users')
    if (users[0].count === 0) {
      await pool.query(`
        INSERT INTO users (nama_lengkap, username, nip, no_telepon, password, role)
        VALUES ('Ibu Siti Rahmawati', 'siti_rahmawati', '198507152010012003', '081234567890', 'admin', 'Petugas UKS Utama')
      `)
      console.log('🌱 Seeded Default Admin User (username: siti_rahmawati / Pass: admin)')
    }

    // Siswa Table
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    // Kunjungan Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS kunjungan (
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
    `)

    // Pengaturan Sekolah Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pengaturan_sekolah (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_sekolah VARCHAR(200),
        npsn VARCHAR(20),
        telepon_sekolah VARCHAR(15),
        kepala_sekolah VARCHAR(100),
        alamat TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    const [sekolah] = await pool.query('SELECT COUNT(*) as count FROM pengaturan_sekolah')
    if (sekolah[0].count === 0) {
      await pool.query(`
        INSERT INTO pengaturan_sekolah (id, nama_sekolah, npsn, telepon_sekolah, kepala_sekolah, alamat)
        VALUES (1, 'SDN 05 Parambahan', '10303456', '0751234567', 'Bapak Ahmad Fauzi, S.Pd.', 'Jl. Pendidikan No. 5, Nagari Parambahan, Kec. Bukit Sundi, Kab. Solok')
      `)
    }

    console.log('✅ MySQL Database Schema Fully Connected & Prepared!')
    return true
  } catch (err) {
    console.warn(`⚠️ MySQL Error: ${err.message}`)
    return false
  }
}

if (process.argv[1]?.endsWith('initDB.js')) {
  initDatabase().then(() => process.exit(0))
}
