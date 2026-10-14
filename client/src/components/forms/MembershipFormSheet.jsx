import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarCheck } from 'lucide-react'
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
import { useMembershipMutations, useMemberships } from '@/hooks/useMemberships'
import { useMembershipPlans } from '@/hooks/useMembershipPlans'
import { getErrorMessage } from '@/services/api'
import { addDays, membershipEnd, todayAR } from '@/utils/dates'
import { formatCurrency, formatDate } from '@/utils/format'
import FormField from './FormField'
import MemberPicker from './MemberPicker'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { PAYMENT_METHODS } from '@/utils/payments'

const schema = z.object({
    userId: z.number({ message: 'Elegí un socio' }),
    planId: z.string().min(1, 'Elegí un plan'),
    amount: z.string().trim().regex(/^(\d+([.,]\d{1,2})?)?$/, 'Monto inválido (ej: 20000 o 20000,50)'),
    method: z.enum(Object.keys(PAYMENT_METHODS)),
})

const CURRENT_STATUSES = ['VIGENTE', 'POR_VENCER', 'PROGRAMADA']

// initialMember: socio preseleccionado (al renovar desde la tabla)
export default function MembershipFormSheet({ open, onOpenChange, initialMember }) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                <MembershipForm initialMember={initialMember} onDone={() => onOpenChange(false)} />
            </SheetContent>
        </Sheet>
    )
}

function MembershipForm({ initialMember, onDone }) {
    const [member, setMember] = useState(initialMember ?? null)
    const { data: plans } = useMembershipPlans()
    const { create } = useMembershipMutations()
    const activePlans = (plans ?? []).filter((p) => p.isActive)
    const [pendingPayload, setPendingPayload] = useState(null) // espera confirmación de renovación extra
    const [scheduledFrom, setScheduledFrom] = useState(null)

    const {
        control,
        register,
        handleSubmit,
        setError,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            userId: initialMember?.id,
            planId: '',
            amount: '',
            method: 'EFECTIVO',
        },
    })

    const planId = watch('planId')
    const amountText = watch('amount')
    const plan = activePlans.find((p) => String(p.id) === planId)

    // Vista previa: busca las membresías vigentes o programadas del socio
    const { data: existing, isLoading: loadingExisting } = useMemberships(
        { userId: member?.id, limit: 50 },
        { enabled: !!member },
    )
    const lastEnd = (existing?.items ?? [])
        .filter((m) => CURRENT_STATUSES.includes(m.status))
        .map((m) => m.endDate)
        .sort()
        .at(-1)
    const previewStart = lastEnd ? addDays(lastEnd, 1) : todayAR()
    const previewEnd = plan ? membershipEnd(previewStart, plan.durationMonths) : null

    async function submit(payload) {
        try {
            await create.mutateAsync(payload)
            toast.success('Membresía creada')
            setPendingPayload(null)
            onDone()
        } catch (error) {
            const err = error.response?.data?.error
            if (err?.code === 'ALREADY_SCHEDULED') {
                setScheduledFrom(err.details?.nextStartDate ?? null)
                setPendingPayload(payload) // abre el diálogo de confirmación
                return
            }
            setPendingPayload(null)
            toast.error(getErrorMessage(error))
        }
    }

    async function onSubmit(values) {
        const amount = values.amount ? Number(values.amount.replace(',', '.')) : null
        if (amount !== null && amount <= 0) {
            setError('amount', { message: 'El monto debe ser mayor a 0' })
            return
        }
        if (amount !== null && amount > plan.price) {
            setError('amount', { message: `No puede superar el precio del plan (${formatCurrency(plan.price)})` })
            return
        }

        await submit({
            userId: values.userId,
            planId: Number(values.planId),
            ...(amount !== null && { payment: { amount, method: values.method } }),
        })
    }
    return (
        <>
            <SheetHeader>
                <SheetTitle>Nueva membresía</SheetTitle>
                <SheetDescription>
                    Si el socio ya tiene una membresía vigente, la nueva empieza cuando esa termine.
                </SheetDescription>
            </SheetHeader>

            <form id="membership-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4" noValidate>
                <Controller
                    name="userId"
                    control={control}
                    render={({ field }) => (
                        <FormField id="userId" label="Socio" error={errors.userId?.message}>
                            {(p) => (
                                <MemberPicker
                                    id={p.id}
                                    invalid={p['aria-invalid']}
                                    describedBy={p['aria-describedby']}
                                    selected={member}
                                    onSelect={(u) => {
                                        setMember(u)
                                        field.onChange(u.id)
                                    }}
                                />
                            )}
                        </FormField>
                    )}
                />

                <Controller
                    name="planId"
                    control={control}
                    render={({ field }) => (
                        <FormField id="planId" label="Plan" error={errors.planId?.message}>
                            {(p) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger
                                        id={p.id}
                                        aria-invalid={p['aria-invalid']}
                                        aria-describedby={p['aria-describedby']}
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Elegí un plan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {activePlans.map((pl) => (
                                            <SelectItem key={pl.id} value={String(pl.id)}>
                                                {pl.name} · {formatCurrency(pl.price)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </FormField>
                    )}
                />

                {member && plan && (
                    <div
                        className="flex gap-2 rounded-md border bg-muted/50 p-3 text-sm"
                        role="status"
                        aria-live="polite"
                    >
                        <CalendarCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                        {loadingExisting ? (
                            <p>Calculando fechas...</p>
                        ) : (
                            <p>
                                Empieza el <strong>{formatDate(previewStart)}</strong> y vence el{' '}
                                <strong>{formatDate(previewEnd)}</strong>.{' '}
                                <span className="text-muted-foreground">
                                    Estimado: el sistema confirma las fechas al guardar.
                                </span>
                            </p>
                        )}
                    </div>
                )}

                <fieldset className="space-y-4 rounded-md border p-3">
                    <legend className="px-1 text-sm font-medium">Pago inicial (opcional)</legend>

                    <FormField
                        id="amount"
                        label="Monto"
                        error={errors.amount?.message}
                        hint="Dejalo vacío si todavía no pagó. Podés registrar pagos parciales."
                    >
                        {(p) => <Input inputMode="decimal" autoComplete="off" {...p} {...register('amount')} />}
                    </FormField>

                    {plan && amountText !== String(plan.price) && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setValue('amount', String(plan.price), { shouldValidate: true })}
                        >
                            Pagar el total ({formatCurrency(plan.price)})
                        </Button>
                    )}

                    {amountText && (
                        <Controller
                            name="method"
                            control={control}
                            render={({ field }) => (
                                <FormField id="method" label="Medio de pago" error={errors.method?.message}>
                                    {(p) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger id={p.id} className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
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
                    )}
                </fieldset>
            </form>

            <SheetFooter>
                <Button type="submit" form="membership-form" disabled={isSubmitting}>
                    {isSubmitting ? 'Guardando...' : 'Crear membresía'}
                </Button>
                <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
                    Cancelar
                </Button>
            </SheetFooter>
            <ConfirmDialog
                open={!!pendingPayload}
                onOpenChange={(open) => !open && setPendingPayload(null)}
                title="Este socio ya tiene una renovación"
                description={`Ya tiene una membresía programada${scheduledFrom ? ` desde el ${formatDate(scheduledFrom)}` : ''
                    }. Si continuás, se crea otra a continuación de esa. ¿Es lo que querés?`}
                confirmLabel="Crear otra igual"
                loading={create.isPending}
                onConfirm={() => submit({ ...pendingPayload, confirmRenewal: true })}
            />
        </>
    )
}