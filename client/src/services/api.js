import axios from 'axios'

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true, // necesario para la cookie httpOnly del JWT
})

// El AuthContext registra acá qué hacer cuando la sesión expira
let onUnauthorized = null
export const setUnauthorizedHandler = (fn) => {
    onUnauthorized = fn
}

// Rutas donde un 401 es una respuesta esperada (no es "sesión expirada")
const SILENT_401 = ['/auth/login', '/auth/me']

api.interceptors.response.use(
    (res) => res,
    (error) => {
        const status = error.response?.status
        const url = error.config?.url ?? ''
        if (status === 401 && !SILENT_401.some((p) => url.endsWith(p))) {
            onUnauthorized?.()
        }
        return Promise.reject(error)
    },
)

// Devuelve un mensaje legible para mostrar al usuario
export function getErrorMessage(error, fallback = 'Ocurrió un error. Intentá nuevamente.') {
    if (!error.response) return 'No se pudo conectar con el servidor.'
    return error.response.data?.error?.message ?? fallback
}