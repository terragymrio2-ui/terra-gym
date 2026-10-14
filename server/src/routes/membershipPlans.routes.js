import { Router } from 'express'
import * as ctrl from '../controllers/membershipPlans.controller.js'
import { requireAuth, requirePasswordChanged, requireRole } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { planSchema, planStatusSchema, updatePlanSchema } from '../validators/memberships.validator.js'

const router = Router()

router.use(requireAuth, requirePasswordChanged)

router.get('/', ctrl.list) // cualquier usuario autenticado

router.post('/', requireRole('ADMIN'), validate(planSchema), ctrl.create)
router.patch('/:id', requireRole('ADMIN'), validate(updatePlanSchema), ctrl.update)
router.patch('/:id/status', requireRole('ADMIN'), validate(planStatusSchema), ctrl.setStatus)

export default router