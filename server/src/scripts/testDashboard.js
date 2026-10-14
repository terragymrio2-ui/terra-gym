import { pool } from '../config/db.js'
import { addDays, todayAR } from '../utils/dates.js'
import * as dashboard from '../services/dashboard.service.js'

const results = []
const check = (name, ok, extra = '') => {
    results.push(ok)
    console.log(`${ok ? 'OK    ' : 'FALLÓ '} ${name}${extra ? ' → ' + extra : ''}`)
}

async function run() {
    const today = todayAR()
    const [[adminUser]] = await pool.query("SELECT id FROM users WHERE role='ADMIN' LIMIT 1")
    const [[plan]] = await pool.query('SELECT id FROM membership_plans LIMIT 1')
    if (!plan) throw new Error('Creá al menos un plan de membresía antes de correr este test')

    const before = await dashboard.admin()
    const stamp = Date.now()
    const [u] = await pool.query(
        `INSERT INTO users (first_name,last_name,email,password_hash,role,must_change_password)
     VALUES ('Prueba','ZZDash',?,'x','USUARIO',0)`,
        [`test.dash.${stamp}@test.com`],
    )
    const userId = u.insertId
    const hour = 14

    try {
        // Membresía vigente de 50.000, pagos: 30.000 válido + 5.000 anulado
        const [m] = await pool.query(
            `INSERT INTO memberships (user_id,plan_id,start_date,end_date,price,created_by)
       VALUES (?,?,?,?,50000,?)`,
            [userId, plan.id, addDays(today, -5), addDays(today, 25), adminUser.id],
        )
        await pool.query(
            `INSERT INTO payments (membership_id,amount,method,paid_at,registered_by)
       VALUES (?,30000,'EFECTIVO',?,?)`,
            [m.insertId, `${today} 10:00:00`, adminUser.id],
        )
        await pool.query(
            `INSERT INTO payments (membership_id,amount,method,paid_at,voided_at,void_reason,registered_by)
       VALUES (?,5000,'EFECTIVO',?,?, 'test', ?)`,
            [m.insertId, `${today} 11:00:00`, `${today} 12:00:00`, adminUser.id],
        )
        // Ingreso de hoy a las 14 y otro anulado
        await pool.query(
            `INSERT INTO attendances (member_id,attendance_date,checked_in_at,registered_by)
       VALUES (?,?,?,?)`,
            [userId, today, `${today} ${hour}:15:00`, adminUser.id],
        )

        const after = await dashboard.admin()
        const diff = (key) => after.cards[key] - before.cards[key]

        check('1. Socios activos suma 1', diff('activeMembers') === 1, `+${diff('activeMembers')}`)
        check('2. Membresías vigentes suma 1', diff('activeMemberships') === 1, `+${diff('activeMemberships')}`)
        check('3. Deuda suma 20.000 (50.000 - 30.000, el anulado no cuenta)',
            diff('debt') === 20000, `+${diff('debt')}`)
        check('4. Cobrado del mes suma 30.000 (sin el anulado)',
            diff('collectedThisMonth') === 30000, `+${diff('collectedThisMonth')}`)
        check('5. Ingresos de hoy suma 1', diff('checkInsToday') === 1, `+${diff('checkInsToday')}`)

        const lastMonth = after.revenueByMonth.at(-1)
        const lastMonthBefore = before.revenueByMonth.at(-1)
        check('6. El gráfico mensual tiene 6 meses y el último suma 30.000',
            after.revenueByMonth.length === 6 && lastMonth.total - lastMonthBefore.total === 30000)

        const dayNow = after.attendanceByDay.at(-1)
        const dayBefore = before.attendanceByDay.at(-1)
        check('7. El gráfico diario tiene 30 días y hoy suma 1',
            after.attendanceByDay.length === 30 && dayNow.date === today && dayNow.count - dayBefore.count === 1)

        check('8. La hora pico tiene 24 horas y las 14 suma 1',
            after.attendanceByHour.length === 24 &&
            after.attendanceByHour[hour].count - before.attendanceByHour[hour].count === 1)

        const planName = (await pool.query('SELECT name FROM membership_plans WHERE id = ?', [plan.id]))[0][0].name
        const planNow = after.membersByPlan.find((p) => p.plan === planName)?.count ?? 0
        const planBefore = before.membersByPlan.find((p) => p.plan === planName)?.count ?? 0
        check('9. Socios por plan suma 1 en su plan', planNow - planBefore === 1)

        // 10. Si se cancela la membresía, deja de contar como vigente y como deuda
        await pool.query("UPDATE memberships SET status='CANCELADA' WHERE id = ?", [m.insertId])
        const cancelled = await dashboard.admin()
        check('10. Cancelada: deja de contar como vigente y deuda',
            cancelled.cards.activeMemberships === before.cards.activeMemberships &&
            cancelled.cards.debt === before.cards.debt)

        // 11. Dashboard del socio
        await pool.query("UPDATE memberships SET status='ACTIVA' WHERE id = ?", [m.insertId])
        const mine = await dashboard.member(userId)
        check('11. Dashboard del socio: plan, saldo y asistencia de la semana',
            mine.membership?.balance === 20000 && mine.weekCount === 1 && mine.activePlan === null,
            `saldo=${mine.membership?.balance} semana=${mine.weekCount}`)

        // 12. Dashboard del profesor: devuelve números coherentes
        const t = await dashboard.trainer()
        check('12. Dashboard del profesor: sin rutina = activos - con rutina',
            t.cards.withoutPlan === Math.max(t.cards.activeMembers - t.cards.withPlan, 0))
    } finally {
        await pool.query('DELETE FROM attendances WHERE member_id = ?', [userId])
        await pool.query('DELETE FROM payments WHERE membership_id IN (SELECT id FROM memberships WHERE user_id = ?)', [userId])
        await pool.query('DELETE FROM memberships WHERE user_id = ?', [userId])
        await pool.query('DELETE FROM users WHERE id = ?', [userId])
    }

    const failed = results.filter((ok) => !ok).length
    console.log(failed === 0 ? '\nTodo OK' : `\n${failed} prueba(s) fallaron`)
}

run()
    .catch((err) => {
        console.error('Error en el test:', err.message)
        process.exitCode = 1
    })
    .finally(() => pool.end())