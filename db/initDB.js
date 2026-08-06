import mysql from 'mysql2/promise'
import bcrypt from 'bcrypt'
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
    console.log(`🔄 Connecting to MySQL server at ${host}:${port}...`)
    const rootConnection = await mysql.createConnection({ host, port, user, password })
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
        role VARCHAR(50) DEFAULT 'Dokter Kecil UKS',
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
      // Bukan error fatal, tapi jangan dibiarkan bisu — kalau migrasi gagal,
      // penyebabnya perlu terlihat di log.
      console.warn('⚠️  Blok migrasi email → username dilewati:', migErr.message)
    }

    // Migrasi: batasi `role` ke dua nilai resmi.
    // Sebelumnya kolom ini VARCHAR bebas dan sudah tumbuh menjadi beberapa
    // nilai berbeda ('Petugas UKS', 'Petugas UKS Utama', 'Dokter Kecil UKS', ...).
    // Kini hanya Admin dan Dokter Kecil UKS yang diakui.
    // Idempoten — dilewati kalau kolom sudah berbentuk ENUM.
    try {
      const [kolomRole] = await pool.query(`SHOW COLUMNS FROM users LIKE 'role'`)
      const tipeSekarang = kolomRole[0]?.Type || ''

      if (!tipeSekarang.toLowerCase().startsWith('enum')) {
        console.log('🔄 Migrasi: membatasi kolom role ke Admin / Dokter Kecil UKS...')

        // Nilai di luar daftar resmi HARUS dinormalkan lebih dulu — ALTER ke
        // ENUM akan menolak baris yang nilainya tidak dikenal.
        const [ubah] = await pool.query(
          `UPDATE users SET role = 'Dokter Kecil UKS'
           WHERE role IS NULL
              OR role NOT IN ('Admin', 'Dokter Kecil UKS')`
        )
        if (ubah.affectedRows > 0) {
          console.log(`   ${ubah.affectedRows} akun dengan peran lama dinormalkan menjadi 'Dokter Kecil UKS'.`)
        }

        await pool.query(
          `ALTER TABLE users
           MODIFY COLUMN role ENUM('Admin', 'Dokter Kecil UKS')
           NOT NULL DEFAULT 'Dokter Kecil UKS'`
        )
        console.log('✅ Kolom role kini terbatas pada dua nilai resmi.')
      } else {
        // Kolom sudah ENUM — periksa apakah nilainya masih mengandung
        // 'Petugas UKS' (skema lama dengan tiga peran).
        if (tipeSekarang.includes('Petugas UKS')) {
          console.log('🔄 Migrasi: menghapus peran Petugas UKS dari ENUM yang sudah ada...')
          const [ubah] = await pool.query(
            `UPDATE users SET role = 'Dokter Kecil UKS' WHERE role = 'Petugas UKS'`
          )
          if (ubah.affectedRows > 0) {
            console.log(`   ${ubah.affectedRows} akun Petugas UKS dinormalkan menjadi Dokter Kecil UKS.`)
          }
          await pool.query(
            `ALTER TABLE users
             MODIFY COLUMN role ENUM('Admin', 'Dokter Kecil UKS')
             NOT NULL DEFAULT 'Dokter Kecil UKS'`
          )
          console.log('✅ ENUM role kini hanya berisi Admin dan Dokter Kecil UKS.')
        }
      }
    } catch (roleErr) {
      console.warn('⚠️  Migrasi kolom role dilewati:', roleErr.message)
    }

    // Seed default admin user jika tabel masih kosong.
    // Password DIHASH — jangan pernah menyimpan teks biasa.
    const [users] = await pool.query('SELECT COUNT(*) as count FROM users')
    if (users[0].count === 0) {
      const seedPassword = process.env.SEED_ADMIN_PASSWORD || 'admin'
      const hashed = await bcrypt.hash(seedPassword, 10)

      await pool.query(
        `INSERT INTO users (nama_lengkap, username, nip, no_telepon, password, role)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['Ibu Siti Rahmawati', 'siti_rahmawati', '198507152010012003', '081234567890', hashed, 'Admin']
      )
      console.log(`🌱 Seeded Default Admin User (username: siti_rahmawati / Pass: ${seedPassword})`)
      console.log('   ⚠️  SEGERA ganti password ini setelah login pertama!')
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
        petugas_id INT,
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
        INDEX idx_petugas (petugas_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    // Integritas referensial siswa_id → siswa.id.
    // ON DELETE SET NULL dipilih dengan sengaja: saat seorang siswa dihapus,
    // riwayat kunjungannya HARUS tetap ada (nama/NIS/kelas sudah disalin ke
    // baris kunjungan), hanya tautannya yang dilepas. Rekam kesehatan tidak
    // boleh ikut terhapus.
    // Blok ini idempoten — CREATE TABLE IF NOT EXISTS tidak mengubah tabel
    // yang sudah terbentuk, jadi constraint ditambahkan terpisah di sini.
    try {
      const [fk] = await pool.query(
        `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'kunjungan'
           AND COLUMN_NAME = 'siswa_id' AND REFERENCED_TABLE_NAME = 'siswa'`,
        [dbName]
      )

      if (fk.length === 0) {
        // Bersihkan dulu siswa_id yatim, kalau tidak ALTER TABLE akan gagal.
        const [yatim] = await pool.query(
          `UPDATE kunjungan SET siswa_id = NULL
           WHERE siswa_id IS NOT NULL
             AND siswa_id NOT IN (SELECT id FROM siswa)`
        )
        if (yatim.affectedRows > 0) {
          console.log(`🔧 ${yatim.affectedRows} kunjungan menunjuk siswa yang sudah tidak ada — tautan dilepas.`)
        }

        await pool.query(
          `ALTER TABLE kunjungan
           ADD CONSTRAINT fk_kunjungan_siswa
           FOREIGN KEY (siswa_id) REFERENCES siswa(id)
           ON DELETE SET NULL ON UPDATE CASCADE`
        )
        console.log('✅ FOREIGN KEY kunjungan.siswa_id → siswa.id ditambahkan (ON DELETE SET NULL).')
      }
    } catch (fkErr) {
      console.warn('⚠️  Gagal menambahkan FOREIGN KEY kunjungan.siswa_id:', fkErr.message)
    }

    // Jejak audit: siapa yang mencatat kunjungan ini.
    // Sebelumnya tidak ada catatan sama sekali — saat ada rekam yang keliru,
    // tidak mungkin menelusuri siapa yang memasukkannya.
    //
    // ON DELETE SET NULL, pola yang sama dengan siswa_id: menghapus akun
    // TIDAK boleh ikut menghapus rekam kunjungan yang pernah dicatatnya.
    try {
      const [kolomPetugas] = await pool.query(`SHOW COLUMNS FROM kunjungan LIKE 'petugas_id'`)

      if (kolomPetugas.length === 0) {
        console.log('🔄 Migrasi: menambahkan kolom petugas_id ke tabel kunjungan...')
        await pool.query(`ALTER TABLE kunjungan ADD COLUMN petugas_id INT AFTER siswa_id`)
        await pool.query(`ALTER TABLE kunjungan ADD INDEX idx_petugas (petugas_id)`)
        console.log('✅ Kolom petugas_id ditambahkan (baris lama bernilai NULL).')
      }

      const [fkPetugas] = await pool.query(
        `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'kunjungan'
           AND COLUMN_NAME = 'petugas_id' AND REFERENCED_TABLE_NAME = 'users'`,
        [dbName]
      )

      if (fkPetugas.length === 0) {
        // Bersihkan petugas_id yatim lebih dulu — ALTER TABLE akan gagal
        // kalau masih ada baris yang menunjuk akun yang sudah tidak ada.
        const [yatim] = await pool.query(
          `UPDATE kunjungan SET petugas_id = NULL
           WHERE petugas_id IS NOT NULL
             AND petugas_id NOT IN (SELECT id FROM users)`
        )
        if (yatim.affectedRows > 0) {
          console.log(`🔧 ${yatim.affectedRows} kunjungan menunjuk akun yang sudah tidak ada — tautan dilepas.`)
        }

        await pool.query(
          `ALTER TABLE kunjungan
           ADD CONSTRAINT fk_kunjungan_petugas
           FOREIGN KEY (petugas_id) REFERENCES users(id)
           ON DELETE SET NULL ON UPDATE CASCADE`
        )
        console.log('✅ FOREIGN KEY kunjungan.petugas_id → users.id ditambahkan (ON DELETE SET NULL).')
      }
    } catch (petugasErr) {
      console.warn('⚠️  Migrasi kolom petugas_id dilewati:', petugasErr.message)
    }

    // Pengaturan Sekolah Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pengaturan_sekolah (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_sekolah VARCHAR(200),
        npsn VARCHAR(20),
        telepon_sekolah VARCHAR(15),
        kepala_sekolah VARCHAR(100),
        kepala_nip VARCHAR(20),
        alamat TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    // Migrasi: tambahkan kolom kepala_nip jika belum ada
    try {
      const [colKepalaNip] = await pool.query(`SHOW COLUMNS FROM pengaturan_sekolah LIKE 'kepala_nip'`)
      if (colKepalaNip.length === 0) {
        console.log('🔄 Migrasi: menambahkan kolom kepala_nip ke tabel pengaturan_sekolah...')
        await pool.query(`
          ALTER TABLE pengaturan_sekolah
          ADD COLUMN kepala_nip VARCHAR(20) AFTER kepala_sekolah
        `)
        // Update data lama dengan NIP yang benar
        await pool.query(`
          UPDATE pengaturan_sekolah
          SET kepala_nip = '198510082010011013',
              kepala_sekolah = 'Muswar Dedi, S.Pd.',
              npsn = '10301599'
          WHERE id = 1
        `)
        console.log('✅ Kolom kepala_nip ditambahkan dan data kepala sekolah diperbarui.')
      }
    } catch (nipErr) {
      console.warn('⚠️  Migrasi kolom kepala_nip dilewati:', nipErr.message)
    }

    const [sekolah] = await pool.query('SELECT COUNT(*) as count FROM pengaturan_sekolah')
    if (sekolah[0].count === 0) {
      await pool.query(`
      INSERT INTO pengaturan_sekolah (id, nama_sekolah, npsn, telepon_sekolah, kepala_sekolah, kepala_nip, alamat)
      VALUES (1, 'SDN 05 Parambahan', '10301599', '0751234567', 'Muswar Dedi, S.Pd.', '198510082010011013', 'Jl. Pendidikan No. 5, Nagari Parambahan, Kec. Bukit Sundi, Kab. Solok')
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

