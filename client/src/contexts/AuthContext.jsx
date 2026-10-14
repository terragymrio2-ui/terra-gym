import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { setUnauthorizedHandler } from '@/services/api'
import { authService } from '@/services/auth.service'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const queryClient = useQueryClient()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true) // true mientras se consulta /me al abrir la app

    // Al abrir la app: ¿hay una sesión válida?
    useEffect(() => {
        authService
            .me()
            .then(setUser)
            .catch(() => setUser(null))
            .finally(() => setLoading(false))
    }, [])

    const clearSession = useCallback(() => {
        setUser(null)
        queryClient.clear() // no dejar datos del usuario anterior en caché
    }, [queryClient])

    // Si cualquier request devuelve 401, se cierra la sesión local
    useEffect(() => {
        setUnauthorizedHandler(clearSession)
        return () => setUnauthorizedHandler(null)
    }, [clearSession])

    const login = useCallback(async (credentials) => {
        const loggedUser = await authService.login(credentials)
        setUser(loggedUser)
        return loggedUser
    }, [])

    const logout = useCallback(async () => {
        try {
            await authService.logout()
        } finally {
            clearSession()
        }
    }, [clearSession])

    const markPasswordChanged = useCallback(() => {
        setUser((u) => (u ? { ...u, mustChangePassword: false } : u))
    }, [])

    const value = useMemo(
        () => ({ user, loading, login, logout, markPasswordChanged }),
        [user, loading, login, logout, markPasswordChanged],
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}