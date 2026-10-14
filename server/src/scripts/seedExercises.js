import { pool } from '../config/db.js'
import { EXERCISES_BY_GROUP } from './data/exercisesCatalog.js'

async function run() {
    const [admins] = await pool.query("SELECT id FROM users WHERE role = 'ADMIN' ORDER BY id LIMIT 1")
    if (!admins[0]) throw new Error('Primero creá un ADMIN con: npm run seed')
    const adminId = admins[0].id

    const rows = Object.entries(EXERCISES_BY_GROUP).flatMap(([group, names]) =>
        names.map((name) => [name, group, adminId]),
    )

    // INSERT IGNORE: si un nombre ya existe (sin importar tildes ni mayúsculas) se omite,
    // así el script se puede correr varias veces sin duplicar nada ni pisar tus cambios.
    const [result] = await pool.query(
        `INSERT IGNORE INTO exercises (name, muscle_group, created_by)
     VALUES ${rows.map(() => '(?, ?, ?)').join(',')}`,
        rows.flat(),
    )
    console.log(`${result.affectedRows} ejercicio(s) cargado(s), ${rows.length - result.affectedRows} ya existían`)
}

run()
    .catch((err) => {
        console.error('Error cargando ejercicios:', err.message)
        process.exitCode = 1
    })
    .finally(() => pool.end())