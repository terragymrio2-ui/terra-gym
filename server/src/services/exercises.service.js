import { pool } from '../config/db.js'
import { AppError } from '../utils/AppError.js'

// times_used: cuántas veces aparece en rutinas (define si se puede eliminar)
const SELECT = `
  SELECT e.id, e.name, e.muscle_group, e.description, e.video_url, e.is_active, e.created_at,
         (SELECT COUNT(*) FROM training_plan_exercises tpe WHERE tpe.exercise_id = e.id) AS times_used
  FROM exercises e`

function toDto(e) {
    return {
        id: e.id,
        name: e.name,
        muscleGroup: e.muscle_group,
        description: e.description,
        videoUrl: e.video_url,
        isActive: Boolean(e.is_active),
        inUse: e.times_used > 0,
        createdAt: e.created_at,
    }
}

function rethrowDuplicate(err) {
    if (err.code === 'ER_DUP_ENTRY') {
        throw new AppError('Ya existe un ejercicio con ese nombre', 409, 'DUPLICATE')
    }
    throw err
}

export async function getById(id) {
    const [rows] = await pool.query(`${SELECT} WHERE e.id = :id`, { id })
    if (!rows[0]) throw new AppError('Ejercicio no encontrado', 404, 'NOT_FOUND')
    return toDto(rows[0])
}

export async function list({ search, muscleGroup, isActive, page, limit }) {
    const where = []
    const params = { limit, offset: (page - 1) * limit }
    if (search) {
        where.push('e.name LIKE :q')
        params.q = `%${search}%`
    }
    if (muscleGroup) {
        where.push('e.muscle_group = :muscleGroup')
        params.muscleGroup = muscleGroup
    }
    if (isActive !== undefined) {
        where.push('e.is_active = :isActive')
        params.isActive = isActive ? 1 : 0
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

    const [[{ total }]] = await pool.query(
        `SELECT COUNT(*) AS total FROM exercises e ${whereSql}`,
        params,
    )
    const [rows] = await pool.query(
        `${SELECT} ${whereSql} ORDER BY e.name LIMIT :limit OFFSET :offset`,
        params,
    )
    return {
        items: rows.map(toDto),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
}

export async function create(data, actingUserId) {
    try {
        const [result] = await pool.query(
            `INSERT INTO exercises (name, muscle_group, description, video_url, created_by)
       VALUES (:name, :muscleGroup, :description, :videoUrl, :createdBy)`,
            {
                name: data.name,
                muscleGroup: data.muscleGroup,
                description: data.description ?? null,
                videoUrl: data.videoUrl ?? null,
                createdBy: actingUserId,
            },
        )
        return getById(result.insertId)
    } catch (err) {
        rethrowDuplicate(err)
    }
}

const UPDATABLE = {
    name: 'name',
    muscleGroup: 'muscle_group',
    description: 'description',
    videoUrl: 'video_url',
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
        await pool.query(`UPDATE exercises SET ${sets.join(', ')} WHERE id = :id`, params)
    } catch (err) {
        rethrowDuplicate(err)
    }
    return getById(id)
}

export async function setStatus(id, isActive) {
    await getById(id)
    await pool.query('UPDATE exercises SET is_active = :isActive WHERE id = :id', {
        isActive: isActive ? 1 : 0,
        id,
    })
    return getById(id)
}

export async function remove(id) {
    const exercise = await getById(id)
    if (exercise.inUse) {
        throw new AppError(
            'Este ejercicio ya se usó en rutinas, no se puede eliminar. Podés ocultarlo.',
            409,
            'EXERCISE_IN_USE',
        )
    }
    try {
        await pool.query('DELETE FROM exercises WHERE id = :id', { id })
    } catch (err) {
        // Segunda barrera: si otra rutina lo usó justo ahora, la clave foránea lo impide
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            throw new AppError('Este ejercicio ya se usó en rutinas. Podés ocultarlo.', 409, 'EXERCISE_IN_USE')
        }
        throw err
    }
} 