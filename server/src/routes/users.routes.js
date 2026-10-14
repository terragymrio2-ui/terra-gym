import { Router } from 'express'
import * as ctrl from '../controllers/users.controller.js'
import { requireAuth, requirePasswordChanged, requireRole } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import {
    createUserSchema,
    statusSchema,
    updateUserSchema,
} from '../validators/users.validator.js'

const router = Router()

// Todo este módulo es solo para ADMIN
router.use(requireAuth, requirePasswordChanged, requireRole('ADMIN'))

router.get('/', ctrl.list)
router.post('/', validate(createUserSchema), ctrl.create)
router.get('/:id', ctrl.getById)
router.patch('/:id', validate(updateUserSchema), ctrl.update)
router.patch('/:id/status', validate(statusSchema), ctrl.setStatus)
router.patch('/:id/reset-password', ctrl.resetPassword)

export default router