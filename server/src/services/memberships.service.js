import { pool } from '../config/db.js'
import { AppError } from '../utils/AppError.js'
import { addDays, membershipEnd, todayAR } from '../utils/dates.js'
import * as paymentsService from './payments.service.js'

// Los estados se calculan con la fecha de hoy (Argentina) que se pasa como :today.
// Nunca se usa CURDATE(): el servidor de producción corre en UTC.
const INNER = `(
  SELECT m.id, m.user_id, m.start_date, m.end_date, m.price, m.created_at,
         u.first_name, u.last_name, u.email, u.dni, u.phone,
         p.id AS plan_id, p.name AS plan_name, p.days_per_week,
         COALESCE(pay.paid, 0) AS paid,
         CASE
           WHEN m.status = 'CANCELADA' THEN 'CANCELADA'
           WHEN m.end_date < :today THEN 'VENCIDA'
           WHEN m.start_date > :today THEN 'PROGRAMADA'
           WHEN DATEDIFF(m.end_date, :today) <= 7 THEN 'POR_VENCER'
           ELSE 'VIGENTE'
         END AS status,
         CASE
           WHEN COALESCE(pay.paid, 0) >= m.price THEN 'PAGADA'
           WHEN COALESCE(pay.paid, 0) > 0 THEN 'PARCIAL'
           ELSE 'PENDIENTE'
         END AS payment_status
  FROM memberships m
  JOIN users u ON u.id = m.user_id
  JOIN membership_plans p ON p.id = m.plan_id
  LEFT JOIN (
    SELECT membership_id, SUM(amount) AS paid
    FROM payments WHERE voided_at IS NULL GROUP BY membership_id
  ) pay ON pay.membership_id = m.id
) t`
// Con current=true devuelve una sola membresía por socio (la "actual").
// Prioridad: en curso > próxima programada > última vencida > cancelada.
function source(current) {
    if (!current) return INNER
    return `(
    SELECT x.* FROM (
      SELECT t.*, ROW_NUMBER() OVER (
        PARTITION BY t.user_id
        ORDER BY
          CASE
            WHEN t.status IN ('VIGENTE', 'POR_VENCER') THEN 1
            WHEN t.status = 'PROGRAMADA' THEN 2
            WHEN t.status = 'VENCIDA' THEN 3
            ELSE 4
          END,
          CASE WHEN t.status = 'PROGRAMADA' THEN t.start_date END ASC,
          t.end_date DESC,
          t.id DESC
      ) AS rn
      FROM ${INNER}
    ) x WHERE x.rn = 1
  ) t`
}

function toDto(r) {
    return {
        id: r.id,
        userId: r.user_id,
        member: {
            id: r.user_id,
            firstName: r.first_name,
            lastName: r.last_name,
            email: r.email,
            dni: r.dni,
            phone: r.phone,
        },
        plan: { id: r.plan_id, name: r.plan_name, daysPerWeek: r.days_per_week },
        startDate: r.start_date,
        endDate: r.end_date,
        price: r.price,
        paid: r.paid,
        balance: Math.round((r.price - r.paid) * 100) / 100,
        status: r.status,
        paymentStatus: r.payment_status,
        createdAt: r.created_at,
    }
}

async function select(whereSql, params, tail = '', src = INNER) {
    const [rows] = await pool.query(`SELECT * FROM ${src} ${whereSql} ${tail}`, {
        today: todayAR(),
        ...params,
    })
    return rows.map(toDto)
}

async function withPayments(items) {
    const map = await paymentsService.listByMembershipIds(items.map((i) => i.id))
    return items.map((i) => ({ ...i, payments: map.get(i.id) ?? [] }))
}

export async function list({ status, paymentStatus, userId, search, current, page, limit }) {
    const where = []
    const params = { limit, offset: (page - 1) * limit }
    if (status) {
        where.push('t.status = :status')
        params.status = status
    }
    if (paymentStatus) {
        where.push('t.payment_status = :paymentStatus')
        params.paymentStatus = paymentStatus
    }
    if (userId) {
        where.push('t.user_id = :userId')
        params.userId = userId
    }
    if (search) {
        where.push(
            `(t.first_name LIKE :q OR t.last_name LIKE :q OR t.dni LIKE :q
        OR CONCAT(t.first_name, ' ', t.last_name) LIKE :q)`,
        )
        params.q = `%${search}%`
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const src = source(current)

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM ${src} ${whereSql}`, {
        today: todayAR(),
        ...params,
    })

    const order = current
        ? 'ORDER BY t.last_name, t.first_name, t.id'
        : 'ORDER BY t.end_date DESC, t.id DESC'
    const items = await select(whereSql, params, `${order} LIMIT :limit OFFSET :offset`, src)

    // Con filtro por socio se incluyen los pagos de cada período (pantalla de detalle)
    const result = userId ? await withPayments(items) : items
    return { items: result, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}
export async function getById(id) {
    const [item] = await select('WHERE t.id = :id', { id })
    if (!item) throw new AppError('Membresía no encontrada', 404, 'NOT_FOUND')
    return (await withPayments([item]))[0]
}

// Membresías propias del socio, con su historial de pagos
export async function listForMember(userId) {
    const items = await select('WHERE t.user_id = :userId', { userId }, 'ORDER BY t.start_date DESC LIMIT 24')
    return withPayments(items)
}
// Membresía "actual" de varios socios a la vez: Map(userId → membresía)
export async function currentForMembers(userIds) {
    const map = new Map()
    if (!userIds.length) return map
    const items = await select('WHERE t.user_id IN (:ids)', { ids: userIds }, '', source(true))
    for (const item of items) map.set(item.userId, item)
    return map
}
export async function create({ userId, planId, payment, confirmRenewal }, actingUserId) {
    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()

        // Bloquea al socio: dos altas simultáneas no pueden pisarse las fechas
        const [users] = await conn.query(
            'SELECT id, role, is_active FROM users WHERE id = :id FOR UPDATE',
            { id: userId },
        )
        const user = users[0]
        if (!user) throw new AppError('Socio no encontrado', 404, 'NOT_FOUND')
        if (user.role !== 'USUARIO') {
            throw new AppError('Solo los socios pueden tener membresía', 400, 'NOT_A_MEMBER')
        }
        if (!user.is_active) {
            throw new AppError('El socio está inactivo. Activalo antes de crear una membresía', 400, 'USER_INACTIVE')
        }

        const [plans] = await conn.query(
            'SELECT id, price, duration_months, is_active FROM membership_plans WHERE id = :id',
            { id: planId },
        )
        const plan = plans[0]
        if (!plan) throw new AppError('Plan no encontrado', 404, 'NOT_FOUND')
        if (!plan.is_active) throw new AppError('Ese plan está desactivado', 400, 'PLAN_INACTIVE')

        if (payment && Math.round(payment.amount * 100) > Math.round(plan.price * 100)) {
            throw new AppError('El pago inicial supera el precio del plan', 400, 'OVERPAYMENT')
        }

        // Renovación: empieza al día siguiente de la última membresía vigente o programada
        const today = todayAR()
        // Aviso: ya tiene una renovación programada. Hay que confirmar explícitamente.
        const [[{ scheduled, next_start }]] = await conn.query(
            `SELECT COUNT(*) AS scheduled, MIN(start_date) AS next_start FROM memberships
       WHERE user_id = :userId AND status = 'ACTIVA' AND start_date > :today`,
            { userId, today },
        )
        if (scheduled > 0 && !confirmRenewal) {
            throw new AppError(
                'Este socio ya tiene una renovación programada.',
                409,
                'ALREADY_SCHEDULED',
                { nextStartDate: next_start },
            )
        }
        const [[{ last_end }]] = await conn.query(
            `SELECT MAX(end_date) AS last_end FROM memberships
       WHERE user_id = :userId AND status = 'ACTIVA' AND end_date >= :today`,
            { userId, today },
        )
        const startDate = last_end ? addDays(last_end, 1) : today
        const endDate = membershipEnd(startDate, plan.duration_months)

        const [result] = await conn.query(
            `INSERT INTO memberships (user_id, plan_id, start_date, end_date, price, created_by)
       VALUES (:userId, :planId, :startDate, :endDate, :price, :createdBy)`,
            { userId, planId, startDate, endDate, price: plan.price, createdBy: actingUserId },
        )

        if (payment) {
            await paymentsService.insertPayment(conn, {
                ...payment,
                membershipId: result.insertId,
                registeredBy: actingUserId,
            })
        }

        await conn.commit()
        return getById(result.insertId)
    } catch (err) {
        await conn.rollback()
        throw err
    } finally {
        conn.release()
    }
}

export async function cancel(id) {
    const membership = await getById(id)
    if (membership.status === 'CANCELADA') {
        throw new AppError('La membresía ya estaba cancelada', 409, 'ALREADY_CANCELLED')
    }
    await pool.query("UPDATE memberships SET status = 'CANCELADA' WHERE id = :id", { id })
    return getById(id)
}
// Consultas sobre "la membresía actual de cada socio" (las usa notifications.service)
export async function queryCurrent(whereSql, params, tail = '') {
    return select(whereSql, params, tail, source(true))
}

export async function countCurrent(whereSql, params) {
    const [[{ total }]] = await pool.query(
        `SELECT COUNT(*) AS total FROM ${source(true)} ${whereSql}`,
        { today: todayAR(), ...params },
    )
    return total
}