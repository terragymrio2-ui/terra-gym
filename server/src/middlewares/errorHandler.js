import { ZodError } from 'zod'
import { AppError } from '../utils/AppError.js'

export function notFound(req, res, next) {
    next(new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'))
}

// Express reconoce un manejador de errores por tener 4 parámetros
export function errorHandler(err, req, res, next) {
    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Los datos enviados no son válidos',
                details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
            },
        })
    }

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            error: { code: 'INVALID_JSON', message: 'El cuerpo de la petición no es un JSON válido' },
        })
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: { code: err.code, message: err.message, details: err.details },
        })
    }

    // Error inesperado: se loguea completo en el servidor, pero al cliente solo un mensaje genérico
    console.error(err)
    res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Ocurrió un error interno. Intentá nuevamente.' },
    })
}