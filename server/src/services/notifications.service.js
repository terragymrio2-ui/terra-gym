import { pool } from '../config/db.js'
import { AppError } from '../utils/AppError.js'
import { addDays, daysBetween, nowAR, todayAR } from '../utils/dates.js'
import * as memberships from './memberships.service.js'

const EXPIRED_WINDOW_DAYS = 60

// Misma regla en JS (para mostrar) y en SQL (para filtrar): deben mantenerse iguales
export function noticeTypeFor(endDate, today) {
    const left = daysBetween(today, endDate)
    if (left < 0) return 'VENCIDA'
    return left <= 1 ? 'POR_VENCER_1' : 'POR_VENCER_7'
}

const TYPE_SQL = `CASE WHEN t.end_date < :today THEN 'VENCIDA'
  WHEN DATEDIFF(t.end_date, :today) <= 1 THEN 'POR_VENCER_1'
  ELSE 'POR_VENCER_7' END`

// Si ya renovó (hay otra membresía activa que termina después), no hay que avisarle
const BASE_WHERE = [
    "t.status IN ('POR_VENCER', 'VENCIDA')",
    "(t.status = 'POR_VENCER' OR t.end_date >= :since)",
    `NOT EXISTS (SELECT 1 FROM memberships m2
              WHERE m2.user_id = t.user_id AND m2.status = 'ACTIVA' AND m2.end_date > t.end_date)`,
]

export async function expirations({ status, notified, search, page, limit }) {
    const today = todayAR()
    const since = addDays(today, -EXPIRED_WINDOW_DAYS)
    const where = [...BASE_WHERE]
    const params = { since, limit, offset: (page - 1) * limit }

    if (status) {
        where.push('t.status = :status')
        params.status = status
    }
    if (search) {
        where.push(
            `(t.first_name LIKE :q OR t.last_name LIKE :q OR t.dni LIKE :q
        OR CONCAT(t.first_name, ' ', t.last_name) LIKE :q)`,
        )
        params.q = `%${search}%`
    }
    if (notified) {
        where.push(
            `${notified === 'yes' ? '' : 'NOT '}EXISTS (
         SELECT 1 FROM notification_log n
         WHERE n.membership_id = t.id AND n.channel = 'WHATSAPP' AND n.type = ${TYPE_SQL})`,
        )
    }
    const whereSql = `WHERE ${where.join(' AND ')}`
    const base = `WHERE ${BASE_WHERE.join(' AND ')}`

    const [total, expiringCount, expiredCount, rows] = await Promise.all([
        memberships.countCurrent(whereSql, params),
        memberships.countCurrent(`${base} AND t.status = 'POR_VENCER'`, { since }),
        memberships.countCurrent(`${base} AND t.status = 'VENCIDA'`, { since }),
        // Primero las que vencen pronto, después las vencidas (la más reciente primero)
        memberships.queryCurrent(
            whereSql,
            params,
            `ORDER BY (t.status = 'VENCIDA'), ABS(DATEDIFF(t.end_date, :today)), t.last_name, t.id
       LIMIT :limit OFFSET :offset`,
        ),
    ])

    const logs = new Map()
    if (rows.length) {
        const [found] = await pool.query(
            `SELECT membership_id, type, sent_at FROM notification_log
       WHERE membership_id IN (?) AND channel = 'WHATSAPP'`,
            [rows.map((r) => r.id)],
        )
        for (const l of found) logs.set(`${l.membership_id}:${l.type}`, l.sent_at)
    }

    return {
        items: rows.map((m) => {
            const noticeType = noticeTypeFor(m.endDate, today)
            return {
                membershipId: m.id,
                member: m.member,
                planName: m.plan.name,
                endDate: m.endDate,
                daysLeft: daysBetween(today, m.endDate),
                status: m.status,
                balance: m.balance,
                noticeType,
                notifiedAt: logs.get(`${m.id}:${noticeType}`) ?? null,
            }
        }),
        summary: { expiring: expiringCount, expired: expiredCount },
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
}

// Registra que el admin abrió el chat de WhatsApp (no se sabe si el mensaje se envió)
export async function logWhatsapp(membershipId) {
    const m = await memberships.getById(membershipId)
    if (!['POR_VENCER', 'VENCIDA'].includes(m.status)) {
        throw new AppError('Esta membresía no está por vencer ni vencida', 400, 'NOT_EXPIRING')
    }
    const type = noticeTypeFor(m.endDate, todayAR())
    await pool.query(
        `INSERT INTO notification_log (user_id, membership_id, type, channel, status, sent_at)
     VALUES (:userId, :membershipId, :type, 'WHATSAPP', 'ABIERTA', :now)
     ON DUPLICATE KEY UPDATE status = 'ABIERTA', sent_at = :now`,
        { userId: m.userId, membershipId, type, now: nowAR() },
    )
    return { type }
}