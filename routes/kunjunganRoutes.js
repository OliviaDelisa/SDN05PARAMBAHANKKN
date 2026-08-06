import { Router } from 'express'
import { getKunjungan, createKunjungan, updateKunjungan, deleteKunjungan } from '../controllers/kunjunganController.js'
import { requireAuth } from '../middleware.js'

const router = Router()

// Rekam kesehatan siswa — wajib login.
router.use(requireAuth)

router.get('/', getKunjungan)
router.post('/', createKunjungan)
router.put('/:id', updateKunjungan)
router.delete('/:id', deleteKunjungan)

export default router
