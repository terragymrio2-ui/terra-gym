import { z } from 'zod'

const emptyToNull = (v) => (typeof v === 'string' && v.trim() === '' ? null : v)
const optionalText = (max) => z.preprocess(emptyToNull, z.string().trim().max(max).nullable().optional())

const twoDecimals = (v) => Math.round(v * 100) / 100 === v
const MAX_AMOUNT = 10_000_000

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (AAAA-MM-DD)')

export const PAYMENT_METHODS = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'MERCADO_PAGO', 'OTRO']

// ---- Planes ----
export const planSchema = z.object({
    name: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
    description: optionalText(255),
    price: z
        .number({ message: 'Ingresá un precio válido' })
        .min(0, 'El precio no puede ser negativo')
        .max(MAX_AMOUNT)
        .refine(twoDecimals, 'Máximo 2 decimales'),
    durationMonths: z.number().int().min(1, 'Mínimo 1 mes').max(24, 'Máximo 24 meses'),
    daysPerWeek: z.number().int().min(1, 'Mínimo 1 día').max(7, 'Máximo 7 días'),
})
export const updatePlanSchema = planSchema.partial()
export const planStatusSchema = z.object({ isActive: z.boolean() })

// ---- Pagos ----
const paymentFields = {
    amount: z
        .number({ message: 'Ingresá un monto válido' })
        .positive('El monto debe ser mayor a 0')
        .max(MAX_AMOUNT)
        .refine(twoDecimals, 'Máximo 2 decimales'),
    method: z.enum(PAYMENT_METHODS, { message: 'Medio de pago inválido' }),
    reference: optionalText(100),
    notes: optionalText(255),
}

export const registerPaymentSchema = z.object({
    membershipId: z.number().int().positive(),
    ...paymentFields,
})

export const voidPaymentSchema = z.object({
    reason: z.string().trim().min(3, 'Indicá el motivo de la anulación').max(255),
})

export const listPaymentsQuery = z.object({
    from: dateString.optional(),
    to: dateString.optional(),
    method: z.enum(PAYMENT_METHODS).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
})

// ---- Membresías ----
export const createMembershipSchema = z.object({
    userId: z.number().int().positive(),
    planId: z.number().int().positive(),
    payment: z.object(paymentFields).optional(), // pago inicial opcional (puede ser parcial)
    confirmRenewal: z.boolean().optional(), // confirma crear otra aunque ya haya una programada
})
export const listMembershipsQuery = z.object({
    current: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
    status: z.enum(['PROGRAMADA', 'VIGENTE', 'POR_VENCER', 'VENCIDA', 'CANCELADA']).optional(),
    paymentStatus: z.enum(['PENDIENTE', 'PARCIAL', 'PAGADA']).optional(),
    userId: z.coerce.number().int().positive().optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
})