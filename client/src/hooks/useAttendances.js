import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { attendancesService } from '@/services/attendances.service'

export function useLookup(search) {
    return useQuery({
        queryKey: ['attendances', 'lookup', search],
        queryFn: () => attendancesService.lookup(search),
        enabled: search.length >= 2,
    })
}

export function useAttendances(params, options = {}) {
    return useQuery({
        queryKey: ['attendances', 'list', params],
        queryFn: () => attendancesService.list(params),
        placeholderData: keepPreviousData,
        ...options,
    })
}

export function useMyAttendances(month) {
    return useQuery({
        queryKey: ['attendances', 'me', month],
        queryFn: () => attendancesService.mine(month),
        placeholderData: keepPreviousData,
    })
}

export function useAttendanceMutations() {
    const queryClient = useQueryClient()
    // onSettled: también refresca cuando falla (por ejemplo "ya ingresó hoy")
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['attendances'] })

    return {
        checkIn: useMutation({ mutationFn: attendancesService.checkIn, onSettled: refresh }),
        void: useMutation({
            mutationFn: ({ id, reason }) => attendancesService.void(id, reason),
            onSettled: refresh,
        }),
    }
}