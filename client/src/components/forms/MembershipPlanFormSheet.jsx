import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { usePlanMutations } from '@/hooks/useMembershipPlans'
import { getErrorMessage } from '@/services/api'
import FormField from './FormField'

const schema = z.object({
    name: z.string().trim().min(1, 'Ingresá el nombre').max(100, 'Máximo 100 caracteres'),
    description: z.string().trim().max(255, 'Máximo 255 caracteres'),
    price: z
        .number({ message: 'Ingresá un precio válido' })
        .min(0, 'No puede ser negativo')
        .max(10_000_000, 'Precio demasiado alto'),
    durationMonths: z
        .number({ message: 'Ingresá la duración' })
        .int('Debe ser un número entero')
        .min(1, 'Mínimo 1 mes')
        .max(24, 'Máximo 24 meses'),
    daysPerWeek: z
        .number({ message: 'Ingresá los días por semana' })
        .int('Debe ser un número entero')
        .min(1, 'Mínimo 1 día')
        .max(7, 'Máximo 7 días'),
})

const FIELDS = ['name', 'description', 'price', 'durationMonths', 'daysPerWeek']

function toDefaults(plan) {
    return {
        name: plan?.name ?? '',
        description: plan?.description ?? '',
        price: plan?.price ?? '',
        durationMonths: plan?.durationMonths ?? 1,
        daysPerWeek: plan?.daysPerWeek ?? '',
    }
}

export default function MembershipPlanFormSheet({ open, onOpenChange, plan }) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                <PlanForm plan={plan} onDone={() => onOpenChange(false)} />
            </SheetContent>
        </Sheet>
    )
}

function PlanForm({ plan, onDone }) {
    const isEdit = !!plan
    const { create, update } = usePlanMutations()
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({ resolver: zodResolver(schema), defaultValues: toDefaults(plan) })

    async function onSubmit(values) {
        try {
            if (isEdit) {
                await update.mutateAsync({ id: plan.id, data: values })
                toast.success('Plan actualizado')
            } else {
                await create.mutateAsync(values)
                toast.success('Plan creado')
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
                <SheetTitle>{isEdit ? 'Editar plan' : 'Nuevo plan'}</SheetTitle>
                <SheetDescription>
                    {isEdit
                        ? 'Los cambios de precio solo afectan a las membresías que se creen desde ahora. Las existentes conservan el precio con el que se dieron de alta.'
                        : 'Definí el precio y cuántos días por semana puede entrenar el socio.'}
                </SheetDescription>
            </SheetHeader>

            <form id="plan-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4" noValidate>
                <FormField id="name" label="Nombre" error={errors.name?.message}>
                    {(p) => <Input autoComplete="off" placeholder="Ej: 3 días por semana" {...p} {...register('name')} />}
                </FormField>

                <FormField id="description" label="Descripción (opcional)" error={errors.description?.message}>
                    {(p) => <Input autoComplete="off" {...p} {...register('description')} />}
                </FormField>

                <FormField id="price" label="Precio (ARS)" error={errors.price?.message}>
                    {(p) => (
                        <Input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            {...p}
                            {...register('price', { valueAsNumber: true })}
                        />
                    )}
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField id="daysPerWeek" label="Días por semana" error={errors.daysPerWeek?.message}>
                        {(p) => (
                            <Input
                                type="number"
                                inputMode="numeric"
                                min="1"
                                max="7"
                                {...p}
                                {...register('daysPerWeek', { valueAsNumber: true })}
                            />
                        )}
                    </FormField>
                    <FormField id="durationMonths" label="Duración (meses)" error={errors.durationMonths?.message}>
                        {(p) => (
                            <Input
                                type="number"
                                inputMode="numeric"
                                min="1"
                                max="24"
                                {...p}
                                {...register('durationMonths', { valueAsNumber: true })}
                            />
                        )}
                    </FormField>
                </div>
            </form>

            <SheetFooter>
                <Button type="submit" form="plan-form" disabled={isSubmitting}>
                    {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear plan'}
                </Button>
                <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
                    Cancelar
                </Button>
            </SheetFooter>
        </>
    )
}