import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { useExerciseMutations } from '@/hooks/useExercises'
import { getErrorMessage } from '@/services/api'
import { MUSCLE_GROUPS, isValidVideoUrl } from '@/utils/exercises'
import FormField from './FormField'

const schema = z.object({
    name: z.string().trim().min(1, 'Ingresá el nombre').max(120, 'Máximo 120 caracteres'),
    muscleGroup: z.string().min(1, 'Elegí un grupo muscular'),
    description: z.string().trim().max(500, 'Máximo 500 caracteres'),
    videoUrl: z
        .string()
        .trim()
        .max(255, 'Máximo 255 caracteres')
        .refine((v) => v === '' || isValidVideoUrl(v), 'Tiene que ser un link https de YouTube o Vimeo'),
})

const FIELDS = ['name', 'muscleGroup', 'description', 'videoUrl']

function toDefaults(exercise) {
    return {
        name: exercise?.name ?? '',
        muscleGroup: exercise?.muscleGroup ?? '',
        description: exercise?.description ?? '',
        videoUrl: exercise?.videoUrl ?? '',
    }
}

export default function ExerciseFormSheet({ open, onOpenChange, exercise, onSaved }) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                <ExerciseForm exercise={exercise} onSaved={onSaved} onDone={() => onOpenChange(false)} />
            </SheetContent>
        </Sheet>
    )
}

function ExerciseForm({ exercise, onDone, onSaved }) {
    const isEdit = !!exercise
    const { create, update } = useExerciseMutations()
    const {
        control,
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({ resolver: zodResolver(schema), defaultValues: toDefaults(exercise) })

    async function onSubmit(values) {
        try {
            if (isEdit) {
                await update.mutateAsync({ id: exercise.id, data: values })
                toast.success('Ejercicio actualizado')
            } else {
                const created = await create.mutateAsync(values)
                toast.success('Ejercicio creado')
                onSaved?.(created)
            }
            onDone()
        } catch (error) {
            const err = error.response?.data?.error
            if (err?.code === 'DUPLICATE') {
                setError('name', { message: err.message })
                return
            }
            if (err?.code === 'VALIDATION_ERROR') {
                let handled = false
                for (const d of err.details ?? []) {
                    if (FIELDS.includes(d.field)) {
                        setError(d.field, { message: d.message })
                        handled = true
                    }
                }
                if (handled) return
            }
            toast.error(getErrorMessage(error))
        }
    }

    return (
        <>
            <SheetHeader>
                <SheetTitle>{isEdit ? 'Editar ejercicio' : 'Nuevo ejercicio'}</SheetTitle>
                <SheetDescription>
                    Los ejercicios son compartidos: todos los profesores los pueden usar en sus rutinas.
                </SheetDescription>
            </SheetHeader>

            <form id="exercise-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4" noValidate>
                <FormField id="name" label="Nombre" error={errors.name?.message}>
                    {(p) => <Input autoComplete="off" placeholder="Ej: Sentadilla" {...p} {...register('name')} />}
                </FormField>

                <Controller
                    name="muscleGroup"
                    control={control}
                    render={({ field }) => (
                        <FormField id="muscleGroup" label="Grupo muscular" error={errors.muscleGroup?.message}>
                            {(p) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger
                                        id={p.id}
                                        aria-invalid={p['aria-invalid']}
                                        aria-describedby={p['aria-describedby']}
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Elegí un grupo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(MUSCLE_GROUPS).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </FormField>
                    )}
                />

                <FormField
                    id="videoUrl"
                    label="Link de video (opcional)"
                    error={errors.videoUrl?.message}
                    hint="Solo YouTube o Vimeo."
                >
                    {(p) => (
                        <Input type="url" autoComplete="off" placeholder="https://www.youtube.com/..." {...p} {...register('videoUrl')} />
                    )}
                </FormField>

                <FormField id="description" label="Descripción (opcional)" error={errors.description?.message}>
                    {(p) => <Input autoComplete="off" placeholder="Indicaciones técnicas" {...p} {...register('description')} />}
                </FormField>
            </form>

            <SheetFooter>
                <Button type="submit" form="exercise-form" disabled={isSubmitting}>
                    {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear ejercicio'}
                </Button>
                <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
                    Cancelar
                </Button>
            </SheetFooter>
        </>
    )
}