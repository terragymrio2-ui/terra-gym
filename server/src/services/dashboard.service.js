import { pool } from '../config/db.js'
import { addDays, lastDays, lastMonths, todayAR, weekStart } from '../utils/dates.js'
import { countCurrent, currentForMembers, queryCurrent } from './memberships.service.js'
import * as notifications from './notifications.service.js'

const num = (v) => Number(v) || 0

export async function admin() {
    const today = todayAR()
    const monthFirst = `${today.slice(0, 7)}-01`
    const months = lastMonths(today, 6)
    const days = lastDays(today, 30)
    const since30 = days[0]
    const since6m = `${months[0]}-01`

    const [
        [[members]],
        [[debt]],
        [[collected]],
        [[todayCount]],
        [revenueRows],
        [dailyRows],
        [hourRows],
        planRows,
        statusCounts,
        upcoming,
    ] = await Promise.all([
        pool.query("SELECT COUNT(*) AS n FROM users WHERE role = 'USUARIO' AND is_active = 1"),
        // Deuda: precio menos pagos no anulados, en membresías no canceladas
        pool.query(
            `SELECT COALESCE(SUM(GREATEST(m.price - COALESCE(p.paid, 0), 0)), 0) AS total
       FROM memberships m
       LEFT JOIN (SELECT membership_id, SUM(amount) AS paid FROM payments
                  WHERE voided_at IS NULL GROUP BY membership_id) p ON p.membership_id = m.id
       WHERE m.status = 'ACTIVA'`,
        ),
        pool.query(
            `SELECT COALESCE(SUM(amount), 0) AS total FROM payments
       WHERE voided_at IS NULL AND DATE(paid_at) >= :monthFirst AND DATE(paid_at) <= :today`,
            { monthFirst, today },
        ),
        pool.query(
            'SELECT COUNT(*) AS n FROM attendances WHERE attendance_date = :today AND voided_at IS NULL',
            { today },
        ),
        pool.query(
            `SELECT DATE_FORMAT(paid_at, '%Y-%m') AS ym, SUM(amount) AS total FROM payments
       WHERE voided_at IS NULL AND DATE(paid_at) >= :since AND DATE(paid_at) <= :today
       GROUP BY ym`,
            { since: since6m, today },
        ),
        pool.query(
            `SELECT attendance_date AS d, COUNT(*) AS n FROM attendances
       WHERE voided_at IS NULL AND attendance_date BETWEEN :since AND :today
       GROUP BY attendance_date`,
            { since: since30, today },
        ),
        pool.query(
            `SELECT HOUR(checked_in_at) AS h, COUNT(*) AS n FROM attendances
       WHERE voided_at IS NULL AND attendance_date BETWEEN :since AND :today
       GROUP BY h`,
            { since: since30, today },
        ),
        // Membresías en curso por plan (una por socio: la actual)
        queryCurrent("WHERE t.status IN ('VIGENTE', 'POR_VENCER')", {}),
        Promise.all(
            ['VIGENTE', 'POR_VENCER', 'VENCIDA'].map((s) => countCurrent('WHERE t.status = :s', { s })),
        ),
        notifications.expirations({ status: 'POR_VENCER', page: 1, limit: 5 }),
    ])

    const revenueMap = new Map(revenueRows.map((r) => [r.ym, num(r.total)]))
    const dailyMap = new Map(dailyRows.map((r) => [String(r.d).slice(0, 10), num(r.n)]))
    const hourMap = new Map(hourRows.map((r) => [r.h, num(r.n)]))

    const byPlan = new Map()
    for (const m of planRows) byPlan.set(m.plan.name, (byPlan.get(m.plan.name) ?? 0) + 1)

    const [vigente, porVencer, vencida] = statusCounts

    return {
        cards: {
            activeMembers: members.n,
            activeMemberships: vigente + porVencer,
            expiring: porVencer,
            expired: vencida,
            debt: num(debt.total),
            collectedThisMonth: num(collected.total),
            checkInsToday: todayCount.n,
        },
        revenueByMonth: months.map((ym) => ({ month: ym, total: revenueMap.get(ym) ?? 0 })),
        attendanceByDay: days.map((d) => ({ date: d, count: dailyMap.get(d) ?? 0 })),
        attendanceByHour: Array.from({ length: 24 }, (_, h) => ({ hour: h, count: hourMap.get(h) ?? 0 })),
        membersByPlan: [...byPlan].map(([plan, count]) => ({ plan, count })).sort((a, b) => b.count - a.count),
        upcomingExpirations: upcoming.items,
    }
}

export async function trainer() {
    const today = todayAR()
    const [[members], [[withPlan]], [[templates]], [[todayCount]], [[week]]] = await Promise.all([
        pool.query("SELECT COUNT(*) AS n FROM users WHERE role = 'USUARIO' AND is_active = 1"),
        pool.query(
            `SELECT COUNT(DISTINCT p.member_id) AS n FROM training_plans p
       JOIN users u ON u.id = p.member_id
       WHERE p.is_active = 1 AND u.is_active = 1 AND u.role = 'USUARIO'`,
        ),
        pool.query('SELECT COUNT(*) AS n FROM training_plans WHERE member_id IS NULL'),
        pool.query(
            'SELECT COUNT(*) AS n FROM attendances WHERE attendance_date = :today AND voided_at IS NULL',
            { today },
        ),
        pool.query(
            `SELECT COUNT(*) AS n FROM attendances
       WHERE voided_at IS NULL AND attendance_date BETWEEN :start AND :end`,
            { start: weekStart(today), end: addDays(weekStart(today), 6) },
        ),
    ])
    const total = members[0].n
    return {
        cards: {
            activeMembers: total,
            withPlan: withPlan.n,
            withoutPlan: Math.max(total - withPlan.n, 0),
            templates: templates.n,
            checkInsToday: todayCount.n,
            checkInsThisWeek: week.n,
        },
    }
}

export async function member(userId) {
    const today = todayAR()
    const [current, [[plan]], [[week]]] = await Promise.all([
        currentForMembers([userId]),
        pool.query(
            'SELECT id, title FROM training_plans WHERE member_id = :userId AND is_active = 1',
            { userId },
        ),
        pool.query(
            `SELECT COUNT(*) AS n FROM attendances
       WHERE member_id = :userId AND voided_at IS NULL AND attendance_date BETWEEN :start AND :end`,
            { userId, start: weekStart(today), end: addDays(weekStart(today), 6) },
        ),
    ])
    const m = current.get(userId) ?? null
    return {
        membership: m && {
            planName: m.plan.name,
            status: m.status,
            endDate: m.endDate,
            balance: m.balance,
            paymentStatus: m.paymentStatus,
            daysPerWeek: m.plan.daysPerWeek,
        },
        weekCount: week.n,
        activePlan: plan ? { id: plan.id, name: plan.title } : null,
    }
}