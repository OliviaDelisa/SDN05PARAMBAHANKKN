import express from 'express'
import rateLimit from 'express-rate-limit'
import { loginUser, registerUser } from '../controllers/authController.js'

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

// Pendaftaran juga dibatasi agar tidak dipakai membuat akun massal.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak pendaftaran dari perangkat ini. Silakan coba lagi nanti.'
  }
})

router.post('/login', loginLimiter, loginUser)
router.post('/register', registerLimiter, registerUser)

export default router
