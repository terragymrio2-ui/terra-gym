import { pool } from '../config/db.js'
import { addDays, todayAR } from '../utils/dates.js'
import * as notifications from '../services/notifications.service.js'

const results = []
const check = (name, ok, extra = '') => {
    results.push(ok)
    console.log(`${ok ? 'OK    ' : 'FALLÓ '} ${name}${extra ? ' → ' + extra : ''}`)
}

async function run() {
    const today = todayAR()
    const [[admin]] = await pool.query("SELECT id FROM users WHERE role='ADMIN' LIMIT 1")
    const [[plan]] = await pool.query('SELECT id FROM membership_plans LIMIT 1')
    if (!plan) throw new Error('Creá al menos un plan de membresía antes de correr este test')

    const [u] = await pool.query(
        `INSERT INTO users (first_name,last_name,email,password_hash,role,must_change_password)
     VALUES ('Prueba','ZZNotif',?,'x','USUARIO',0)`,
        [`test.${Date.now()}@test.com`],
    )
    const userId = u.insertId

    const addMembership = async (start, end) => {
        const [r] = await pool.query(
            `INSERT INTO memberships (user_id,plan_id,start_date,end_date,price,created_by)
       VALUES (?,?,?,?,25000,?)`,
            [userId, plan.id, start, end, admin.id],
        )
        return r.insertId
    }
    const find = async (extra = {}) =>
        (await notifications.expirations({ search: 'ZZNotif', page: 1, limit: 20, ...extra })).items[0]

    try {
        // 1. Vence en 3 días: aparece como POR_VENCER_7
        const m1 = await addMembership(addDays(today, -27), addDays(today, 3))
        let item = await find()
        check('1. Vence en 3 días aparece como POR_VENCER_7',
            item?.status === 'POR_VENCER' && item.noticeType === 'POR_VENCER_7', item?.noticeType)

        // 2. Vence mañana: POR_VENCER_1
        await pool.query('UPDATE memberships SET end_date = ? WHERE id = ?', [addDays(today, 1), m1])
        item = await find()
        check('2. Vence mañana aparece como POR_VENCER_1', item?.noticeType === 'POR_VENCER_1', item?.noticeType)

        // 3. Registrar el aviso y filtrar por avisado / sin avisar
        check('3a. Antes de avisar figura sin avisar', item?.notifiedAt === null)
        const before = await find({ notified: 'no' })
        await notifications.logWhatsapp(m1)
        const afterYes = await find({ notified: 'yes' })
        const afterNo = await find({ notified: 'no' })
        check('3b. Tras avisar queda registrado y los filtros responden',
            !!before && !!afterYes?.notifiedAt && !afterNo)

        // 4. Si ya renovó, no aparece
        const m2 = await addMembership(addDays(today, 2), addDays(today, 31))
        check('4. Si ya renovó no aparece en la lista', !(await find()))
        await pool.query('DELETE FROM memberships WHERE id = ?', [m2])

        // 5. Vencida hace 5 días: VENCIDA
        await pool.query('UPDATE memberships SET end_date = ? WHERE id = ?', [addDays(today, -5), m1])
        item = await find()
        check('5. Vencida hace 5 días aparece como VENCIDA',
            item?.status === 'VENCIDA' && item.noticeType === 'VENCIDA', item?.noticeType)

        // 6. Vencida hace 90 días: fuera de la ventana de 60 días
        await pool.query('UPDATE memberships SET start_date = ?, end_date = ? WHERE id = ?',
            [addDays(today, -117), addDays(today, -90), m1])
        check('6. Vencida hace más de 60 días no aparece', !(await find()))

        // 7. Membresía vigente lejos del vencimiento: no se puede registrar aviso
        await pool.query('UPDATE memberships SET start_date = ?, end_date = ? WHERE id = ?',
            [addDays(today, -10), addDays(today, 20), m1])
        try {
            await notifications.logWhatsapp(m1)
            check('7. No registra aviso en una membresía lejos de vencer', false)
        } catch (e) {
            check('7. No registra aviso en una membresía lejos de vencer', e.code === 'NOT_EXPIRING', e.code)
        }
    } finally {
        await pool.query('DELETE FROM notification_log WHERE user_id = ?', [userId])
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