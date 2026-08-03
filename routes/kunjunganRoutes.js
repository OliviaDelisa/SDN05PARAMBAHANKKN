import { Router } from 'express'
import { getKunjungan, createKunjungan, deleteKunjungan } from '../controllers/kunjunganController.js'

const router = Router()

router.get('/', getKunjungan)
router.post('/', createKunjungan)
router.delete('/:id', deleteKunjungan)

export default router
