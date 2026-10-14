import { z } from 'zod'
import { templateSchema, updateTemplateSchema } from './trainingTemplates.validator.js'

export const assignSchema = z.object({
    templateId: z.number().int().positive(),
    memberIds: z
        .array(z.number().int().positive())
        .min(1, 'Elegí al menos un socio')
        .max(100, 'Máximo 100 socios por vez'),
})

export const createPlanSchema = templateSchema.extend({ memberId: z.number().int().positive() })
export const updatePlanSchema = updateTemplateSchema
export const planStatusSchema = z.object({ isActive: z.boolean() })

export const overviewQuery = z.object({
    search: z.string().trim().max(100).optional(),
    hasPlan: z.enum(['with', 'without']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
})