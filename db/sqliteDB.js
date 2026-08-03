import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, 'uks_digital.db')
const db = new Database(dbPath)

// Enable foreign keys
db.pragma('foreign_keys = ON')
db.pragma('journal_mode = WAL')

export function initSQLiteDB() {
  console.log('🔄 Initializing SQLite Database at:', dbPath)

  // 1. Users Table (Authentication & User Accounts)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_lengkap TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      nip TEXT UNIQUE NOT NULL,
      no_telepon TEXT,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'Petugas UKS',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Seed Default Admin User if users table is empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count
  if (userCount === 0) {
    db.prepare(`
      INSERT INTO users (nama_lengkap, email, nip, no_telepon, password, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'Ibu Siti Rahmawati',
      'siti.rahmawati@sdn05parambahan.id',
      '198507152010012003',
      '081234567890',
      'admin',
      'Petugas UKS Utama'
    )
    console.log('🌱 Seeded Default Admin User (NIP: 198507152010012003 / Pass: admin)')
  }

  // 2. Siswa Table (Database Siswa Level 1 - 6)
  db.exec(`
    CREATE TABLE IF NOT EXISTS siswa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nis TEXT UNIQUE NOT NULL,
      nama TEXT NOT NULL,
      kelas TEXT NOT NULL,
      jenis_kelamin TEXT NOT NULL,
      tanggal_lahir TEXT,
      nama_wali TEXT,
      telepon_wali TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // 3. Kunjungan Table (Rekam Kunjungan UKS)
  db.exec(`
    CREATE TABLE IF NOT EXISTS kunjungan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      siswa_id INTEGER,
      siswa_nama TEXT NOT NULL,
      siswa_nis TEXT NOT NULL,
      kelas TEXT NOT NULL,
      waktu_masuk TEXT NOT NULL,
      keluhan_utama TEXT NOT NULL,
      keterangan TEXT,
      is_darurat INTEGER DEFAULT 0,
      tindakan TEXT,
      status TEXT NOT NULL DEFAULT 'Istirahat di UKS',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // 4. Pengaturan Sekolah Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS pengaturan_sekolah (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_sekolah TEXT,
      npsn TEXT,
      telepon_sekolah TEXT,
      kepala_sekolah TEXT,
      alamat TEXT
    );
  `)

  const sekolahCount = db.prepare('SELECT COUNT(*) as count FROM pengaturan_sekolah').get().count
  if (sekolahCount === 0) {
    db.prepare(`
      INSERT INTO pengaturan_sekolah (nama_sekolah, npsn, telepon_sekolah, kepala_sekolah, alamat)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      'SDN 05 Parambahan',
      '10303456',
      '0751234567',
      'Bapak Ahmad Fauzi, S.Pd.',
      'Jl. Pendidikan No. 5, Nagari Parambahan, Kec. Bukit Sundi, Kab. Solok'
    )
  }

  console.log('✅ SQLite Database siap digunakan!')
}

// Execute schema initialization immediately on module load
initSQLiteDB()

export default db
