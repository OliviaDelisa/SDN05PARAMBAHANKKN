import express from 'express'
import rateLimit from 'express-rate-limit'
import { loginUser } from '../controllers/authController.js'

const router = express.Router()

// Batasi percobaan login untuk mencegah brute force menebak password.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.'
  }
})

// Pendaftaran mandiri sengaja TIDAK disediakan. Sebelumnya siapa pun yang
// menemukan alamat ini bisa membuat akun dan langsung membaca data kesehatan
// siswa. Akun kini hanya dibuat admin lewat Panel Admin → Manajemen Akun.
router.post('/login', loginLimiter, loginUser)

export default router
