import { Router } from 'express'
import * as ctrl from '../controllers/memberships.controller.js'
import { requireAuth, requirePasswordChanged, requireRole } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { createMembershipSchema } from '../validators/memberships.validator.js'

const router = Router()

router.use(requireAuth, requirePasswordChanged)

// Va antes de '/:id' para que "me" no se interprete como un id
router.get('/me', requireRole('USUARIO'), ctrl.me)

router.use(requireRole('ADMIN'))
router.get('/', ctrl.list)
router.post('/', validate(createMembershipSchema), ctrl.create)
router.get('/:id', ctrl.getById)
router.patch('/:id/cancel', ctrl.cancel)

export default router