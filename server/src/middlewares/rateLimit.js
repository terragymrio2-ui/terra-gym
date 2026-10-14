import rateLimit from 'express-rate-limit'

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) =>
        res.status(429).json({
            success: false,
            error: {
                code: 'TOO_MANY_REQUESTS',
                message: 'Demasiados intentos. Probá de nuevo en unos minutos.',
            },
        }),
})