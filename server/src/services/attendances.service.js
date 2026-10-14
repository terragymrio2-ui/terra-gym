import { pool } from '../config/db.js'
import { AppError } from '../utils/AppError.js'
import { addDays, nowAR, todayAR, weekStart } from '../utils/dates.js'
import { currentForMembers } from './memberships.service.js'

// level 'confirm' = hay que confirmar para registrar. level 'info' = solo informa.
function evaluate({ membership, weekCount }) {
    const warnings = []

    if (!membership) {
        warnings.push({ code: 'NO_MEMBERSHIP', level: 'confirm' })
        return warnings
    }

    const { status, startDate, endDate, balance, plan } = membership
    if (status === 'VENCIDA') warnings.push({ code: 'EXPIRED', level: 'confirm', data: { endDate } })
    if (status === 'CANCELADA') warnings.push({ code: 'CANCELLED', level: 'confirm' })
    if (status === 'PROGRAMADA') warnings.push({ code: 'NOT_STARTED', level: 'confirm', data: { startDate } })
    if (status === 'POR_VENCER') warnings.push({ code: 'EXPIRING', level: 'info', data: { endDate } })

    if (['VIGENTE', 'POR_VENCER'].includes(status) && weekCount >= plan.daysPerWeek) {
        warnings.push({
            code: 'WEEKLY_LIMIT',
            level: 'confirm',
            data: { weekCount, daysPerWeek: plan.daysPerWeek },
        })
    }
    if (status !== 'CANCELADA' && balance > 0) {
        warnings.push({ code: 'DEBT', level: 'info', data: { balance } })
    }
    return warnings
}

async function weekCounts(memberIds, today) {
    const start = weekStart(today)
    const end = addDays(start, 6)
    const [rows] = await pool.query(
        `SELECT member_id, COUNT(*) AS n FROM attendances
     WHERE member_id IN (?) AND voided_at IS NULL AND attendance_date BETWEEN ? AND ?
     GROUP BY member_id`,
        [memberIds, start, end],
    )
    return new Map(rows.map((r) => [r.member_id, r.n]))
}

// Estado de check-in de cada socio: membresía, ingresos de la semana y avisos
async function snapshots(users) {
    if (!users.length) return []
    const ids = users.map((u) => u.id)
    const today = todayAR()

    const [memberships, counts, [todayRows]] = await Promise.all([
        currentForMembers(ids),
        weekCounts(ids, today),
        pool.query(
            'SELECT member_id FROM attendances WHERE member_id IN (?) AND attendance_date = ? AND voided_at IS NULL',
            [ids, today],
        ),
    ])
    const checkedToday = new Set(todayRows.map((r) => r.member_id))

    return users.map((u) => {
        const membership = memberships.get(u.id) ?? null
        const weekCount = counts.get(u.id) ?? 0
        const warnings = evaluate({ membership, weekCount })
        return {
            id: u.id,
            firstName: u.first_name,
            lastName: u.last_name,
            dni: u.dni,
            membership: membership && {
                status: membership.status,
                planName: membership.plan.name,
                startDate: membership.startDate,
                endDate: membership.endDate,
                balance: membership.balance,
            },
            weekCount,
            weekLimit: membership?.plan.daysPerWeek ?? null,
            checkedInToday: checkedToday.has(u.id),
            warnings,
            requiresConfirmation: warnings.some((w) => w.level === 'confirm'),
        }
    })
}

// Búsqueda de recepción: datos mínimos del socio, sin teléfono ni email
export async function lookup(search) {
    const [users] = await pool.query(
        `SELECT id, first_name, last_name, dni FROM users
     WHERE role = 'USUARIO' AND is_active = 1
       AND (first_name LIKE :q OR last_name LIKE :q OR dni LIKE :q
            OR CONCAT(first_name, ' ', last_name) LIKE :q)
     ORDER BY last_name, first_name LIMIT 8`,
        { q: `%${search}%` },
    )
    return snapshots(users)
}

export async function checkIn({ memberId, confirm }, actingUserId) {
    const [users] = await pool.query(
        "SELECT id, first_name, last_name, dni FROM users WHERE id = :id AND role = 'USUARIO' AND is_active = 1",
        { id: memberId },
    )
    if (!users[0]) throw new AppError('Socio no encontrado o inactivo', 404, 'NOT_FOUND')

    const [snap] = await snapshots(users)
    if (snap.checkedInToday) {
        throw new AppError('Este socio ya registró su ingreso hoy', 409, 'ALREADY_CHECKED_IN')
    }
    if (snap.requiresConfirmation && !confirm) {
        throw new AppError('Hay avisos que confirmar antes de registrar el ingreso', 409, 'CONFIRMATION_REQUIRED', {
            warnings: snap.warnings,
        })
    }

    const reasons = snap.warnings.filter((w) => w.level === 'confirm').map((w) => w.code)
    try {
        const [result] = await pool.query(
            `INSERT INTO attendances
         (member_id, attendance_date, checked_in_at, registered_by, override, override_reasons)
       VALUES (:memberId, :date, :now, :registeredBy, :override, :reasons)`,
            {
                memberId,
                date: todayAR(),
                now: nowAR(),
                registeredBy: actingUserId,
                override: reasons.length ? 1 : 0,
                reasons: reasons.length ? reasons.join(',') : null,
            },
        )
        return {
            id: result.insertId,
            member: { id: snap.id, firstName: snap.firstName, lastName: snap.lastName },
            override: reasons.length > 0,
            weekCount: snap.weekCount + 1,
            weekLimit: snap.weekLimit,
            warnings: snap.warnings,
        }
    } catch (err) {
        // Dos registros simultáneos: el índice único deja pasar solo uno
        if (err.code === 'ER_DUP_ENTRY') {
            throw new AppError('Este socio ya registró su ingreso hoy', 409, 'ALREADY_CHECKED_IN')
        }
        throw err
    }
}

function toDto(r) {
    return {
        id: r.id,
        date: r.attendance_date,
        checkedInAt: r.checked_in_at,
        override: Boolean(r.override),
        overrideReasons: r.override_reasons ? r.override_reasons.split(',') : [],
        isVoided: r.voided_at !== null,
        voidedAt: r.voided_at,
        voidReason: r.void_reason,
        member: { id: r.member_id, firstName: r.m_first, lastName: r.m_last, dni: r.m_dni },
        registeredBy: { firstName: r.r_first, lastName: r.r_last },
    }
}

export async function list({ from, to, memberId, search, page, limit }) {
    const today = todayAR()
    const where = ['a.attendance_date BETWEEN :from AND :to']
    const params = { from: from ?? to ?? today, to: to ?? from ?? today, limit, offset: (page - 1) * limit }
    if (memberId) {
        where.push('a.member_id = :memberId')
        params.memberId = memberId
    }
    if (search) {
        where.push(
            `(m.first_name LIKE :q OR m.last_name LIKE :q OR m.dni LIKE :q
        OR CONCAT(m.first_name, ' ', m.last_name) LIKE :q)`,
        )
        params.q = `%${search}%`
    }
    const fromSql = `FROM attendances a
    JOIN users m ON m.id = a.member_id
    JOIN users r ON r.id = a.registered_by
    WHERE ${where.join(' AND ')}`

    const [[summary]] = await pool.query(
        `SELECT COUNT(*) AS total,
            COALESCE(SUM(a.voided_at IS NULL), 0) AS valid
     ${fromSql}`,
        params,
    )
    const [rows] = await pool.query(
        `SELECT a.id, a.member_id, a.attendance_date, a.checked_in_at, a.override, a.override_reasons,
            a.voided_at, a.void_reason,
            m.first_name AS m_first, m.last_name AS m_last, m.dni AS m_dni,
            r.first_name AS r_first, r.last_name AS r_last
     ${fromSql}
     ORDER BY a.checked_in_at DESC, a.id DESC LIMIT :limit OFFSET :offset`,
        params,
    )

    return {
        items: rows.map(toDto),
        validCount: Number(summary.valid),
        pagination: { page, limit, total: summary.total, totalPages: Math.ceil(summary.total / limit) },
    }
}

export async function voidAttendance(id, reason, actingUserId) {
    const [result] = await pool.query(
        `UPDATE attendances SET voided_at = :now, void_reason = :reason, voided_by = :by
     WHERE id = :id AND voided_at IS NULL`,
        { now: nowAR(), reason, by: actingUserId, id },
    )
    if (result.affectedRows === 0) {
        const [rows] = await pool.query('SELECT id FROM attendances WHERE id = :id', { id })
        if (!rows[0]) throw new AppError('Ingreso no encontrado', 404, 'NOT_FOUND')
        throw new AppError('Ese ingreso ya estaba anulado', 409, 'ALREADY_VOIDED')
    }
}

// Asistencias propias del socio en un mes, y cuántos días lleva esta semana
export async function getMine(userId, month) {
    const today = todayAR()
    const ym = month ?? today.slice(0, 7)
    const [y, m] = ym.split('-').map(Number)
    const first = `${ym}-01`
    const last = `${ym}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0')}`

    const [rows] = await pool.query(
        `SELECT attendance_date FROM attendances
     WHERE member_id = :userId AND voided_at IS NULL AND attendance_date BETWEEN :first AND :last
     ORDER BY attendance_date`,
        { userId: userId, first, last },
    )
    const counts = await weekCounts([userId], today)
    const membership = (await currentForMembers([userId])).get(userId)

    return {
        month: ym,
        dates: rows.map((r) => r.attendance_date),
        weekCount: counts.get(userId) ?? 0,
        weekLimit: membership?.plan.daysPerWeek ?? null,
    }
}