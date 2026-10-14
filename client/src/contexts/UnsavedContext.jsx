import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const UnsavedContext = createContext(null)

export function UnsavedProvider({ children }) {
    const [dirty, setDirty] = useState(false)
    const markDirty = useCallback((value) => setDirty(Boolean(value)), [])
    const value = useMemo(() => ({ dirty, markDirty }), [dirty, markDirty])
    return <UnsavedContext.Provider value={value}>{children}</UnsavedContext.Provider>
}

export function useUnsaved() {
    const ctx = useContext(UnsavedContext)
    if (!ctx) throw new Error('useUnsaved debe usarse dentro de <UnsavedProvider>')
    return ctx
}