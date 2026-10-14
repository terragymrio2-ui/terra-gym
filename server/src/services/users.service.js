import bcrypt from 'bcrypt'
import { randomInt } from 'node:crypto'
import { pool } from '../config/db.js'
import { AppError } from '../utils/AppError.js'

const COLUMNS = `id, first_name, last_name, email, role, phone, dni, birth_date,
  is_active, must_change_password, notify_email, created_at`

// Sin caracteres ambiguos (0/O, 1/l/I) para que sea fácil de dictar o copiar
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'

function generateTempPassword(length = 10) {
    return Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
}

function toDto(u) {
    return {
        id: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        email: u.email,
        role: u.role,
        phone: u.phone,
        dni: u.dni,
        birthDate: u.birth_date,
        isActive: Boolean(u.is_active),
        mustChangePassword: Boolean(u.must_change_password),
        notifyEmail: Boolean(u.notify_email),
        createdAt: u.created_at,
    }
}

// Traduce el error de clave duplicada de MySQL a un mensaje entendible
function rethrowDuplicate(err) {
    if (err.code === 'ER_DUP_ENTRY') {
        const field = err.message.includes('uq_users_dni') ? 'DNI' : 'email'
        throw new AppError(`Ya existe un usuario con ese ${field}`, 409, 'DUPLICATE')
    }
    throw err
}

export async function list({ role, search, isActive, page, limit }) {
    const where = []
    const params = { limit, offset: (page - 1) * limit }

    if (role) {
        where.push('role = :role')
        params.role = role
    }
    if (isActive !== undefined) {
        where.push('is_active = :isActive')
        params.isActive = isActive ? 1 : 0
    }
    if (search) {
        where.push(
            `(first_name LIKE :q OR last_name LIKE :q OR email LIKE :q OR dni LIKE :q
        OR CONCAT(first_name, ' ', last_name) LIKE :q)`,
        )
        params.q = `%${search}%`
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

    const [[{ total }]] = await pool.query(
        `SELECT COUNT(*) AS total FROM users ${whereSql}`,
        params,
    )
    const [rows] = await pool.query(
        `SELECT ${COLUMNS} FROM users ${whereSql}
     ORDER BY last_name, first_name LIMIT :limit OFFSET :offset`,
        params,
    )

    return {
        items: rows.map(toDto),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
}

export async function getById(id) {
    const [rows] = await pool.query(`SELECT ${COLUMNS} FROM users WHERE id = :id`, { id })
    if (!rows[0]) throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND')
    return toDto(rows[0])
}

export async function create(data) {
    const temporaryPassword = generateTempPassword()
    const passwordHash = await bcrypt.hash(temporaryPassword, 12)

    try {
        const [result] = await pool.query(
            `INSERT INTO users
         (first_name, last_name, email, password_hash, role, phone, dni, birth_date,
          must_change_password, notify_email)
       VALUES
         (:firstName, :lastName, :email, :passwordHash, :role, :phone, :dni, :birthDate,
          1, :notifyEmail)`,
            {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                passwordHash,
                role: data.role,
                phone: data.phone ?? null,
                dni: data.dni ?? null,
                birthDate: data.birthDate ?? null,
                notifyEmail: data.notifyEmail === false ? 0 : 1,
            },
        )
        const user = await getById(result.insertId)
        return { user, temporaryPassword } // la contraseña solo se devuelve acá, una vez
    } catch (err) {
        rethrowDuplicate(err)
    }
}

// Lista blanca: solo estas columnas pueden actualizarse desde el cliente
const UPDATABLE = {
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    phone: 'phone',
    dni: 'dni',
    birthDate: 'birth_date',
    notifyEmail: 'notify_email',
}

export async function update(id, data) {
    await getById(id) // 404 si no existe

    const sets = []
    const params = { id }
    for (const [key, column] of Object.entries(UPDATABLE)) {
        if (data[key] !== undefined) {
            sets.push(`${column} = :${key}`)
            params[key] = data[key]
        }
    }
    if (!sets.length) throw new AppError('No hay datos para actualizar', 400, 'NO_CHANGES')

    try {
        await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = :id`, params)
    } catch (err) {
        rethrowDuplicate(err)
    }
    return getById(id)
}

export async function setStatus(id, isActive, actingUserId) {
    if (id === actingUserId && !isActive) {
        throw new AppError('No podés desactivar tu propia cuenta', 400, 'SELF_DEACTIVATION')
    }
    await getById(id)
    await pool.query('UPDATE users SET is_active = :isActive WHERE id = :id', {
        isActive: isActive ? 1 : 0,
        id,
    })
    return getById(id)
}

export async function resetPassword(id, actingUserId) {
    if (id === actingUserId) {
        throw new AppError(
            'Para cambiar tu propia contraseña usá la opción de tu perfil',
            400,
            'SELF_RESET',
        )
    }
    await getById(id)
    const temporaryPassword = generateTempPassword()
    const passwordHash = await bcrypt.hash(temporaryPassword, 12)
    await pool.query(
        'UPDATE users SET password_hash = :passwordHash, must_change_password = 1 WHERE id = :id',
        { passwordHash, id },
    )
    return { temporaryPassword }
}