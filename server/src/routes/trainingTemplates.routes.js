import { Router } from 'express'
import * as ctrl from '../controllers/trainingTemplates.controller.js'
import { requireAuth, requirePasswordChanged, requireRole } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import {
    templateSchema,
    updateTemplateSchema,
} from '../validators/trainingTemplates.validator.js'

const router = Router()

router.use(requireAuth, requirePasswordChanged, requireRole('ADMIN', 'PROFESOR'))

router.get('/', ctrl.list)
router.post('/', validate(templateSchema), ctrl.create)
router.get('/:id', ctrl.getById)
router.put('/:id', validate(updateTemplateSchema), ctrl.update)
router.post('/:id/duplicate', ctrl.duplicate)
router.delete('/:id', ctrl.remove)

export default router