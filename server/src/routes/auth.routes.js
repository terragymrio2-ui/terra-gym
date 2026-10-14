import { Router } from 'express'
import * as ctrl from '../controllers/auth.controller.js'
import { requireAuth } from '../middlewares/auth.js'
import { loginLimiter } from '../middlewares/rateLimit.js'
import { validate } from '../middlewares/validate.js'
import { changePasswordSchema, loginSchema } from '../validators/auth.validator.js'

const router = Router()

router.post('/login', loginLimiter, validate(loginSchema), ctrl.login)
router.post('/logout', ctrl.logout)
router.get('/me', requireAuth, ctrl.me)
router.patch('/change-password', requireAuth, validate(changePasswordSchema), ctrl.changePassword)

export default router