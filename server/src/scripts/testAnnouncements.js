import { pool } from '../config/db.js'
import { addDays, todayAR } from '../utils/dates.js'
import * as announcements from '../services/announcements.service.js'

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

    const stamp = Date.now()
    const makeUser = async (last) => {
        const [r] = await pool.query(
            `INSERT INTO users (first_name,last_name,email,password_hash,role,must_change_password)
       VALUES ('Prueba',?,?,'x','USUARIO',0)`,
            [last, `test.${last}.${stamp}@test.com`],
        )
        return r.insertId
    }
    const addMembership = async (userId, start, end) => {
        const [r] = await pool.query(
            `INSERT INTO memberships (user_id,plan_id,start_date,end_date,price,created_by)
       VALUES (?,?,?,?,25000,?)`,
            [userId, plan.id, start, end, admin.id],
        )
        return r.insertId
    }

    const A = await makeUser('ZZVigentePago')
    const B = await makeUser('ZZVencido')
    const C = await makeUser('ZZSinCuota')
    const D = await makeUser('ZZConDeuda')
    const created = []

    try {
        const mA = await addMembership(A, addDays(today, -5), addDays(today, 25))
        await pool.query(
            `INSERT INTO payments (membership_id,amount,method,paid_at,registered_by)
       VALUES (?,25000,'EFECTIVO',NOW(),?)`,
            [mA, admin.id],
        )
        await addMembership(B, addDays(today, -35), addDays(today, -5))
        await addMembership(D, addDays(today, -5), addDays(today, 25))

        // Envía un aviso a un segmento y devuelve quiénes de los 4 de prueba lo recibieron
        const send = async (audience) => {
            const { id } = await announcements.create({ title: 'Test', message: 'Test', audience }, admin.id)
            created.push(id)
            const [rows] = await pool.query(
                'SELECT user_id FROM announcement_recipients WHERE announcement_id = ? AND user_id IN (?)',
                [id, [A, B, C, D]],
            )
            return { id, got: new Set(rows.map((r) => r.user_id)) }
        }
        const same = (set, expected) => set.size === expected.length && expected.every((x) => set.has(x))

        const todos = await send('TODOS')
        check('1. TODOS llega a los 4', same(todos.got, [A, B, C, D]))

        check('2. VIGENTES llega a vigente pagado y con deuda',
            same((await send('VIGENTES')).got, [A, D]))

        check('3. VENCIDOS llega solo al vencido', same((await send('VENCIDOS')).got, [B]))

        check('4. SIN_CUOTA llega solo al que no tiene membresía', same((await send('SIN_CUOTA')).got, [C]))

        check('5. CON_DEUDA llega al vencido sin pagar y al vigente con deuda',
            same((await send('CON_DEUDA')).got, [B, D]))

        // 6. Vista previa coherente con el envío
        const prev = await announcements.preview('TODOS')
        const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM announcement_recipients WHERE announcement_id = ?', [todos.id])
        check('6. La vista previa coincide con los destinatarios reales', prev.count === n, `${prev.count} vs ${n}`)

        // 7. El socio ve el aviso pendiente, lo marca leído y desaparece
        let pending = await announcements.pendingFor(A)
        check('7a. El socio ve el aviso pendiente', pending.some((p) => p.id === todos.id))
        await announcements.markRead(todos.id, A)
        await announcements.markRead(todos.id, A) // repetir no debe fallar
        pending = await announcements.pendingFor(A)
        check('7b. Al marcarlo leído deja de aparecer (y repetir no falla)', !pending.some((p) => p.id === todos.id))

        // 8. Un aviso archivado no se muestra a quien no lo leyó
        await announcements.setStatus(todos.id, false)
        pending = await announcements.pendingFor(B)
        check('8. Un aviso archivado no se muestra', !pending.some((p) => p.id === todos.id))

        // 9. Un socio no puede marcar un aviso que no era suyo
        const only = await send('SIN_CUOTA')
        try {
            await announcements.markRead(only.id, A)
            check('9. No se puede leer un aviso ajeno', false)
        } catch (e) {
            check('9. No se puede leer un aviso ajeno', e.code === 'NOT_FOUND', e.code)
        }

        // 10. Contador de leídos en el listado
        const { items } = await announcements.list({ page: 1, limit: 50 })
        const row = items.find((i) => i.id === todos.id)
        check('10. El listado cuenta 1 leído', row?.readCount === 1, `readCount=${row?.readCount}`)
    } finally {
        if (created.length) await pool.query('DELETE FROM announcements WHERE id IN (?)', [created])
        await pool.query('DELETE FROM payments WHERE membership_id IN (SELECT id FROM memberships WHERE user_id IN (?))', [[A, B, C, D]])
        await pool.query('DELETE FROM memberships WHERE user_id IN (?)', [[A, B, C, D]])
        await pool.query('DELETE FROM users WHERE id IN (?)', [[A, B, C, D]])
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