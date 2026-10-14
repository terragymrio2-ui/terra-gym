import { Router } from 'express'
import * as ctrl from '../controllers/attendances.controller.js'
import { requireAuth, requirePasswordChanged, requireRole } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { checkInSchema, voidAttendanceSchema } from '../validators/attendances.validator.js'

const router = Router()

router.use(requireAuth, requirePasswordChanged)

// Antes de las rutas con parámetros para que "me" no se interprete como un id
router.get('/me', requireRole('USUARIO'), ctrl.mine)

router.get('/lookup', requireRole('ADMIN', 'PROFESOR'), ctrl.lookup)
router.get('/', requireRole('ADMIN', 'PROFESOR'), ctrl.list)
router.post('/', requireRole('ADMIN', 'PROFESOR'), validate(checkInSchema), ctrl.checkIn)

router.patch('/:id/void', requireRole('ADMIN'), validate(voidAttendanceSchema), ctrl.voidAttendance)

export default router