import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersService } from '@/services/users.service'

// keepPreviousData: al cambiar de página o filtro, la tabla no parpadea en blanco
export function useUsers(params) {
    return useQuery({
        queryKey: ['users', params],
        queryFn: () => usersService.list(params),
        placeholderData: keepPreviousData,
    })
}

export function useUserMutations() {
    const queryClient = useQueryClient()
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] })

    return {
        create: useMutation({ mutationFn: usersService.create, onSuccess: invalidate }),
        update: useMutation({
            mutationFn: ({ id, data }) => usersService.update(id, data),
            onSuccess: invalidate,
        }),
        setStatus: useMutation({
            mutationFn: ({ id, isActive }) => usersService.setStatus(id, isActive),
            onSuccess: invalidate,
        }),
        resetPassword: useMutation({ mutationFn: (id) => usersService.resetPassword(id) }),
    }
}