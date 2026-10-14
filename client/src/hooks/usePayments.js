import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paymentsService } from '@/services/payments.service'

export function usePayments(params) {
    return useQuery({
        queryKey: ['payments', params],
        queryFn: () => paymentsService.list(params),
        placeholderData: keepPreviousData,
    })
}

export function usePaymentMutations() {
    const queryClient = useQueryClient()
    // Un pago cambia saldo y estado de la membresía: se refrescan las dos listas
    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['memberships'] })
        queryClient.invalidateQueries({ queryKey: ['payments'] })
    }

    return {
        register: useMutation({ mutationFn: paymentsService.register, onSuccess: invalidate }),
        void: useMutation({
            mutationFn: ({ id, reason }) => paymentsService.void(id, reason),
            onSuccess: invalidate,
        }),
    }
}