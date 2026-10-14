import { pool } from '../config/db.js'
import { AppError } from '../utils/AppError.js'
import { COOKIE_NAME, verifyToken } from '../utils/jwt.js'

// Exige sesión válida y deja el usuario actual en req.user
export async function requireAuth(req, res, next) {
    try {
        const token = req.cookies?.[COOKIE_NAME]
        if (!token) throw new AppError('Debés iniciar sesión', 401, 'UNAUTHORIZED')

        let payload
        try {
            payload = verifyToken(token)
        } catch {
            throw new AppError('Sesión inválida o expirada', 401, 'UNAUTHORIZED')
        }

        const [rows] = await pool.query(
            `SELECT id, first_name, last_name, email, role, is_active, must_change_password
       FROM users WHERE id = :id`,
            { id: payload.sub },
        )
        const user = rows[0]
        if (!user || !user.is_active) {
            throw new AppError('Sesión inválida o expirada', 401, 'UNAUTHORIZED')
        }

        req.user = user
        next()
    } catch (err) {
        next(err)
    }
}

// Uso: requireRole('ADMIN') o requireRole('ADMIN', 'PROFESOR')
export const requireRole =
    (...roles) =>
        (req, res, next) => {
            if (!req.user || !roles.includes(req.user.role)) {
                return next(new AppError('No tenés permiso para esta acción', 403, 'FORBIDDEN'))
            }
            next()
        }
// Bloquea la API si el usuario aún debe cambiar su contraseña temporal.
// Se aplica a todo menos a /auth (login, me, change-password, logout).
export function requirePasswordChanged(req, res, next) {
    if (req.user?.must_change_password) {
        return next(
            new AppError('Debés cambiar tu contraseña antes de continuar', 403, 'PASSWORD_CHANGE_REQUIRED'),
        )
    }
    next()
}