import { useEffect, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { Copy, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '@/components/layout/PageHeader'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useTemplateMutations } from '@/hooks/useTrainingTemplates'
import {
    emptyDay,
    newExerciseRow,
    templateFormSchema,
    toFormValues,
    toPayload,
} from '@/lib/templateForm'
import { getErrorMessage } from '@/services/api'
import ExerciseFormSheet from './ExerciseFormSheet'
import ExercisePicker from './ExercisePicker'
import FormField from './FormField'
import TemplateExerciseRow from './TemplateExerciseRow'
import { usePlanMutations } from '@/hooks/useTrainingPlans'
import { useUnsaved } from '@/contexts/UnsavedContext'


const MAX_DAYS = 7

function DayPanel({ control, register, errors, dayIndex }) {
    const { fields, append, remove, move } = useFieldArray({
        control,
        name: `days.${dayIndex}.exercises`,
    })
    const [createOpen, setCreateOpen] = useState(false)
    const addExercise = (exercise) => append(newExerciseRow(exercise))

    return (
        <div className="space-y-4">
            <div className="max-w-sm">
                <FormField
                    id={`day-name-${dayIndex}`}
                    label="Nombre del día"
                    error={errors.days?.[dayIndex]?.name?.message}
                >
                    {(p) => (
                        <Input autoComplete="off" placeholder="Ej: Piernas" {...p} {...register(`days.${dayIndex}.name`)} />
                    )}
                </FormField>
            </div>

            {fields.length === 0 ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    Este día todavía no tiene ejercicios.
                </p>
            ) : (
                <ul className="space-y-3">
                    {fields.map((field, index) => (
                        <TemplateExerciseRow
                            key={field.id}
                            control={control}
                            register={register}
                            errors={errors}
                            dayIndex={dayIndex}
                            index={index}
                            total={fields.length}
                            field={field}
                            onMove={move}
                            onRemove={remove}
                        />
                    ))}
                </ul>
            )}

            {errors.days?.[dayIndex]?.exercises?.message && (
                <p role="alert" className="text-sm text-destructive">
                    {errors.days[dayIndex].exercises.message}
                </p>
            )}

            <div className="flex flex-wrap gap-2">
                <ExercisePicker onPick={addExercise} />
                <Button type="button" variant="ghost" onClick={() => setCreateOpen(true)}>
                    <Plus aria-hidden="true" /> Crear ejercicio nuevo
                </Button>
            </div>

            <ExerciseFormSheet
                open={createOpen}
                onOpenChange={setCreateOpen}
                exercise={null}
                onSaved={addExercise}
            />
        </div>
    )
}

export default function TemplateEditor({ template, kind = 'template', memberId, backTo = '/plantillas' }) {
    const navigate = useNavigate()
    const isEdit = !!template
    const { create, update } = useTemplateMutations()
    const planMutations = usePlanMutations()
    const isPlan = kind === 'plan'
    const [active, setActive] = useState(0)
    const [dayToRemove, setDayToRemove] = useState(null)

    const {
        control,
        register,
        handleSubmit,
        getValues,
        formState: { errors, isSubmitting, isDirty },
    } = useForm({ resolver: zodResolver(templateFormSchema), defaultValues: toFormValues(template) })

    const { fields: days, append, insert, remove } = useFieldArray({ control, name: 'days' })
    const watchedDays = useWatch({ control, name: 'days' })

    const { markDirty } = useUnsaved()

    useEffect(() => {
        markDirty(isDirty)
        if (!isDirty) return
        const warn = (e) => e.preventDefault()
        window.addEventListener('beforeunload', warn)
        return () => window.removeEventListener('beforeunload', warn)
    }, [isDirty, markDirty])

    // Al salir del editor, el estado vuelve a limpio
    useEffect(() => () => markDirty(false), [markDirty])

    function addDay() {
        append(emptyDay(`Día ${days.length + 1}`))
        setActive(days.length)
    }

    function copyDay(index) {
        const day = getValues(`days.${index}`)
        insert(index + 1, { ...structuredClone(day), name: `${day.name} (copia)`.slice(0, 100) })
        setActive(index + 1)
    }

    function confirmRemoveDay() {
        remove(dayToRemove)
        setActive((a) => Math.max(0, Math.min(a, days.length - 2)))
        setDayToRemove(null)
    }

    async function onSubmit(values) {
        const payload = toPayload(values)
        try {
            if (isPlan) {
                if (isEdit) {
                    await planMutations.update.mutateAsync({
                        id: template.id,
                        data: { ...payload, expectedRevision: template.revision },
                    })
                } else {
                    await planMutations.create.mutateAsync({ ...payload, memberId })
                }
            } else if (isEdit) {
                await update.mutateAsync({
                    id: template.id,
                    data: { ...payload, expectedRevision: template.revision },
                })
            } else {
                await create.mutateAsync(payload)
            }
            toast.success(isEdit ? 'Cambios guardados' : 'Creada correctamente')
            markDirty(false)
            navigate(backTo)
        } catch (error) {
            toast.error(getErrorMessage(error), { duration: 10000 })
        }
    }

    // Si el error está en un día que no se está viendo, saltar a ese día
    function onInvalid(formErrors) {
        const firstWithError = formErrors.days?.findIndex?.((d) => d)
        if (firstWithError >= 0) setActive(firstWithError)
        toast.error('Revisá los campos marcados en rojo')
    }

    return (
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
            <PageHeader
                title={
                    isPlan
                        ? isEdit
                            ? `Rutina de ${template.member.firstName} ${template.member.lastName}`
                            : 'Nueva rutina'
                        : isEdit
                            ? 'Editar plantilla'
                            : 'Nueva plantilla'
                }
                description={
                    isPlan
                        ? isEdit
                            ? 'Los cambios afectan solo a este socio, no a la plantilla de origen.'
                            : 'Armada desde cero para este socio. Al guardar reemplaza su rutina activa.'
                        : isEdit
                            ? `Creada por ${template.createdBy.firstName} ${template.createdBy.lastName}. Cualquier profesor puede editarla.`
                            : 'Armala una vez y asignala a todos los socios que quieras.'
                }
                actions={
                    <>
                        <Button type="button" variant="outline" onClick={() => navigate(backTo)} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : isPlan ? 'Guardar rutina' : 'Guardar plantilla'}
                        </Button>
                    </>
                }
            />

            <Card className="mb-6">
                <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
                    <FormField id="name" label="Nombre" error={errors.name?.message}>
                        {(p) => <Input autoComplete="off" placeholder="Ej: Fuerza 3 días" {...p} {...register('name')} />}
                    </FormField>
                    <FormField id="objective" label="Objetivo (opcional)" error={errors.objective?.message}>
                        {(p) => (
                            <Input autoComplete="off" placeholder="Ej: Ganar masa muscular" {...p} {...register('objective')} />
                        )}
                    </FormField>
                    <div className="md:col-span-2">
                        <FormField id="notes" label="Notas generales (opcional)" error={errors.notes?.message}>
                            {(p) => <Textarea rows={3} {...p} {...register('notes')} />}
                        </FormField>
                    </div>
                </CardContent>
            </Card>

            <Tabs value={String(active)} onValueChange={(v) => setActive(Number(v))}>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    <TabsList className="h-auto flex-wrap justify-start">
                        {days.map((d, i) => (
                            <TabsTrigger key={d.id} value={String(i)}>
                                {watchedDays?.[i]?.name || `Día ${i + 1}`}
                                {errors.days?.[i] && (
                                    <span className="ml-1.5 size-2 rounded-full bg-destructive" role="img" aria-label="con errores" />
                                )}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    <Button type="button" variant="outline" size="sm" onClick={addDay} disabled={days.length >= MAX_DAYS}>
                        <Plus aria-hidden="true" /> Agregar día
                    </Button>
                </div>

                {days.map((d, i) => (
                    <TabsContent key={d.id} value={String(i)} className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => copyDay(i)}
                                disabled={days.length >= MAX_DAYS}
                            >
                                <Copy aria-hidden="true" /> Copiar este día
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setDayToRemove(i)}
                                disabled={days.length <= 1}
                                className="text-destructive"
                            >
                                <Trash2 aria-hidden="true" /> Eliminar este día
                            </Button>
                        </div>
                        <DayPanel control={control} register={register} errors={errors} dayIndex={i} />
                    </TabsContent>
                ))}
            </Tabs>

            <ConfirmDialog
                open={!!pendingTo}
                onOpenChange={(open) => !open && setPendingTo(null)}
                title="Tenés cambios sin guardar"
                description="Si salís ahora, los cambios de esta pantalla se pierden."
                confirmLabel="Salir sin guardar"
                destructive
                onConfirm={() => {
                    markDirty(false)
                    navigate(pendingTo)
                    setPendingTo(null)
                }}
            />
        </form>
    )
}