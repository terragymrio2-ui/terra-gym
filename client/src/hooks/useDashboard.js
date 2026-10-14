import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/services/dashboard.service'

// Se refresca al volver a la pantalla, así los números no quedan viejos
const options = { staleTime: 30_000, refetchOnMount: 'always' }

export const useAdminDashboard = () =>
    useQuery({ queryKey: ['dashboard', 'admin'], queryFn: dashboardService.admin, ...options })
export const useTrainerDashboard = () =>
    useQuery({ queryKey: ['dashboard', 'trainer'], queryFn: dashboardService.trainer, ...options })
export const useMemberDashboard = () =>
    useQuery({ queryKey: ['dashboard', 'member'], queryFn: dashboardService.member, ...options })