
import { AppError } from './AppError.js'

export function parseId(value, name = 'id') {
    const id = Number(value)
    if (!Number.isInteger(id) || id < 1) {
        throw new AppError(`El parámetro ${name} no es válido`, 400, 'INVALID_ID')
    }
    return id
}