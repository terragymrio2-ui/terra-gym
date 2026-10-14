import { Router } from 'express'
import * as ctrl from '../controllers/notifications.controller.js'
import { requireAuth, requirePasswordChanged, requireRole } from '../middlewares/auth.js'

const router = Router()

router.use(requireAuth, requirePasswordChanged, requireRole('ADMIN'))

router.get('/expirations', ctrl.expirations)
router.post('/whatsapp/:membershipId', ctrl.logWhatsapp)

export default router