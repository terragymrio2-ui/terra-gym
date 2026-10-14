import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { trainingPlansService } from '@/services/trainingPlans.service'

export function useOverview(params) {
    return useQuery({
        queryKey: ['training-plans', 'overview', params],
        queryFn: () => trainingPlansService.overview(params),
        placeholderData: keepPreviousData,
    })
}

export function useMemberPlans(memberId) {
    return useQuery({
        queryKey: ['training-plans', 'member', memberId],
        queryFn: () => trainingPlansService.listForMember(memberId),
        enabled: !!memberId,
    })
}

// gcTime: 0 → el editor siempre carga la versión actual
export function usePlan(id) {
    return useQuery({
        queryKey: ['training-plans', 'detail', id],
        queryFn: () => trainingPlansService.get(id),
        enabled: !!id,
        gcTime: 0,
    })
}

export function useMyPlan() {
    return useQuery({ queryKey: ['training-plans', 'me'], queryFn: trainingPlansService.mine })
}

export function usePlanMutations() {
    const queryClient = useQueryClient()
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['training-plans'] })

    return {
        assign: useMutation({ mutationFn: trainingPlansService.assign, onSuccess: invalidate }),
        create: useMutation({ mutationFn: trainingPlansService.create, onSuccess: invalidate }),
        update: useMutation({
            mutationFn: ({ id, data }) => trainingPlansService.update(id, data),
            onSuccess: invalidate,
        }),
        setStatus: useMutation({
            mutationFn: ({ id, isActive }) => trainingPlansService.setStatus(id, isActive),
            onSuccess: invalidate,
        }),
    }
}