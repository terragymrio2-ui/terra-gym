import { pool } from '../config/db.js'
import { AppError } from '../utils/AppError.js'

async function assertTrainer(trainerId) {
    const [rows] = await pool.query('SELECT role FROM users WHERE id = :id', { id: trainerId })
    if (!rows[0]) throw new AppError('Profesor no encontrado', 404, 'NOT_FOUND')
    if (rows[0].role !== 'PROFESOR') {
        throw new AppError('El usuario indicado no es un profesor', 400, 'NOT_A_TRAINER')
    }
}

export async function listMembers(trainerId) {
    await assertTrainer(trainerId)
    const [rows] = await pool.query(
        `SELECT u.id, u.first_name, u.last_name, u.email, u.dni, u.is_active, tm.created_at AS assigned_at
     FROM trainer_members tm
     JOIN users u ON u.id = tm.member_id
     WHERE tm.trainer_id = :trainerId
     ORDER BY u.last_name, u.first_name`,
        { trainerId },
    )
    return rows.map((r) => ({
        id: r.id,
        firstName: r.first_name,
        lastName: r.last_name,
        email: r.email,
        dni: r.dni,
        isActive: Boolean(r.is_active),
        assignedAt: r.assigned_at,
    }))
}

export async function addMembers(trainerId, memberIds) {
    await assertTrainer(trainerId)
    const ids = [...new Set(memberIds)]

    // Todos los ids deben ser socios (rol USUARIO) existentes
    const marks = ids.map(() => '?').join(',')
    const [found] = await pool.query(
        `SELECT id FROM users WHERE role = 'USUARIO' AND id IN (${marks})`,
        ids,
    )
    if (found.length !== ids.length) {
        throw new AppError('Algún socio indicado no existe o no tiene rol de socio', 400, 'INVALID_MEMBERS')
    }

    // INSERT IGNORE: si la asignación ya existe, se omite sin error
    const values = ids.map(() => '(?, ?)').join(',')
    await pool.query(
        `INSERT IGNORE INTO trainer_members (trainer_id, member_id) VALUES ${values}`,
        ids.flatMap((memberId) => [trainerId, memberId]),
    )
    return listMembers(trainerId)
}

export async function removeMember(trainerId, memberId) {
    const [result] = await pool.query(
        'DELETE FROM trainer_members WHERE trainer_id = :trainerId AND member_id = :memberId',
        { trainerId, memberId },
    )
    if (result.affectedRows === 0) {
        throw new AppError('Esa asignación no existe', 404, 'NOT_FOUND')
    }
}