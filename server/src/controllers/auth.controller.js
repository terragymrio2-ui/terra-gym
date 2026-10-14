import * as authService from '../services/auth.service.js'
import { COOKIE_NAME, cookieOptions, signToken } from '../utils/jwt.js'
import { sendSuccess } from '../utils/response.js'

export async function login(req, res, next) {
    try {
        const { email, password, remember } = req.body
        const user = await authService.login(email, password)
        res.cookie(COOKIE_NAME, signToken(user.id, remember), cookieOptions(remember))
        sendSuccess(res, authService.toPublicUser(user), 'Sesión iniciada')
    } catch (err) {
        next(err)
    }
}


export function logout(req, res) {
    // clearCookie necesita las mismas opciones con las que se creó (sin maxAge)
    res.clearCookie(COOKIE_NAME, cookieOptions())
    sendSuccess(res, null, 'Sesión cerrada')
}

export function me(req, res) {
    sendSuccess(res, authService.toPublicUser(req.user))
}

export async function changePassword(req, res, next) {
    try {
        await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword)
        sendSuccess(res, null, 'Contraseña actualizada')
    } catch (err) {
        next(err)
    }
}