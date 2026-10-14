import { Router } from 'express'
import * as ctrl from '../controllers/trainers.controller.js'
import { requireAuth, requirePasswordChanged, requireRole } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { assignMembersSchema } from '../validators/users.validator.js'

const router = Router()

router.use(requireAuth, requirePasswordChanged, requireRole('ADMIN'))

router.get('/:id/members', ctrl.listMembers)
router.post('/:id/members', validate(assignMembersSchema), ctrl.addMembers)
router.delete('/:id/members/:memberId', ctrl.removeMember)

export default router