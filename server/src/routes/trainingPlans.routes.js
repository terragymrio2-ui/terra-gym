import { Router } from 'express'
import * as ctrl from '../controllers/trainingPlans.controller.js'
import { requireAuth, requirePasswordChanged, requireRole } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import {
    assignSchema,
    createPlanSchema,
    planStatusSchema,
    updatePlanSchema,
} from '../validators/trainingPlans.validator.js'

const router = Router()

router.use(requireAuth, requirePasswordChanged)

// Antes de '/:id' para que "me" no se interprete como un id
router.get('/me', requireRole('USUARIO'), ctrl.mine)

router.use(requireRole('ADMIN', 'PROFESOR'))
router.get('/overview', ctrl.overview)
router.get('/member/:memberId', ctrl.listForMember)
router.post('/assign', validate(assignSchema), ctrl.assign)
router.post('/', validate(createPlanSchema), ctrl.create)
router.get('/:id', ctrl.getById)
router.put('/:id', validate(updatePlanSchema), ctrl.update)
router.patch('/:id/status', validate(planStatusSchema), ctrl.setStatus)

export default router