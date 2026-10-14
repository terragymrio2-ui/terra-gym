import { z } from 'zod'

export const MUSCLE_GROUPS = [
    'PECHO', 'ESPALDA', 'HOMBROS', 'BICEPS', 'TRICEPS',
    'PIERNAS', 'GLUTEOS', 'CORE', 'CARDIO', 'CUERPO_COMPLETO',
]

const emptyToNull = (v) => (typeof v === 'string' && v.trim() === '' ? null : v)

const ALLOWED_VIDEO_HOSTS = [
    'youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be',
    'vimeo.com', 'www.vimeo.com', 'player.vimeo.com',
]

const videoUrl = z
    .string()
    .trim()
    .max(255)
    .refine((value) => {
        try {
            const url = new URL(value)
            return url.protocol === 'https:' && ALLOWED_VIDEO_HOSTS.includes(url.hostname)
        } catch {
            return false
        }
    }, 'Tiene que ser un link https de YouTube o Vimeo')

export const exerciseSchema = z.object({
    name: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
    muscleGroup: z.enum(MUSCLE_GROUPS, { message: 'Grupo muscular inválido' }),
    description: z.preprocess(emptyToNull, z.string().trim().max(500).nullable().optional()),
    videoUrl: z.preprocess(emptyToNull, videoUrl.nullable().optional()),
})

export const updateExerciseSchema = exerciseSchema.partial()

export const exerciseStatusSchema = z.object({ isActive: z.boolean() })

export const listExercisesQuery = z.object({
    search: z.string().trim().max(100).optional(),
    muscleGroup: z.enum(MUSCLE_GROUPS).optional(),
    isActive: z
        .enum(['true', 'false'])
        .optional()
        .transform((v) => (v === undefined ? undefined : v === 'true')),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
})