import { z } from 'zod'

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (AAAA-MM-DD)')

export const lookupQuery = z.object({
    search: z.string().trim().min(2, 'Escribí al menos 2 letras').max(100),
})

export const checkInSchema = z.object({
    memberId: z.number().int().positive(),
    confirm: z.boolean().optional(),
})

export const voidAttendanceSchema = z.object({
    reason: z.string().trim().min(3, 'Indicá el motivo de la anulación').max(255),
})

export const listAttendancesQuery = z
    .object({
        from: dateString.optional(),
        to: dateString.optional(),
        memberId: z.coerce.number().int().positive().optional(),
        search: z.string().trim().max(100).optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
    })
    .refine((d) => !d.from || !d.to || d.from <= d.to, {
        message: '"Desde" no puede ser posterior a "Hasta"',
        path: ['from'],
    })

export const myAttendancesQuery = z.object({
    month: z
        .string()
        .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Mes inválido (AAAA-MM)')
        .optional(),
})