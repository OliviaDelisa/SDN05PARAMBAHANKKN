import pool from '../db/db.js'
import bcrypt from 'bcrypt'
import { generateToken } from '../middleware.js'

// POST /api/auth/login
export async function loginUser(req, res) {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username dan Password wajib diisi!'
    })
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ? OR nip = ?',
      [username.toLowerCase(), username]
    )

    if (!rows || rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Username/NIP atau Password yang Anda masukkan salah!'
      })
    }

    const user = rows[0]

    // Bandingkan hash, bukan teks biasa. Password lama yang masih plaintext
    // ditolak di sini — jalankan `node db/rehashPasswords.js` untuk migrasi.
    const cocok = await bcrypt.compare(password, user.password)

    if (!cocok) {
      return res.status(401).json({
        success: false,
        message: 'Username/NIP atau Password yang Anda masukkan salah!'
      })
    }

    const { password: _, ...userData } = user
    const token = generateToken(user)

    return res.json({
      success: true,
      message: 'Login berhasil! Selamat bekerja.',
      data: userData,
      token
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat login. Pastikan MySQL server aktif.'
    })
  }
}
