import { z } from 'zod'

export const AUDIENCES = ['TODOS', 'VIGENTES', 'POR_VENCER', 'VENCIDOS', 'CON_DEUDA', 'SIN_CUOTA']

export const createAnnouncementSchema = z.object({
    title: z.string().trim().min(1, 'El título es obligatorio').max(100, 'Máximo 100 caracteres'),
    message: z.string().trim().min(1, 'El mensaje es obligatorio').max(1000, 'Máximo 1000 caracteres'),
    audience: z.enum(AUDIENCES, { message: 'Destinatarios inválidos' }),
})

export const announcementStatusSchema = z.object({ isActive: z.boolean() })

export const previewQuery = z.object({ audience: z.enum(AUDIENCES) })

export const listAnnouncementsQuery = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
})