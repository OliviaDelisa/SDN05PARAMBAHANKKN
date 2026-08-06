/**
 * Buat akun Admin untuk UKS Digital.
 *
 *   npm run seed:admin
 *
 * Aman dijalankan berulang — kalau sudah ada akun ber-peran Admin, script
 * hanya melaporkannya dan tidak membuat akun baru.
 *
 * Password diambil dari SEED_ADMIN_PASSWORD di .env, lalu di-hash bcrypt.
 */
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import pool from './db.js'

dotenv.config()

const BCRYPT_ROUNDS = 10

const ADMIN = {
  nama_lengkap: process.env.SEED_ADMIN_NAMA || 'Administrator UKS',
  username: process.env.SEED_ADMIN_USERNAME || 'admin_uks',
  nip: process.env.SEED_ADMIN_NIP || '000000000000000001',
  no_telepon: process.env.SEED_ADMIN_TELEPON || ''
}

async function seedAdmin() {
  console.log('🔄 Memeriksa akun Admin...\n')

  try {
    const [adminAda] = await pool.query(
      "SELECT id, nama_lengkap, username FROM users WHERE role = 'Admin'"
    )

    if (adminAda.length > 0) {
      console.log(`Akun Admin sudah ada (${adminAda.length}):`)
      adminAda.forEach((a) => console.log(`  - ${a.username} (${a.nama_lengkap})`))
      console.log('\nTidak ada yang perlu dibuat.')
      console.log('Untuk menambah admin lain, pakai halaman Manajemen Akun di Panel Admin.')
      return
    }

    // Cegah tabrakan dengan akun yang sudah ada
    const [bentrok] = await pool.query(
      'SELECT username, nip FROM users WHERE username = ? OR nip = ?',
      [ADMIN.username, ADMIN.nip]
    )

    if (bentrok.length > 0) {
      console.error('❌ Username atau NIP untuk akun Admin sudah dipakai akun lain:')
      bentrok.forEach((b) => console.error(`  - username: ${b.username}, nip: ${b.nip}`))
      console.error('\nUbah SEED_ADMIN_USERNAME / SEED_ADMIN_NIP di .env, lalu jalankan lagi.')
      process.exitCode = 1
      return
    }

    const password = process.env.SEED_ADMIN_PASSWORD || 'admin'
    const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS)

    const [hasil] = await pool.query(
      `INSERT INTO users (nama_lengkap, username, nip, no_telepon, password, role)
       VALUES (?, ?, ?, ?, ?, 'Admin')`,
      [ADMIN.nama_lengkap, ADMIN.username, ADMIN.nip, ADMIN.no_telepon, hashed]
    )

    console.log('✅ Akun Admin berhasil dibuat.\n')
    console.log(`   id       : ${hasil.insertId}`)
    console.log(`   nama     : ${ADMIN.nama_lengkap}`)
    console.log(`   username : ${ADMIN.username}`)
    console.log(`   password : ${password}`)
    console.log('\n⚠️  SEGERA ganti password ini setelah login pertama,')
    console.log('   lewat Panel Admin → Manajemen Akun.')
  } catch (err) {
    console.error('\n❌ Gagal membuat akun Admin:', err.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

seedAdmin()
