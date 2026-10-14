import app from './app.js'
import { env } from './config/env.js'
import { testConnection } from './config/db.js'

async function start() {
    await testConnection()
    app.listen(env.PORT, () => {
        console.log(`API escuchando en http://localhost:${env.PORT}`)
    })
}

start().catch((err) => {
    console.error('No se pudo iniciar el servidor:', err.message)
    process.exit(1)
})