import { Router } from 'express'
import * as ctrl from '../controllers/announcements.controller.js'
import { requireAuth, requirePasswordChanged, requireRole } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import {
    announcementStatusSchema,
    createAnnouncementSchema,
} from '../validators/announcements.validator.js'

const router = Router()

router.use(requireAuth, requirePasswordChanged)

// Socio
router.get('/me/pending', requireRole('USUARIO'), ctrl.pending)
router.post('/:id/read', requireRole('USUARIO'), ctrl.markRead)

// Admin
router.use(requireRole('ADMIN'))
router.get('/preview', ctrl.preview)
router.get('/', ctrl.list)
router.post('/', validate(createAnnouncementSchema), ctrl.create)
router.patch('/:id/status', validate(announcementStatusSchema), ctrl.setStatus)

export default router