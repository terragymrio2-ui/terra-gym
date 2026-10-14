import { Router } from 'express'
import * as ctrl from '../controllers/payments.controller.js'
import { requireAuth, requirePasswordChanged, requireRole } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { registerPaymentSchema, voidPaymentSchema } from '../validators/memberships.validator.js'

const router = Router()

router.use(requireAuth, requirePasswordChanged, requireRole('ADMIN'))

router.get('/', ctrl.list)
router.post('/', validate(registerPaymentSchema), ctrl.register)
router.patch('/:id/void', validate(voidPaymentSchema), ctrl.voidPayment)

export default router