import { Router } from 'express'
import { pengaturanController } from '../controllers/pengaturanController.js'
import { requireAuth, requireRole } from '../middleware.js'

const router = Router()

// Profil petugas & identitas sekolah — wajib login.
router.use(requireAuth)

// GET tetap terbuka untuk semua yang login: kop surat sekolah dibutuhkan
// saat mencetak laporan dari halaman Riwayat.
router.get('/', pengaturanController.get)

// Setiap orang boleh mengubah profilnya sendiri.
router.put('/petugas', pengaturanController.updatePetugas)

// Identitas sekolah muncul di seluruh laporan resmi — admin saja.
router.put('/sekolah', requireRole('Admin'), pengaturanController.updateSekolah)

export default router
