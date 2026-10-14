import { z } from 'zod'

export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email('Email inválido'),
    password: z.string().min(1, 'La contraseña es obligatoria'),
    remember: z.boolean().optional().default(false),
})
export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Ingresá tu contraseña actual'),
        newPassword: z
            .string()
            .min(4, 'La nueva contraseña debe tener al menos 4 caracteres')
            .max(72, 'La contraseña no puede superar los 72 caracteres'), // límite real de bcrypt
    })
    .refine((d) => d.currentPassword !== d.newPassword, {
        message: 'La nueva contraseña debe ser distinta a la actual',
        path: ['newPassword'],
    })