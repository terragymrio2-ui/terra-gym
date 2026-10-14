import { pool } from '../config/db.js'
import { AppError } from '../utils/AppError.js'
import { todayAR } from '../utils/dates.js'
import { assertExercisesUsable, loadStructure, writeStructure } from './trainingStructure.js'

const exerciseIds = (days) => days.flatMap((d) => d.exercises.map((e) => e.exerciseId))

const HEADER_SELECT = `
  SELECT p.id, p.member_id, p.trainer_id, p.source_template_id, p.title, p.objective, p.notes,
         p.is_active, p.revision, p.start_date, p.created_at, p.updated_at,
         m.first_name AS m_first, m.last_name AS m_last,
         t.first_name AS t_first, t.last_name AS t_last
  FROM training_plans p
  JOIN users m ON m.id = p.member_id
  JOIN users t ON t.id = p.trainer_id`

function toHeader(p) {
    return {
        id: p.id,
        name: p.title,
        objective: p.objective,
        notes: p.notes,
        isActive: Boolean(p.is_active),
        revision: p.revision,
        startDate: p.start_date,
        sourceTemplateId: p.source_template_id,
        member: { id: p.member_id, firstName: p.m_first, lastName: p.m_last },
        createdBy: { id: p.trainer_id, firstName: p.t_first, lastName: p.t_last },
        createdAt: p.created_at,
        updatedAt: p.updated_at,
    }
}

// Convierte la estructura leída de la base al formato que usa writeStructure
const toDays = (structure) =>
    structure.map((d) => ({
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

export async function getById(id, db = pool) {
    const [rows] = await db.query(`${HEADER_SELECT} WHERE p.id = :id`, { id })
    if (!rows[0]) throw new AppError('Rutina no encontrada', 404, 'NOT_FOUND')
    return { ...toHeader(rows[0]), days: await loadStructure(db, id) }
}

// Socios existentes, con rol USUARIO y activos. Los bloquea para evitar asignaciones simultáneas.
async function lockMembers(conn, memberIds) {
    const ids = [...new Set(memberIds)].sort((a, b) => a - b)
    const [rows] = await conn.query(
        "SELECT id, is_active FROM users WHERE role = 'USUARIO' AND id IN (?) ORDER BY id FOR UPDATE",
        [ids],
    )
    if (rows.length !== ids.length) {
        throw new AppError('Algún socio indicado no existe', 400, 'INVALID_MEMBERS')
    }
    if (rows.some((r) => !r.is_active)) {
        throw new AppError('Algún socio está inactivo', 400, 'MEMBER_INACTIVE')
    }
    return ids
}

async function deactivateActive(conn, memberId) {
    await conn.query('UPDATE training_plans SET is_active = 0 WHERE member_id = ? AND is_active = 1', [
        memberId,
    ])
}

async function insertPlan(conn, { memberId, trainerId, data, sourceTemplateId }) {
    await deactivateActive(conn, memberId)
    const [result] = await conn.query(
        `INSERT INTO training_plans
       (member_id, trainer_id, source_template_id, title, objective, notes, start_date, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [
            memberId,
            trainerId,
            sourceTemplateId ?? null,
            data.name,
            data.objective ?? null,
            data.notes ?? null,
            todayAR(),
        ],
    )
    await writeStructure(conn, result.insertId, data.days)
    return result.insertId
}

async function inTransaction(fn) {
    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()
        const result = await fn(conn)
        await conn.commit()
        return result
    } catch (err) {
        await conn.rollback()
        throw err
    } finally {
        conn.release()
    }
}

// Una copia independiente de la plantilla para cada socio
export async function assign({ templateId, memberIds }, actingUserId) {
    return inTransaction(async (conn) => {
        const [templates] = await conn.query(
            'SELECT id, title, objective, notes FROM training_plans WHERE id = ? AND member_id IS NULL',
            [templateId],
        )
        const template = templates[0]
        if (!template) throw new AppError('Plantilla no encontrada', 404, 'NOT_FOUND')

        const days = toDays(await loadStructure(conn, templateId))
        // Permite conservar ejercicios que hoy estén ocultos en el catálogo
        await assertExercisesUsable(conn, exerciseIds(days), new Set(exerciseIds(days)))

        const ids = await lockMembers(conn, memberIds)
        const data = { name: template.title, objective: template.objective, notes: template.notes, days }

        const created = []
        for (const memberId of ids) {
            const planId = await insertPlan(conn, {
                memberId,
                trainerId: actingUserId,
                data,
                sourceTemplateId: templateId,
            })
            created.push({ memberId, planId })
        }
        return created
    })
}

// Rutina armada desde cero para un socio
export async function createForMember({ memberId, ...data }, actingUserId) {
    const planId = await inTransaction(async (conn) => {
        await assertExercisesUsable(conn, exerciseIds(data.days))
        await lockMembers(conn, [memberId])
        return insertPlan(conn, { memberId, trainerId: actingUserId, data })
    })
    return getById(planId)
}

export async function update(id, data) {
    await inTransaction(async (conn) => {
        const [rows] = await conn.query(
            'SELECT id, revision FROM training_plans WHERE id = ? AND member_id IS NOT NULL FOR UPDATE',
            [id],
        )
        if (!rows[0]) throw new AppError('Rutina no encontrada', 404, 'NOT_FOUND')
        if (rows[0].revision !== data.expectedRevision) {
            throw new AppError(
                'Otra persona modificó esta rutina mientras la editabas. Recargá la página para ver los cambios y volvé a aplicar los tuyos.',
                409,
                'EDIT_CONFLICT',
            )
        }

        const [current] = await conn.query(
            `SELECT DISTINCT x.exercise_id FROM training_plan_exercises x
       JOIN training_plan_days d ON d.id = x.day_id WHERE d.plan_id = ?`,
            [id],
        )
        await assertExercisesUsable(
            conn,
            exerciseIds(data.days),
            new Set(current.map((r) => r.exercise_id)),
        )

        await conn.query(
            `UPDATE training_plans SET title = ?, objective = ?, notes = ?, revision = revision + 1
       WHERE id = ?`,
            [data.name, data.objective ?? null, data.notes ?? null, id],
        )
        await conn.query('DELETE FROM training_plan_days WHERE plan_id = ?', [id])
        await writeStructure(conn, id, data.days)
    })
    return getById(id)
}

// Activar una rutina vieja desactiva la que estaba activa
export async function setStatus(id, isActive) {
    await inTransaction(async (conn) => {
        const [rows] = await conn.query(
            'SELECT id, member_id FROM training_plans WHERE id = ? AND member_id IS NOT NULL FOR UPDATE',
            [id],
        )
        if (!rows[0]) throw new AppError('Rutina no encontrada', 404, 'NOT_FOUND')
        if (isActive) await deactivateActive(conn, rows[0].member_id)
        await conn.query('UPDATE training_plans SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id])
    })
    return getById(id)
}

// Historial de rutinas de un socio (la activa primero)
export async function listForMember(memberId) {
    const [rows] = await pool.query(
        `${HEADER_SELECT} WHERE p.member_id = :memberId
     ORDER BY p.is_active DESC, p.created_at DESC, p.id DESC`,
        { memberId },
    )
    return rows.map(toHeader)
}

// La rutina activa del propio socio (o null)
export async function getMine(userId) {
    const [rows] = await pool.query(
        `${HEADER_SELECT} WHERE p.member_id = :userId AND p.is_active = 1`,
        { userId },
    )
    if (!rows[0]) return null
    return { ...toHeader(rows[0]), days: await loadStructure(pool, rows[0].id) }
}

// Pantalla "Socios y rutinas": datos mínimos de cada socio activo
export async function overview({ search, hasPlan, page, limit }) {
    const where = ["u.role = 'USUARIO'", 'u.is_active = 1']
    const params = { limit, offset: (page - 1) * limit }
    if (search) {
        where.push(
            `(u.first_name LIKE :q OR u.last_name LIKE :q OR u.dni LIKE :q
        OR CONCAT(u.first_name, ' ', u.last_name) LIKE :q)`,
        )
        params.q = `%${search}%`
    }
    if (hasPlan === 'with') where.push('p.id IS NOT NULL')
    if (hasPlan === 'without') where.push('p.id IS NULL')

    const from = `FROM users u
    LEFT JOIN training_plans p ON p.member_id = u.id AND p.is_active = 1
    WHERE ${where.join(' AND ')}`

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total ${from}`, params)
    const [rows] = await pool.query(
        `SELECT u.id, u.first_name, u.last_name, u.dni,
            p.id AS plan_id, p.title AS plan_name, p.start_date
     ${from}
     ORDER BY u.last_name, u.first_name LIMIT :limit OFFSET :offset`,
        params,
    )

    return {
        items: rows.map((r) => ({
            id: r.id,
            firstName: r.first_name,
            lastName: r.last_name,
            dni: r.dni,
            activePlan: r.plan_id
                ? { id: r.plan_id, name: r.plan_name, startDate: r.start_date }
                : null,
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
}