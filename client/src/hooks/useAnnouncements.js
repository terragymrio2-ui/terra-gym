import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { announcementsService } from '@/services/announcements.service'

export function useAudienceCount(audience) {
    return useQuery({
        queryKey: ['announcements', 'preview', audience],
        queryFn: () => announcementsService.preview(audience),
        enabled: !!audience,
    })
}

export function useAnnouncements(params) {
    return useQuery({
        queryKey: ['announcements', 'list', params],
        queryFn: () => announcementsService.list(params),
        placeholderData: keepPreviousData,
    })
}

export function usePendingAnnouncements() {
    return useQuery({ queryKey: ['announcements', 'pending'], queryFn: announcementsService.pending })
}

export function useAnnouncementMutations() {
    const queryClient = useQueryClient()
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['announcements'] })

    return {
        create: useMutation({ mutationFn: announcementsService.create, onSuccess: invalidate }),
        setStatus: useMutation({
            mutationFn: ({ id, isActive }) => announcementsService.setStatus(id, isActive),
            onSuccess: invalidate,
        }),
        markRead: useMutation({ mutationFn: announcementsService.markRead, onSuccess: invalidate }),
    }
}