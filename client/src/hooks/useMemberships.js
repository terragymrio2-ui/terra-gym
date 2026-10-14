import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { membershipsService } from '@/services/memberships.service'

export function useMemberships(params, options = {}) {
    return useQuery({
        queryKey: ['memberships', params],
        queryFn: () => membershipsService.list(params),
        placeholderData: keepPreviousData,
        ...options,
    })
}

export function useMembershipMutations() {
    const queryClient = useQueryClient()
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['memberships'] })

    return {
        create: useMutation({ mutationFn: membershipsService.create, onSuccess: invalidate }),
        cancel: useMutation({ mutationFn: membershipsService.cancel, onSuccess: invalidate }),
    }
}
export function useMyMemberships() {
    return useQuery({ queryKey: ['memberships', 'me'], queryFn: membershipsService.listMine })
}