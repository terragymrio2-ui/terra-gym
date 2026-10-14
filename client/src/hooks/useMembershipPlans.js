import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { membershipPlansService } from '@/services/membershipPlans.service'

export function useMembershipPlans() {
    return useQuery({ queryKey: ['membership-plans'], queryFn: membershipPlansService.list })
}

export function usePlanMutations() {
    const queryClient = useQueryClient()
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['membership-plans'] })

    return {
        create: useMutation({ mutationFn: membershipPlansService.create, onSuccess: invalidate }),
        update: useMutation({
            mutationFn: ({ id, data }) => membershipPlansService.update(id, data),
            onSuccess: invalidate,
        }),
        setStatus: useMutation({
            mutationFn: ({ id, isActive }) => membershipPlansService.setStatus(id, isActive),
            onSuccess: invalidate,
        }),
    }
}