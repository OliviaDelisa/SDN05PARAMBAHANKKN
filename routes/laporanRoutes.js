import { Router } from 'express'
import { laporanController } from '../controllers/laporanController.js'

const router = Router()

router.get('/', laporanController.getMonthlyReport)

export default router
