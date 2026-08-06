import { Router } from 'express'
import { getSiswa, createSiswa, updateSiswa, deleteSiswa } from '../controllers/siswaController.js'
import { requireAuth, requireRole } from '../middleware.js'

const router = Router()

// Seluruh data siswa wajib login — ini data pribadi anak di bawah umur.
router.use(requireAuth)

// Lihat & tambah: semua petugas. Saat ada siswa sakit yang belum terdaftar,
// petugas harus bisa mencatatnya langsung tanpa menunggu admin.
router.get('/', getSiswa)
router.post('/', createSiswa)

// Ubah & hapus data induk: admin saja.
router.put('/:id', requireRole('Admin'), updateSiswa)
router.delete('/:id', requireRole('Admin'), deleteSiswa)

export default router
