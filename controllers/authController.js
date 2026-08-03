import pool from '../db/db.js'

// Aturan validasi username:
// - Hanya huruf kecil, angka, dan underscore (_)
// - Minimal 4 karakter, maksimal 20 karakter
// - Tidak boleh dimulai dengan angka
const USERNAME_REGEX = /^[a-z][a-z0-9_]{3,19}$/

function validateUsername(username) {
  if (!username) return 'Username wajib diisi!'
  if (username.length < 4) return 'Username minimal 4 karakter!'
  if (username.length > 20) return 'Username maksimal 20 karakter!'
  if (/^[0-9]/.test(username)) return 'Username tidak boleh dimulai dengan angka!'
  if (!/^[a-z0-9_]+$/.test(username)) return 'Username hanya boleh berisi huruf kecil, angka, dan underscore (_)!'
  if (!USERNAME_REGEX.test(username)) return 'Format username tidak valid! Gunakan huruf kecil, angka, dan underscore saja.'
  return null
}

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

    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Username/NIP atau Password yang Anda masukkan salah!'
      })
    }

    const { password: _, ...userData } = user
    return res.json({
      success: true,
      message: 'Login berhasil! Selamat bekerja.',
      data: userData
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

    const isDokterKecil = nip.length <= 10
    const role = isDokterKecil ? 'Dokter Kecil UKS' : 'Petugas UKS Pegawai'

    const [result] = await pool.query(
      `INSERT INTO users (nama_lengkap, username, nip, no_telepon, password, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nama_lengkap, username.toLowerCase(), nip, no_telepon || '', password, role]
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
      data: newUser
    })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat akun. Pastikan MySQL server aktif.'
    })
  }
}
