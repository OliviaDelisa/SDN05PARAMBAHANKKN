import { Router } from 'express'
import { pengaturanController } from '../controllers/pengaturanController.js'

const router = Router()

router.get('/', pengaturanController.get)
router.put('/petugas', pengaturanController.updatePetugas)
router.put('/sekolah', pengaturanController.updateSekolah)

export default router
