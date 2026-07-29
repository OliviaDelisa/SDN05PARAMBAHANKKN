import { Router } from 'express'
import { kunjunganController } from '../controllers/kunjunganController.js'

const router = Router()

router.get('/', kunjunganController.getAll)
router.post('/', kunjunganController.create)
router.get('/stats/dashboard', kunjunganController.getStatsDashboard)

export default router
