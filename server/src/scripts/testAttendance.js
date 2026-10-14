import { pool } from '../config/db.js'
import { todayAR, addDays } from '../utils/dates.js'
import * as attendances from '../services/attendances.service.js'

const results = []
const check = (name, ok, extra = '') => {
    results.push(ok)
    console.log(`${ok ? 'OK    ' : 'FALLÓ '} ${name}${extra ? ' → ' + extra : ''}`)
}

async function run() {
    const [[admin]] = await pool.query("SELECT id FROM users WHERE role='ADMIN' LIMIT 1")
    const today = todayAR()

    // Socio de prueba SIN membresía (se borra al final)
    const email = `test.${Date.now()}@test.com`
    const [u] = await pool.query(
        `INSERT INTO users (first_name,last_name,email,password_hash,role,must_change_password)
     VALUES ('Prueba','Asistencia',?,'x','USUARIO',0)`, [email])
    const memberId = u.insertId

    try {
        // 1. Sin membresía: pide confirmación
        try {
            await attendances.checkIn({ memberId }, admin.id)
            check('1. Sin membresía pide confirmar', false, 'no pidió confirmación')
        } catch (e) {
            check('1. Sin membresía pide confirmar', e.code === 'CONFIRMATION_REQUIRED', e.code)
        }

        // 2. Con confirmación: se registra como excepción
        const r = await attendances.checkIn({ memberId, confirm: true }, admin.id)
        check('2. Con confirmación se registra como excepción', r.override === true)

        // 3. Segundo ingreso el mismo día: rechazado
        try {
            await attendances.checkIn({ memberId, confirm: true }, admin.id)
            check('3. No permite dos ingresos el mismo día', false)
        } catch (e) {
            check('3. No permite dos ingresos el mismo día', e.code === 'ALREADY_CHECKED_IN', e.code)
        }

        // 4. Aparece en el historial de hoy con su motivo
        const list = await attendances.list({ from: today, to: today, memberId, page: 1, limit: 10 })
        const item = list.items[0]
        check('4. Historial muestra la excepción', item?.override && item.overrideReasons.includes('NO_MEMBERSHIP'),
            item?.overrideReasons.join(','))

        // 5. Anular y volver a registrar
        await attendances.voidAttendance(item.id, 'Prueba automática', admin.id)
        const again = await attendances.checkIn({ memberId, confirm: true }, admin.id)
        check('5. Tras anular se puede registrar de nuevo', !!again.id)

        // 6. Cupo semanal: membresía de 2 días + 2 ingresos previos esta semana
        const [[plan]] = await pool.query("SELECT id FROM membership_plans WHERE days_per_week = 2 LIMIT 1")
        if (!plan) {
            check('6. Cupo semanal', false, 'no hay un plan de 2 días')
        } else {
            await pool.query('DELETE FROM attendances WHERE member_id = ?', [memberId])
            await pool.query(
                `INSERT INTO memberships (user_id,plan_id,start_date,end_date,price,created_by)
         VALUES (?,?,?,?,25000,?)`, [memberId, plan.id, addDays(today, -3), addDays(today, 27), admin.id])
            // Dos ingresos en días anteriores de la misma semana (si hoy es lunes, no hay días previos)
            const [[{ dow }]] = await pool.query('SELECT WEEKDAY(?) AS dow', [today])
            if (dow < 2) {
                check('6. Cupo semanal', true, 'omitida: hoy es lunes o martes, faltan días previos en la semana')
            } else {
                await pool.query(
                    `INSERT INTO attendances (member_id,attendance_date,checked_in_at,registered_by)
           VALUES (?,?,?,?),(?,?,?,?)`,
                    [memberId, addDays(today, -1), `${addDays(today, -1)} 10:00:00`, admin.id,
                        memberId, addDays(today, -2), `${addDays(today, -2)} 10:00:00`, admin.id])
                try {
                    await attendances.checkIn({ memberId }, admin.id)
                    check('6. Cupo semanal superado pide confirmar', false)
                } catch (e) {
                    check('6. Cupo semanal superado pide confirmar', e.code === 'CONFIRMATION_REQUIRED',
                        (e.details?.warnings ?? []).map((w) => w.code).join(','))
                }
            }
        }
    } finally {
        // Limpieza: no deja datos de prueba
        await pool.query('DELETE FROM attendances WHERE member_id = ?', [memberId])
        await pool.query('DELETE FROM memberships WHERE user_id = ?', [memberId])
        await pool.query('DELETE FROM users WHERE id = ?', [memberId])
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