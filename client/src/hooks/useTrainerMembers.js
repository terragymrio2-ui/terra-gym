import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { trainersService } from '@/services/trainers.service'

export function useTrainerMembers(trainerId) {
    return useQuery({
        queryKey: ['trainer-members', trainerId],
        queryFn: () => trainersService.listMembers(trainerId),
        enabled: !!trainerId,
    })
}

export function useTrainerMemberMutations(trainerId) {
    const queryClient = useQueryClient()
    const key = ['trainer-members', trainerId]

    return {
        // El backend devuelve la lista actualizada: se guarda directo en caché
        add: useMutation({
            mutationFn: (memberIds) => trainersService.addMembers(trainerId, memberIds),
            onSuccess: (list) => queryClient.setQueryData(key, list),
        }),
        remove: useMutation({
            mutationFn: (memberId) => trainersService.removeMember(trainerId, memberId),
            onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
        }),
    }
}