import { pool } from '../config/db.js'
import { AppError } from '../utils/AppError.js'
import { nowAR } from '../utils/dates.js'

// Los montos se comparan en centavos (enteros) para evitar errores de coma flotante
const toCents = (v) => Math.round(v * 100)

function toDto(p) {
    return {
        id: p.id,
        membershipId: p.membership_id,
        amount: p.amount,
        method: p.method,
        paidAt: p.paid_at,
        reference: p.reference,
        notes: p.notes,
        isVoided: p.voided_at !== null,
        voidedAt: p.voided_at,
        voidReason: p.void_reason,
    }
}

// Recibe una conexión para poder usarse dentro de una transacción
export async function insertPayment(conn, { membershipId, amount, method, reference, notes, registeredBy }) {
    const [result] = await conn.query(
        `INSERT INTO payments (membership_id, amount, method, paid_at, reference, notes, registered_by)
     VALUES (:membershipId, :amount, :method, :paidAt, :reference, :notes, :registeredBy)`,
        {
            membershipId,
            amount,
            method,
            paidAt: nowAR(),
            reference: reference ?? null,
            notes: notes ?? null,
            registeredBy,
        },
    )
    return result.insertId
}

// Devuelve Map(membershipId → pagos[]) para armar el detalle de varias membresías
export async function listByMembershipIds(ids) {
    const map = new Map()
    if (!ids.length) return map
    const [rows] = await pool.query(
        `SELECT id, membership_id, amount, method, paid_at, reference, notes, voided_at, void_reason
     FROM payments WHERE membership_id IN (?) ORDER BY paid_at DESC, id DESC`,
        [ids],
    )
    for (const row of rows) {
        if (!map.has(row.membership_id)) map.set(row.membership_id, [])
        map.get(row.membership_id).push(toDto(row))
    }
    return map
}

export async function register(data, actingUserId) {
    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()

        // FOR UPDATE: si dos pagos llegan a la vez, se procesan de a uno
        const [rows] = await conn.query(
            'SELECT id, price, status FROM memberships WHERE id = :id FOR UPDATE',
            { id: data.membershipId },
        )
        const membership = rows[0]
        if (!membership) throw new AppError('Membresía no encontrada', 404, 'NOT_FOUND')
        if (membership.status === 'CANCELADA') {
            throw new AppError('No se pueden registrar pagos en una membresía cancelada', 400, 'MEMBERSHIP_CANCELLED')
        }

        const [[{ paid }]] = await conn.query(
            `SELECT COALESCE(SUM(amount), 0) AS paid FROM payments
       WHERE membership_id = :id AND voided_at IS NULL`,
            { id: membership.id },
        )
        const balance = toCents(membership.price) - toCents(paid)
        if (toCents(data.amount) > balance) {
            throw new AppError(
                `El monto supera la deuda pendiente ($${balance / 100})`,
                400,
                'OVERPAYMENT',
            )
        }

        const paymentId = await insertPayment(conn, { ...data, registeredBy: actingUserId })
        await conn.commit()
        return { paymentId, membershipId: membership.id }
    } catch (err) {
        await conn.rollback()
        throw err
    } finally {
        conn.release()
    }
}

export async function voidPayment(id, reason) {
    const [result] = await pool.query(
        `UPDATE payments SET voided_at = :now, void_reason = :reason
     WHERE id = :id AND voided_at IS NULL`,
        { now: nowAR(), reason, id },
    )
    if (result.affectedRows === 0) {
        const [rows] = await pool.query('SELECT id FROM payments WHERE id = :id', { id })
        if (!rows[0]) throw new AppError('Pago no encontrado', 404, 'NOT_FOUND')
        throw new AppError('Ese pago ya estaba anulado', 409, 'ALREADY_VOIDED')
    }
    const [rows] = await pool.query('SELECT membership_id FROM payments WHERE id = :id', { id })
    return { membershipId: rows[0].membership_id }
}

export async function list({ from, to, method, page, limit }) {
    const where = []
    const params = { limit, offset: (page - 1) * limit }
    if (from) {
        where.push('DATE(p.paid_at) >= :from')
        params.from = from
    }
    if (to) {
        where.push('DATE(p.paid_at) <= :to')
        params.to = to
    }
    if (method) {
        where.push('p.method = :method')
        params.method = method
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

    // El total ignora los pagos anulados
    const [[summary]] = await pool.query(
        `SELECT COUNT(*) AS total,
            COALESCE(SUM(CASE WHEN p.voided_at IS NULL THEN p.amount END), 0) AS collected
     FROM payments p ${whereSql}`,
        params,
    )

    const [rows] = await pool.query(
        `SELECT p.id, p.membership_id, p.amount, p.method, p.paid_at, p.reference, p.notes,
            p.voided_at, p.void_reason,
            u.id AS user_id, u.first_name, u.last_name, pl.name AS plan_name
     FROM payments p
     JOIN memberships m ON m.id = p.membership_id
     JOIN users u ON u.id = m.user_id
     JOIN membership_plans pl ON pl.id = m.plan_id
     ${whereSql}
     ORDER BY p.paid_at DESC, p.id DESC
     LIMIT :limit OFFSET :offset`,
        params,
    )

    return {
        items: rows.map((r) => ({
            ...toDto(r),
            member: { id: r.user_id, firstName: r.first_name, lastName: r.last_name },
            planName: r.plan_name,
        })),
        collected: summary.collected,
        pagination: { page, limit, total: summary.total, totalPages: Math.ceil(summary.total / limit) },
    }
}