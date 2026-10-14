import { z } from 'zod'
import { BLOCKS } from '@/utils/exercises'

const requiredInt = (min, max) =>
    z
        .string()
        .trim()
        .regex(/^\d+$/, 'Ingresá un número entero')
        .refine((v) => Number(v) >= min && Number(v) <= max, `Entre ${min} y ${max}`)

const exerciseSchema = z.object({
    exerciseId: z.number(),
    exerciseName: z.string(),
    muscleGroup: z.string().optional(),
    block: z.enum(Object.keys(BLOCKS)),
    sets: requiredInt(1, 20),
    reps: z.string().trim().min(1, 'Indicá las repeticiones').max(20, 'Máximo 20 caracteres'),
    restSeconds: z
        .string()
        .trim()
        .refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) <= 1800), 'Entre 0 y 1800 segundos'),
    intensity: z.string().trim().max(30, 'Máximo 30 caracteres'),
    suggestedWeight: z
        .string()
        .trim()
        .refine(
            (v) => v === '' || (/^\d+([.,]\d{1,2})?$/.test(v) && Number(v.replace(',', '.')) <= 1000),
            'Peso inválido (máximo 1000 kg)',
        ),
    notes: z.string().trim().max(255, 'Máximo 255 caracteres'),
})

export const templateFormSchema = z.object({
    name: z.string().trim().min(1, 'Ingresá el nombre').max(150, 'Máximo 150 caracteres'),
    objective: z.string().trim().max(255, 'Máximo 255 caracteres'),
    notes: z.string().trim().max(5000, 'Máximo 5000 caracteres'),
    days: z
        .array(
            z.object({
                name: z.string().trim().min(1, 'El día necesita un nombre').max(100, 'Máximo 100 caracteres'),
                exercises: z.array(exerciseSchema).max(30, 'Máximo 30 ejercicios por día'),
            }),
        )
        .min(1)
        .max(7),
})

export const emptyDay = (name) => ({ name, exercises: [] })

export function newExerciseRow(exercise) {
    return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        muscleGroup: exercise.muscleGroup,
        block: 'PRINCIPAL',
        sets: '3',
        reps: '10',
        restSeconds: '60',
        intensity: '',
        suggestedWeight: '',
        notes: '',
    }
}

export function toFormValues(template) {
    if (!template) return { name: '', objective: '', notes: '', days: [emptyDay('Día 1')] }
    return {
        name: template.name,
        objective: template.objective ?? '',
        notes: template.notes ?? '',
        days: template.days.map((d) => ({
            name: d.name,
            exercises: d.exercises.map((e) => ({
                exerciseId: e.exerciseId,
                exerciseName: e.exerciseName,
                muscleGroup: e.muscleGroup,
                block: e.block,
                sets: String(e.sets),
                reps: e.reps,
                restSeconds: e.restSeconds == null ? '' : String(e.restSeconds),
                intensity: e.intensity ?? '',
                suggestedWeight: e.suggestedWeight == null ? '' : String(e.suggestedWeight),
                notes: e.notes ?? '',
            })),
        })),
    }
}

export function toPayload(values) {
    return {
        name: values.name,
        objective: values.objective || null,
        notes: values.notes || null,
        days: values.days.map((d) => ({
            name: d.name,
            exercises: d.exercises.map((e) => ({
                exerciseId: e.exerciseId,
                block: e.block,
                sets: Number(e.sets),
                reps: e.reps,
                restSeconds: e.restSeconds === '' ? null : Number(e.restSeconds),
                intensity: e.intensity || null,
                suggestedWeight: e.suggestedWeight === '' ? null : Number(e.suggestedWeight.replace(',', '.')),
                notes: e.notes || null,
            })),
        })),
    }
}