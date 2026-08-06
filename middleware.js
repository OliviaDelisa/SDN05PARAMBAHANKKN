import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

// Middleware keamanan terpusat.
// Diletakkan di root (sejajar app.js) agar struktur folder project tidak berubah.

// dotenv dimuat di sini juga: ESM menjalankan seluruh import sebelum body
// app.js, jadi tanpa ini JWT_SECRET masih kosong saat modul ini dievaluasi.
dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  console.error('\n❌ JWT_SECRET belum diisi di file .env')
  console.error('   Isi dengan teks acak panjang, contoh: JWT_SECRET=rahasia-uks-sdn05-2026-xyz\n')
  process.exit(1)
}

export const TOKEN_EXPIRY = '8h'

/** Terbitkan token untuk user yang berhasil login. */
export function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  )
}

/**
 * Penjaga utama: menolak permintaan tanpa token yang sah.
 * Identitas hasil verifikasi disimpan di req.user — JANGAN pernah percaya
 * header dari klien (mis. X-User-Id) karena bisa dipalsukan siapa saja.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''

  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Anda harus login terlebih dahulu.'
    })
  }

  const token = header.slice(7).trim()

  try {
    req.user = jwt.verify(token, JWT_SECRET)
    return next()
  } catch (err) {
    const kedaluwarsa = err.name === 'TokenExpiredError'
    return res.status(401).json({
      success: false,
      message: kedaluwarsa
        ? 'Sesi Anda sudah berakhir. Silakan login kembali.'
        : 'Sesi tidak valid. Silakan login kembali.'
    })
  }
}

/** Pembatasan berdasarkan peran. Dipakai untuk aksi sensitif. */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Anda harus login terlebih dahulu.' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki hak akses untuk tindakan ini.'
      })
    }
    return next()
  }
}

/**
 * Penangkap error terpusat. Detail lengkap hanya masuk log server;
 * klien cukup menerima pesan generik supaya nama tabel/kolom tidak bocor.
 */
export function errorHandler(err, req, res, _next) {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err)

  if (res.headersSent) return

  res.status(err.status || 500).json({
    success: false,
    message: 'Terjadi kesalahan pada server. Silakan coba lagi atau hubungi administrator.'
  })
}
