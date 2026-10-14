import { env } from '../config/env.js'
import { AppError } from '../utils/AppError.js'

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS'])

// Rechaza pedidos que modifican datos si no vienen de nuestro frontend
export function originCheck(req, res, next) {
    if (SAFE.has(req.method)) return next()
    const origin = req.get('origin')
    if (origin !== env.CLIENT_URL) {
        return next(new AppError('Origen no permitido', 403, 'BAD_ORIGIN'))
    }
    next()
}