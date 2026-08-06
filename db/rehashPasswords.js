/**
 * Migrasi sekali jalan: ubah password yang masih teks biasa menjadi hash bcrypt.
 *
 * Jalankan SETELAH authController memakai bcrypt:
 *   node db/rehashPasswords.js
 *
 * Aman dijalankan berulang — password yang sudah berbentuk hash dilewati.
 */
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import pool from './db.js'

dotenv.config()

const BCRYPT_ROUNDS = 10

// Hash bcrypt selalu diawali $2a$, $2b$, atau $2y$
function sudahDiHash(password) {
  return typeof password === 'string' && /^\$2[aby]\$/.test(password)
}

async function rehashPasswords() {
  console.log('🔄 Memeriksa password pengguna...\n')

  try {
    const [users] = await pool.query('SELECT id, username, password FROM users')

    if (users.length === 0) {
      console.log('Tidak ada pengguna di database. Tidak ada yang perlu dimigrasi.')
      return
    }

    let diubah = 0
    let dilewati = 0

    for (const user of users) {
      if (sudahDiHash(user.password)) {
        console.log(`  ⏭️  ${user.username} — sudah di-hash, dilewati`)
        dilewati++
        continue
      }

      const hashed = await bcrypt.hash(user.password, BCRYPT_ROUNDS)
      await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id])
      console.log(`  ✅ ${user.username} — password berhasil di-hash`)
      diubah++
    }

    console.log(`\n📊 Selesai: ${diubah} di-hash, ${dilewati} dilewati, total ${users.length} pengguna.`)

    if (diubah > 0) {
      console.log('\n⚠️  Password lama tetap berlaku untuk login (nilainya tidak berubah,')
      console.log('   hanya cara penyimpanannya yang kini aman).')
    }
  } catch (err) {
    console.error('\n❌ Migrasi gagal:', err.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

rehashPasswords()
