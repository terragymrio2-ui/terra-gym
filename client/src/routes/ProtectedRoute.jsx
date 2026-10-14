import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'

// Exige sesión. Si debe cambiar la contraseña, lo manda a esa pantalla.
export default function ProtectedRoute() {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="min-h-screen grid place-items-center" role="status" aria-label="Cargando">
                <Skeleton className="h-10 w-48" />
            </div>
        )
    }

    if (!user) return <Navigate to="/login" replace state={{ from: location }} />

    if (user.mustChangePassword && location.pathname !== '/cambiar-password') {
        return <Navigate to="/cambiar-password" replace />
    }

    return <Outlet />
}