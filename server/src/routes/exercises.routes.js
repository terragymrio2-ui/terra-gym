import { Router } from 'express'
import * as ctrl from '../controllers/exercises.controller.js'
import { requireAuth, requirePasswordChanged, requireRole } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import {
    exerciseSchema,
    exerciseStatusSchema,
    updateExerciseSchema,
} from '../validators/exercises.validator.js'

const router = Router()

router.use(requireAuth, requirePasswordChanged, requireRole('ADMIN', 'PROFESOR'))

router.get('/', ctrl.list)
router.post('/', validate(exerciseSchema), ctrl.create)
router.patch('/:id', validate(updateExerciseSchema), ctrl.update)
router.patch('/:id/status', validate(exerciseStatusSchema), ctrl.setStatus)
router.delete('/:id', ctrl.remove)

export default router