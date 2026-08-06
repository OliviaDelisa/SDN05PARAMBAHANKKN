import pool from '../db/db.js'
import bcrypt from 'bcrypt'
import { generateToken } from '../middleware.js'
import { validateUsername } from './validators.js'

const BCRYPT_ROUNDS = 10

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

// POST /api/auth/register
export async function registerUser(req, res) {
  const { nama_lengkap, nip, username, no_telepon, password } = req.body

  if (!nama_lengkap || !nip || !username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Semua kolom wajib diisi!'
    })
  }

  // Validasi format username
  const usernameError = validateUsername(username)
  if (usernameError) {
    return res.status(400).json({ success: false, message: usernameError })
  }

  try {
    // Cek apakah NIP atau username sudah terdaftar
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE nip = ? OR username = ?',
      [nip, username.toLowerCase()]
    )

    if (existing && existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'NIP atau Username sudah terdaftar dalam sistem!'
      })
    }

    // Peran ditentukan sistem, BUKAN dari panjang NIP yang diisi pendaftar
    // sendiri. Kalau ditentukan input, pendaftar bisa memilih perannya sendiri.
    const role = 'Petugas UKS'

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS)

    const [result] = await pool.query(
      `INSERT INTO users (nama_lengkap, username, nip, no_telepon, password, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nama_lengkap, username.toLowerCase(), nip, no_telepon || '', hashedPassword, role]
    )

    const newUser = {
      id: result.insertId,
      nama_lengkap,
      username: username.toLowerCase(),
      nip,
      no_telepon: no_telepon || '',
      role
    }

    return res.status(201).json({
      success: true,
      message: 'Pendaftaran akun berhasil!',
      data: newUser,
      token: generateToken(newUser)
    })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat akun. Pastikan MySQL server aktif.'
    })
  }
}
