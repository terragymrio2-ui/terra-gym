// Valida req.body con un esquema zod. Si falla, el errorHandler responde 400.
export const validate = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body)
        next()
    } catch (err) {
        next(err)
    }
}