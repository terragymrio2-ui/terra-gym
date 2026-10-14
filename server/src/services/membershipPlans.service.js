import { pool } from '../config/db.js'
import { AppError } from '../utils/AppError.js'

const COLUMNS = 'id, name, description, price, duration_months, days_per_week, is_active, created_at'

function toDto(p) {
    return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        durationMonths: p.duration_months,
        daysPerWeek: p.days_per_week,
        isActive: Boolean(p.is_active),
        createdAt: p.created_at,
    }
}

function rethrowDuplicate(err) {
    if (err.code === 'ER_DUP_ENTRY') {
        throw new AppError('Ya existe un plan con ese nombre', 409, 'DUPLICATE')
    }
    throw err
}

export async function list({ activeOnly = false } = {}) {
    const [rows] = await pool.query(
        `SELECT ${COLUMNS} FROM membership_plans ${activeOnly ? 'WHERE is_active = 1' : ''}
     ORDER BY days_per_week, price`,
    )
    return rows.map(toDto)
}

export async function getById(id) {
    const [rows] = await pool.query(`SELECT ${COLUMNS} FROM membership_plans WHERE id = :id`, { id })
    if (!rows[0]) throw new AppError('Plan no encontrado', 404, 'NOT_FOUND')
    return toDto(rows[0])
}

export async function create(data) {
    try {
        const [result] = await pool.query(
            `INSERT INTO membership_plans (name, description, price, duration_months, days_per_week)
       VALUES (:name, :description, :price, :durationMonths, :daysPerWeek)`,
            { ...data, description: data.description ?? null },
        )
        return getById(result.insertId)
    } catch (err) {
        rethrowDuplicate(err)
    }
}

const UPDATABLE = {
    name: 'name',
    description: 'description',
    price: 'price',
    durationMonths: 'duration_months',
    daysPerWeek: 'days_per_week',
}

export async function update(id, data) {
    await getById(id)
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
        await pool.query(`UPDATE membership_plans SET ${sets.join(', ')} WHERE id = :id`, params)
    } catch (err) {
        rethrowDuplicate(err)
    }
    return getById(id)
}

export async function setStatus(id, isActive) {
    await getById(id)
    await pool.query('UPDATE membership_plans SET is_active = :isActive WHERE id = :id', {
        isActive: isActive ? 1 : 0,
        id,
    })
    return getById(id)
}