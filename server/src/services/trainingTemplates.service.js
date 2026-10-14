import { pool } from '../config/db.js'
import { AppError } from '../utils/AppError.js'
import { assertExercisesUsable, loadStructure, writeStructure } from './trainingStructure.js'

const exerciseIds = (days) => days.flatMap((d) => d.exercises.map((e) => e.exerciseId))

const HEADER_SELECT = `
  SELECT p.id, p.title, p.objective, p.notes, p.revision, p.trainer_id, p.created_at, p.updated_at,
         u.first_name, u.last_name
  FROM training_plans p
  JOIN users u ON u.id = p.trainer_id`

function toHeader(p) {
    return {
        id: p.id,
        name: p.title,
        objective: p.objective,
        notes: p.notes,
        revision: p.revision,
        createdBy: { id: p.trainer_id, firstName: p.first_name, lastName: p.last_name },
        createdAt: p.created_at,
        updatedAt: p.updated_at,
    }
}

export async function list({ search, page, limit }) {
    const where = ['p.member_id IS NULL']
    const params = { limit, offset: (page - 1) * limit }
    if (search) {
        where.push('(p.title LIKE :q OR p.objective LIKE :q)')
        params.q = `%${search}%`
    }
    const whereSql = `WHERE ${where.join(' AND ')}`

    const [[{ total }]] = await pool.query(
        `SELECT COUNT(*) AS total FROM training_plans p ${whereSql}`,
        params,
    )
    const [rows] = await pool.query(
        `SELECT p.id, p.title, p.objective, p.notes, p.revision, p.trainer_id,
            p.created_at, p.updated_at, u.first_name, u.last_name,
            (SELECT COUNT(*) FROM training_plan_days d WHERE d.plan_id = p.id) AS days_count,
            (SELECT COUNT(*) FROM training_plan_exercises x
               JOIN training_plan_days d ON d.id = x.day_id
              WHERE d.plan_id = p.id) AS exercises_count
     FROM training_plans p
     JOIN users u ON u.id = p.trainer_id
     ${whereSql}
     ORDER BY p.updated_at DESC, p.id DESC
     LIMIT :limit OFFSET :offset`,
        params,
    )

    return {
        items: rows.map((r) => ({
            ...toHeader(r),
            daysCount: r.days_count,
            exercisesCount: r.exercises_count,
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
}

export async function getById(id) {
    const [rows] = await pool.query(`${HEADER_SELECT} WHERE p.id = :id AND p.member_id IS NULL`, { id })
    if (!rows[0]) throw new AppError('Plantilla no encontrada', 404, 'NOT_FOUND')
    return { ...toHeader(rows[0]), days: await loadStructure(pool, id) }
}

export async function create(data, actingUserId, allowedHiddenIds = new Set()) {
    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()
        await assertExercisesUsable(conn, exerciseIds(data.days), allowedHiddenIds)

        const [result] = await conn.query(
            `INSERT INTO training_plans (member_id, trainer_id, title, objective, notes)
       VALUES (NULL, :trainerId, :name, :objective, :notes)`,
            {
                trainerId: actingUserId,
                name: data.name,
                objective: data.objective ?? null,
                notes: data.notes ?? null,
            },
        )
        await writeStructure(conn, result.insertId, data.days)
        await conn.commit()
        return getById(result.insertId)
    } catch (err) {
        await conn.rollback()
        throw err
    } finally {
        conn.release()
    }
}

export async function update(id, data) {
    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()

        // FOR UPDATE: dos guardados simultáneos se procesan de a uno
        const [rows] = await conn.query(
            'SELECT id, revision FROM training_plans WHERE id = :id AND member_id IS NULL FOR UPDATE',
            { id },
        )
        if (!rows[0]) throw new AppError('Plantilla no encontrada', 404, 'NOT_FOUND')
        if (rows[0].revision !== data.expectedRevision) {
            throw new AppError(
                'Otra persona modificó esta plantilla mientras la editabas. Recargá la página para ver los cambios y volvé a aplicar los tuyos.',
                409,
                'EDIT_CONFLICT',
            )
        }

        const [current] = await conn.query(
            `SELECT DISTINCT x.exercise_id FROM training_plan_exercises x
       JOIN training_plan_days d ON d.id = x.day_id WHERE d.plan_id = :id`,
            { id },
        )
        await assertExercisesUsable(
            conn,
            exerciseIds(data.days),
            new Set(current.map((r) => r.exercise_id)),
        )

        await conn.query(
            `UPDATE training_plans
       SET title = :name, objective = :objective, notes = :notes, revision = revision + 1
       WHERE id = :id`,
            { id, name: data.name, objective: data.objective ?? null, notes: data.notes ?? null },
        )
        // Se reemplaza toda la estructura; los ejercicios se borran en cascada con los días
        await conn.query('DELETE FROM training_plan_days WHERE plan_id = :id', { id })
        await writeStructure(conn, id, data.days)

        await conn.commit()
        return getById(id)
    } catch (err) {
        await conn.rollback()
        throw err
    } finally {
        conn.release()
    }
}

export async function duplicate(id, actingUserId) {
    const source = await getById(id)
    const days = source.days.map((d) => ({
        name: d.name,
        exercises: d.exercises.map((e) => ({
            exerciseId: e.exerciseId,
            block: e.block,
            sets: e.sets,
            reps: e.reps,
            restSeconds: e.restSeconds,
            intensity: e.intensity,
            suggestedWeight: e.suggestedWeight,
            notes: e.notes,
        })),
    }))
    return create(
        {
            name: `${source.name.slice(0, 140)} (copia)`,
            objective: source.objective,
            notes: source.notes,
            days,
        },
        actingUserId,
        new Set(exerciseIds(days)), // puede conservar ejercicios que hoy estén ocultos
    )
}

// Solo quien la creó o un ADMIN. Las rutinas ya asignadas no se ven afectadas.
export async function remove(id, user) {
    const [rows] = await pool.query(
        'SELECT trainer_id FROM training_plans WHERE id = :id AND member_id IS NULL',
        { id },
    )
    if (!rows[0]) throw new AppError('Plantilla no encontrada', 404, 'NOT_FOUND')
    if (user.role !== 'ADMIN' && rows[0].trainer_id !== user.id) {
        throw new AppError('Solo quien creó la plantilla o un administrador puede eliminarla', 403, 'FORBIDDEN')
    }
    await pool.query('DELETE FROM training_plans WHERE id = :id', { id })
}