import mysql from 'mysql2/promise'
import { env } from './env.js'

export const pool = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    connectionLimit: 10,
    namedPlaceholders: true,
    dateStrings: true,    // DATE llega como 'YYYY-MM-DD' (evita bugs de zona horaria)
    decimalNumbers: true, // DECIMAL llega como número y no como string
    ssl: env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
})

export async function testConnection() {
    const conn = await pool.getConnection()
    await conn.ping()
    conn.release()
    console.log('MySQL conectado')
}