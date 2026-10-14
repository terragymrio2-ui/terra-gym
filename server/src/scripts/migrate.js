import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'
import { env } from '../config/env.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = path.resolve(__dirname, '../../../database/migrations')

async function run() {
    // Conexión propia (no el pool) porque necesitamos multipleStatements
    // para ejecutar un archivo .sql con varias sentencias de una vez.
    const conn = await mysql.createConnection({
        host: env.DB_HOST,
        port: env.DB_PORT,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
        multipleStatements: true,
        ssl: env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
    })

    try {
        await conn.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(190) NOT NULL PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

        const [rows] = await conn.query('SELECT name FROM schema_migrations')
        const applied = new Set(rows.map((r) => r.name))

        const files = (await fs.readdir(MIGRATIONS_DIR))
            .filter((f) => f.endsWith('.sql'))
            .sort()

        let count = 0
        for (const file of files) {
            if (applied.has(file)) continue
            const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8')
            console.log(`Aplicando ${file}...`)
            await conn.query(sql)
            await conn.query('INSERT INTO schema_migrations (name) VALUES (?)', [file])
            count++
        }

        console.log(count ? `${count} migración(es) aplicada(s)` : 'Base al día, nada para aplicar')
    } finally {
        await conn.end()
    }
}

run().catch((err) => {
    console.error('Error en la migración:', err.message)
    process.exit(1)
})