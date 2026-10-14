import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationsService } from '@/services/notifications.service'

export function useExpirations(params) {
    return useQuery({
        queryKey: ['notifications', 'expirations', params],
        queryFn: () => notificationsService.expirations(params),
        placeholderData: keepPreviousData,
    })
}

export function useLogWhatsapp() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: notificationsService.logWhatsapp,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    })
}