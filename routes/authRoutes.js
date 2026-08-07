import express from 'express'
import { loginUser } from '../controllers/authController.js'

const router = express.Router()

// Pendaftaran mandiri sengaja TIDAK disediakan. Sebelumnya siapa pun yang
// menemukan alamat ini bisa membuat akun dan langsung membaca data kesehatan
// siswa. Akun kini hanya dibuat admin lewat Panel Admin → Manajemen Akun.
router.post('/login', loginUser)

export default router