import { Controller } from 'react-hook-form'
import { ArrowDown, ArrowUp, ExternalLink, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BLOCKS, MUSCLE_GROUPS } from '@/utils/exercises'
import FormField from './FormField'

export default function TemplateExerciseRow({
    control,
    register,
    errors,
    dayIndex,
    index,
    total,
    field,
    onMove,
    onRemove,
}) {
    const path = (key) => `days.${dayIndex}.exercises.${index}.${key}`
    const idFor = (key) => `ex-${dayIndex}-${index}-${key}`
    const err = (key) => errors.days?.[dayIndex]?.exercises?.[index]?.[key]?.message

    return (
        <li className="rounded-lg border p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="font-medium">
                        {index + 1}. {field.exerciseName}
                    </p>
                    <p className="text-xs text-muted-foreground">{MUSCLE_GROUPS[field.muscleGroup]}</p>
                </div>
                <div className="flex shrink-0">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === 0}
                        onClick={() => onMove(index, index - 1)}
                        aria-label={`Subir ${field.exerciseName}`}
                    >
                        <ArrowUp aria-hidden="true" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === total - 1}
                        onClick={() => onMove(index, index + 1)}
                        aria-label={`Bajar ${field.exerciseName}`}
                    >
                        <ArrowDown aria-hidden="true" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove(index)}
                        aria-label={`Quitar ${field.exerciseName} del día`}
                    >
                        <Trash2 aria-hidden="true" />
                    </Button>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Controller
                    name={path('block')}
                    control={control}
                    render={({ field: f }) => (
                        <FormField id={idFor('block')} label="Bloque" error={err('block')}>
                            {(p) => (
                                <Select value={f.value} onValueChange={f.onChange}>
                                    <SelectTrigger id={p.id} className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(BLOCKS).map(([value, label]) => (
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
                <FormField id={idFor('sets')} label="Series" error={err('sets')}>
                    {(p) => <Input inputMode="numeric" autoComplete="off" {...p} {...register(path('sets'))} />}
                </FormField>
                <FormField id={idFor('reps')} label="Repeticiones" error={err('reps')}>
                    {(p) => (
                        <Input autoComplete="off" placeholder="Ej: 10 o 8-12" {...p} {...register(path('reps'))} />
                    )}
                </FormField>
                <FormField id={idFor('rest')} label="Descanso (seg)" error={err('restSeconds')}>
                    {(p) => (
                        <Input inputMode="numeric" autoComplete="off" {...p} {...register(path('restSeconds'))} />
                    )}
                </FormField>
                <FormField id={idFor('intensity')} label="Intensidad" error={err('intensity')}>
                    {(p) => (
                        <Input autoComplete="off" placeholder="Ej: RPE 8" {...p} {...register(path('intensity'))} />
                    )}
                </FormField>
                <FormField id={idFor('weight')} label="Peso sugerido (kg)" error={err('suggestedWeight')}>
                    {(p) => (
                        <Input inputMode="decimal" autoComplete="off" {...p} {...register(path('suggestedWeight'))} />
                    )}
                </FormField>
            </div>

            <div className="mt-3">
                <FormField id={idFor('notes')} label="Comentario del profesor" error={err('notes')}>
                    {(p) => (
                        <Input
                            autoComplete="off"
                            placeholder="Indicaciones específicas para el socio"
                            {...p}
                            {...register(path('notes'))}
                        />
                    )}
                </FormField>
            </div>
        </li>
    )
}