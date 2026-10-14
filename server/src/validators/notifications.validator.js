import { z } from 'zod'

export const expirationsQuery = z.object({
    status: z.enum(['POR_VENCER', 'VENCIDA']).optional(),
    notified: z.enum(['yes', 'no']).optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
})