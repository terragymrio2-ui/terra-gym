import { Router } from 'express'
import { pool } from '../config/db.js'
import { sendSuccess } from '../utils/response.js'
import authRoutes from './auth.routes.js'
import usersRoutes from './users.routes.js'
import trainersRoutes from './trainers.routes.js'
import membershipPlansRoutes from './membershipPlans.routes.js'
import membershipsRoutes from './memberships.routes.js'
import paymentsRoutes from './payments.routes.js'
import exercisesRoutes from './exercises.routes.js'
import trainingTemplatesRoutes from './trainingTemplates.routes.js'
import trainingPlansRoutes from './trainingPlans.routes.js'
import attendancesRoutes from './attendances.routes.js'
import notificationsRoutes from './notifications.routes.js'
import announcementsRoutes from './announcements.routes.js'
import dashboardRoutes from './dashboard.routes.js'

const router = Router()

// Health check: lo usarán Render y nuestras pruebas. Es trivial, por eso va inline.
router.get('/health', async (req, res, next) => {
    try {
        await pool.query('SELECT 1')
        sendSuccess(res, { status: 'ok', db: 'ok' })
    } catch (err) {
        next(err)
    }
})
router.use('/auth', authRoutes)
router.use('/users', usersRoutes)
router.use('/trainers', trainersRoutes)
router.use('/membership-plans', membershipPlansRoutes)
router.use('/memberships', membershipsRoutes)
router.use('/payments', paymentsRoutes)
router.use('/exercises', exercisesRoutes)
router.use('/training-templates', trainingTemplatesRoutes)
router.use('/training-plans', trainingPlansRoutes)
router.use('/attendances', attendancesRoutes)
router.use('/notifications', notificationsRoutes)
router.use('/announcements', announcementsRoutes)
router.use('/dashboard', dashboardRoutes)
export default router