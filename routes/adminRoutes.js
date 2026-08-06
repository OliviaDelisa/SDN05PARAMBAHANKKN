import { Router } from 'express'
import { adminController } from '../controllers/adminController.js'
import { requireAuth, requireRole } from '../middleware.js'

const router = Router()

// Manajemen akun menentukan siapa saja yang bisa masuk ke sistem dan
// dengan hak apa. Seluruh berkas ini admin saja — tanpa pengecualian.
router.use(requireAuth, requireRole('Admin'))

router.get('/users', adminController.listUsers)
router.post('/users', adminController.createUser)
router.put('/users/:id', adminController.updateUser)

// Reset password dipisah dari ubah profil: dua tindakan dengan risiko
// berbeda tidak sebaiknya berbagi satu tombol simpan.
router.put('/users/:id/password', adminController.resetPassword)

router.delete('/users/:id', adminController.deleteUser)

export default router
