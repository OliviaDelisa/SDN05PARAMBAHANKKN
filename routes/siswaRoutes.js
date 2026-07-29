import { Router } from 'express'
import { siswaController } from '../controllers/siswaController.js'

const router = Router()

router.get('/', siswaController.getAll)
router.get('/:id', siswaController.getById)
router.post('/', siswaController.create)
router.put('/:id', siswaController.update)
router.delete('/:id', siswaController.delete)

export default router
