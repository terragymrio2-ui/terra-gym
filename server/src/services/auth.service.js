import bcrypt from 'bcrypt'
import { pool } from '../config/db.js'
import { AppError } from '../utils/AppError.js'

// Hash válido de una contraseña cualquiera. Se usa para que el tiempo de respuesta
// sea parecido exista o no el email (evita enumeración de usuarios por timing).
const DUMMY_HASH = bcrypt.hashSync('terragym-dummy-password', 12)

export function toPublicUser(u) {
    return {
        id: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        email: u.email,
        role: u.role,
        mustChangePassword: Boolean(u.must_change_password),
    }
}

export async function login(email, password) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = :email', { email })
    const user = rows[0]

    const valid = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH)
    if (!user || !valid || !user.is_active) {
        throw new AppError('Email o contraseña incorrectos', 401, 'INVALID_CREDENTIALS')
    }
    return user
}

export async function changePassword(userId, currentPassword, newPassword) {
    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = :id', { id: userId })
    const valid = rows[0] && (await bcrypt.compare(currentPassword, rows[0].password_hash))
    if (!valid) {
        throw new AppError('La contraseña actual es incorrecta', 400, 'WRONG_PASSWORD')
    }

    const hash = await bcrypt.hash(newPassword, 12)
    await pool.query(
        'UPDATE users SET password_hash = :hash, must_change_password = 0 WHERE id = :id',
        { hash, id: userId },
    )
}