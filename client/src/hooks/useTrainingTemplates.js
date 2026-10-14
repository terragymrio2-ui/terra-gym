import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { trainingTemplatesService } from '@/services/trainingTemplates.service'

export function useTemplates(params) {
    return useQuery({
        queryKey: ['training-templates', 'list', params],
        queryFn: () => trainingTemplatesService.list(params),
        placeholderData: keepPreviousData,
    })
}

// gcTime: 0 → al abrir el editor siempre se carga la versión actual, nunca una guardada en caché
export function useTemplate(id) {
    return useQuery({
        queryKey: ['training-templates', 'detail', id],
        queryFn: () => trainingTemplatesService.get(id),
        enabled: !!id,
        gcTime: 0,
    })
}

export function useTemplateMutations() {
    const queryClient = useQueryClient()
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['training-templates'] })

    return {
        create: useMutation({ mutationFn: trainingTemplatesService.create, onSuccess: invalidate }),
        update: useMutation({
            mutationFn: ({ id, data }) => trainingTemplatesService.update(id, data),
            onSuccess: invalidate,
        }),
        duplicate: useMutation({ mutationFn: trainingTemplatesService.duplicate, onSuccess: invalidate }),
        remove: useMutation({ mutationFn: trainingTemplatesService.remove, onSuccess: invalidate }),
    }
}