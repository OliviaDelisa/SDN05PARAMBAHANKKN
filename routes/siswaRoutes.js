import { Router } from 'express'
import { getSiswa, createSiswa, updateSiswa, deleteSiswa } from '../controllers/siswaController.js'

const router = Router()

router.get('/', getSiswa)
router.post('/', createSiswa)
router.put('/:id', updateSiswa)
router.delete('/:id', deleteSiswa)

export default router
