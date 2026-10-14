import { pool } from '../config/db.js'
import { AppError } from '../utils/AppError.js'
import { nowAR } from '../utils/dates.js'
import { currentForMembers } from './memberships.service.js'

// Regla de cada segmento, según la membresía actual del socio (o null si no tiene)
const MATCHERS = {
    TODOS: () => true,
    VIGENTES: (m) => !!m && ['VIGENTE', 'POR_VENCER'].includes(m.status),
    POR_VENCER: (m) => m?.status === 'POR_VENCER',
    VENCIDOS: (m) => m?.status === 'VENCIDA',
    CON_DEUDA: (m) => !!m && m.status !== 'CANCELADA' && m.balance > 0,
    SIN_CUOTA: (m) => !m || m.status === 'CANCELADA',
}

async function audienceIds(audience) {
    const [users] = await pool.query("SELECT id FROM users WHERE role = 'USUARIO' AND is_active = 1")
    const ids = users.map((u) => u.id)
    if (audience === 'TODOS') return ids
    const current = await currentForMembers(ids)
    return ids.filter((id) => MATCHERS[audience](current.get(id) ?? null))
}

export async function preview(audience) {
    return { count: (await audienceIds(audience)).length }
}

export async function create({ title, message, audience }, actingUserId) {
    const ids = await audienceIds(audience)
    if (!ids.length) {
        throw new AppError('Ningún socio coincide con esos destinatarios', 400, 'NO_RECIPIENTS')
    }

    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()
        const [result] = await conn.query(
            'INSERT INTO announcements (title, message, audience, created_by) VALUES (?, ?, ?, ?)',
            [title, message, audience, actingUserId],
        )
        await conn.query('INSERT INTO announcement_recipients (announcement_id, user_id) VALUES ?', [
            ids.map((userId) => [result.insertId, userId]),
        ])
        await conn.commit()
        return { id: result.insertId, recipients: ids.length }
    } catch (err) {
        await conn.rollback()
        throw err
    } finally {
        conn.release()
    }
}

export async function list({ page, limit }) {
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM announcements')
    const [rows] = await pool.query(
        `SELECT a.id, a.title, a.message, a.audience, a.is_active, a.created_at,
            u.first_name, u.last_name,
            COUNT(r.user_id) AS recipients,
            COALESCE(SUM(r.read_at IS NOT NULL), 0) AS read_count
     FROM announcements a
     JOIN users u ON u.id = a.created_by
     LEFT JOIN announcement_recipients r ON r.announcement_id = a.id
     GROUP BY a.id, u.first_name, u.last_name
     ORDER BY a.created_at DESC, a.id DESC
     LIMIT :limit OFFSET :offset`,
        { limit, offset: (page - 1) * limit },
    )
    return {
        items: rows.map((r) => ({
            id: r.id,
            title: r.title,
            message: r.message,
            audience: r.audience,
            isActive: Boolean(r.is_active),
            createdAt: r.created_at,
            createdBy: `${r.first_name} ${r.last_name}`,
            recipients: r.recipients,
            readCount: Number(r.read_count),
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
}

export async function setStatus(id, isActive) {
    const [result] = await pool.query('UPDATE announcements SET is_active = ? WHERE id = ?', [
        isActive ? 1 : 0,
        id,
    ])
    if (result.affectedRows === 0) throw new AppError('Aviso no encontrado', 404, 'NOT_FOUND')
}

// Avisos sin leer del propio socio (solo los activos)
export async function pendingFor(userId) {
    const [rows] = await pool.query(
        `SELECT a.id, a.title, a.message, a.created_at
     FROM announcement_recipients r
     JOIN announcements a ON a.id = r.announcement_id
     WHERE r.user_id = :userId AND r.read_at IS NULL AND a.is_active = 1
     ORDER BY a.created_at, a.id`,
        { userId },
    )
    return rows.map((r) => ({ id: r.id, title: r.title, message: r.message, createdAt: r.created_at }))
}

export async function markRead(id, userId) {
    const [exists] = await pool.query(
        'SELECT 1 FROM announcement_recipients WHERE announcement_id = ? AND user_id = ?',
        [id, userId],
    )
    if (!exists[0]) throw new AppError('Aviso no encontrado', 404, 'NOT_FOUND')
    // Idempotente: si ya estaba leído no cambia nada
    await pool.query(
        `UPDATE announcement_recipients SET read_at = ?
     WHERE announcement_id = ? AND user_id = ? AND read_at IS NULL`,
        [nowAR(), id, userId],
    )
}