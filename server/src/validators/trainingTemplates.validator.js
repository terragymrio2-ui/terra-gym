import { z } from 'zod'

export const BLOCKS = [
    'ENTRADA_EN_CALOR', 'MOVILIDAD', 'PRINCIPAL', 'ACCESORIOS', 'CORE', 'CARDIO', 'ENFRIAMIENTO',
]

const emptyToNull = (v) => (typeof v === 'string' && v.trim() === '' ? null : v)
const optionalText = (max) =>
    z.preprocess(emptyToNull, z.string().trim().max(max).nullable().optional())

const exerciseItem = z.object({
    exerciseId: z.number().int().positive(),
    block: z.enum(BLOCKS, { message: 'Bloque inválido' }),
    sets: z.number().int().min(1, 'Mínimo 1 serie').max(20, 'Máximo 20 series'),
    reps: z.string().trim().min(1, 'Indicá las repeticiones').max(20),
    restSeconds: z.number().int().min(0).max(1800).nullable().optional(),
    intensity: optionalText(30),
    suggestedWeight: z
        .number()
        .min(0)
        .max(1000)
        .refine((v) => Math.round(v * 100) / 100 === v, 'Máximo 2 decimales')
        .nullable()
        .optional(),
    notes: optionalText(255),
})

const dayItem = z.object({
    name: z.string().trim().min(1, 'El día necesita un nombre').max(100),
    exercises: z.array(exerciseItem).max(30, 'Máximo 30 ejercicios por día'),
})

export const templateSchema = z.object({
    name: z.string().trim().min(1, 'El nombre es obligatorio').max(150),
    objective: optionalText(255),
    notes: optionalText(5000),
    days: z.array(dayItem).min(1, 'La plantilla necesita al menos un día').max(7, 'Máximo 7 días'),
})

// En cada guardado el cliente manda la revisión que cargó (detección de conflictos)
export const updateTemplateSchema = templateSchema.extend({
    expectedRevision: z.number().int().positive(),
})

export const listTemplatesQuery = z.object({
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
})