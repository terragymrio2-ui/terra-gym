import bcrypt from 'bcrypt'
import { env } from '../config/env.js'
import { pool } from '../config/db.js'

async function run() {
    if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
        throw new Error('Definí ADMIN_EMAIL y ADMIN_PASSWORD en server/.env')
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = :email', {
        email: env.ADMIN_EMAIL,
    })
    if (existing.length) {
        console.log(`Ya existe un usuario con el email ${env.ADMIN_EMAIL}. No se hizo nada.`)
        return
    }

    const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12)

    await pool.query(
        `INSERT INTO users (first_name, last_name, email, password_hash, role, must_change_password)
     VALUES (:firstName, :lastName, :email, :passwordHash, 'ADMIN', 1)`,
        {
            firstName: env.ADMIN_FIRST_NAME,
            lastName: env.ADMIN_LAST_NAME,
            email: env.ADMIN_EMAIL,
            passwordHash,
        },
    )
    console.log(`ADMIN creado: ${env.ADMIN_EMAIL} (deberá cambiar la contraseña al ingresar)`)
}

run()
    .catch((err) => {
        console.error('Error en el seed:', err.message)
        process.exitCode = 1
    })
    .finally(() => pool.end())