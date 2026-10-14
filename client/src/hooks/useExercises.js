import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { exercisesService } from '@/services/exercises.service'

export function useExercises(params) {
    return useQuery({
        queryKey: ['exercises', params],
        queryFn: () => exercisesService.list(params),
        placeholderData: keepPreviousData,
    })
}

export function useExerciseMutations() {
    const queryClient = useQueryClient()
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['exercises'] })

    return {
        create: useMutation({ mutationFn: exercisesService.create, onSuccess: invalidate }),
        update: useMutation({
            mutationFn: ({ id, data }) => exercisesService.update(id, data),
            onSuccess: invalidate,
        }),
        setStatus: useMutation({
            mutationFn: ({ id, isActive }) => exercisesService.setStatus(id, isActive),
            onSuccess: invalidate,
        }),
        remove: useMutation({ mutationFn: exercisesService.remove, onSuccess: invalidate }),
    }
}