import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { HOME_BY_ROLE } from '@/utils/roles'

// Exige que el rol del usuario esté en la lista. Si no, lo manda a su propio inicio.
export default function RoleRoute({ roles }) {
    const { user } = useAuth()
    if (!roles.includes(user.role)) {
        return <Navigate to={HOME_BY_ROLE[user.role]} replace />
    }
    return <Outlet />
}