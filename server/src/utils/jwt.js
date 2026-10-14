import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export const COOKIE_NAME = 'terragym_token'

const SESSION_TTL_SECONDS = 12 * 60 * 60 // sin "recordar": 12 horas
const REMEMBER_TTL_SECONDS = 30 * 24 * 60 * 60 // con "recordar": 30 días

export function signToken(userId, remember = false) {
    return jwt.sign({ sub: userId }, env.JWT_SECRET, {
        expiresIn: remember ? REMEMBER_TTL_SECONDS : SESSION_TTL_SECONDS,
    })
}

export function verifyToken(token) {
    return jwt.verify(token, env.JWT_SECRET) // lanza error si es inválido o expiró
}

// Producción: SameSite=None + Secure (front y back en dominios distintos).
// Desarrollo: Lax, porque localhost:5173 y localhost:4000 son el mismo "sitio".
// Sin maxAge la cookie es de sesión; con maxAge persiste en el dispositivo.
export function cookieOptions(remember = false) {
    const isProd = env.NODE_ENV === 'production'
    const options = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        path: '/',
    }
    if (remember) options.maxAge = REMEMBER_TTL_SECONDS * 1000
    return options
}