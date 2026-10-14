import { z } from 'zod'

// "" se trata como "sin dato" (null), porque los formularios mandan strings vacíos
const emptyToNull = (v) => (typeof v === 'string' && v.trim() === '' ? null : v)

const optionalField = (schema) => z.preprocess(emptyToNull, schema.nullable().optional())

const dateString = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (formato AAAA-MM-DD)')
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Fecha inválida')

export const createUserSchema = z.object({
    firstName: z.string().trim().min(1, 'El nombre es obligatorio').max(80),
    lastName: z.string().trim().min(1, 'El apellido es obligatorio').max(80),
    email: z.string().trim().toLowerCase().email('Email inválido').max(190),
    role: z.enum(['ADMIN', 'PROFESOR', 'USUARIO'], { message: 'Rol inválido' }),
    phone: optionalField(
        z.string().trim().regex(/^\+?[\d\s-]{8,20}$/, 'Teléfono inválido'),
    ),
    dni: optionalField(z.string().trim().regex(/^\d{7,9}$/, 'El DNI debe tener entre 7 y 9 dígitos')),
    birthDate: optionalField(dateString),
    notifyEmail: z.boolean().optional(),
})

// El rol no se edita; todos los campos son opcionales (PATCH)
export const updateUserSchema = createUserSchema.omit({ role: true }).partial()

export const statusSchema = z.object({ isActive: z.boolean() })

export const listUsersQuery = z.object({
    role: z.enum(['ADMIN', 'PROFESOR', 'USUARIO']).optional(),
    search: z.string().trim().max(100).optional(),
    isActive: z
        .enum(['true', 'false'])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === 'true')),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const assignMembersSchema = z.object({
    memberIds: z.array(z.number().int().positive()).min(1, 'Elegí al menos un socio').max(200),
})