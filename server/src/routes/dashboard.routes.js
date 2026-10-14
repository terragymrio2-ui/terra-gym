import { Router } from 'express'
import * as ctrl from '../controllers/dashboard.controller.js'
import { requireAuth, requirePasswordChanged, requireRole } from '../middlewares/auth.js'

const router = Router()

router.use(requireAuth, requirePasswordChanged)

router.get('/admin', requireRole('ADMIN'), ctrl.admin)
router.get('/trainer', requireRole('PROFESOR'), ctrl.trainer)
router.get('/member', requireRole('USUARIO'), ctrl.member)

export default router