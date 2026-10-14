import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)
const KEY = 'terragym-theme' // 'light' | 'dark' | 'system'

const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches

function read() {
    try {
        return localStorage.getItem(KEY) || 'dark'
    } catch {
        return 'dark'
    }
}

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(read)

    useEffect(() => {
        const apply = () => {
            const dark = theme === 'dark' || (theme === 'system' && prefersDark())
            document.documentElement.classList.toggle('dark', dark)
        }
        apply()
        if (theme !== 'system') return
        // En automático, sigue los cambios del sistema en vivo
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        mq.addEventListener('change', apply)
        return () => mq.removeEventListener('change', apply)
    }, [theme])

    const value = useMemo(
        () => ({
            theme,
            setTheme: (t) => {
                try {
                    localStorage.setItem(KEY, t)
                } catch {
                    /* sin almacenamiento: el tema vale solo para esta visita */
                }
                setThemeState(t)
            },
        }),
        [theme],
    )

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>')
    return ctx
}