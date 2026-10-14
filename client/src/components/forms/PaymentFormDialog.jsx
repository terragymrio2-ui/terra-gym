import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePaymentMutations } from '@/hooks/usePayments'
import { getErrorMessage } from '@/services/api'
import { formatCurrency } from '@/utils/format'
import { PAYMENT_METHODS } from '@/utils/payments'
import FormField from './FormField'

const schema = z.object({
    amount: z.string().trim().regex(/^\d+([.,]\d{1,2})?$/, 'Monto inválido (ej: 15000 o 15000,50)'),
    method: z.enum(Object.keys(PAYMENT_METHODS)),
    reference: z.string().trim().max(100, 'Máximo 100 caracteres'),
    notes: z.string().trim().max(255, 'Máximo 255 caracteres'),
})

export default function PaymentFormDialog({ membership, onClose }) {
    return (
        <Dialog open={!!membership} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>{membership && <PaymentForm membership={membership} onDone={onClose} />}</DialogContent>
        </Dialog>
    )
}

function PaymentForm({ membership, onDone }) {
    const { register: registerPayment } = usePaymentMutations()
    const {
        control,
        register,
        handleSubmit,
        setError,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { amount: '', method: 'EFECTIVO', reference: '', notes: '' },
    })

    async function onSubmit(values) {
        const amount = Number(values.amount.replace(',', '.'))
        if (amount <= 0) {
            setError('amount', { message: 'El monto debe ser mayor a 0' })
            return
        }
        if (Math.round(amount * 100) > Math.round(membership.balance * 100)) {
            setError('amount', { message: `No puede superar la deuda (${formatCurrency(membership.balance)})` })
            return
        }
        try {
            await registerPayment.mutateAsync({
                membershipId: membership.id,
                amount,
                method: values.method,
                reference: values.reference || null,
                notes: values.notes || null,
            })
            toast.success('Pago registrado')
            onDone()
        } catch (error) {
            toast.error(getErrorMessage(error))
        }
    }

    return (
        <>
            <DialogHeader>
                <DialogTitle>Registrar pago</DialogTitle>
                <DialogDescription>
                    {membership.member.firstName} {membership.member.lastName} · {membership.plan.name}. Debe{' '}
                    {formatCurrency(membership.balance)}.
                </DialogDescription>
            </DialogHeader>

            <form id="payment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <FormField id="amount" label="Monto" error={errors.amount?.message}>
                    {(p) => <Input inputMode="decimal" autoComplete="off" {...p} {...register('amount')} />}
                </FormField>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setValue('amount', String(membership.balance), { shouldValidate: true })}
                >
                    Pagar el saldo ({formatCurrency(membership.balance)})
                </Button>

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

                <FormField id="reference" label="Referencia (opcional)" error={errors.reference?.message}>
                    {(p) => <Input autoComplete="off" placeholder="Nº de comprobante" {...p} {...register('reference')} />}
                </FormField>

                <FormField id="notes" label="Notas (opcional)" error={errors.notes?.message}>
                    {(p) => <Input autoComplete="off" {...p} {...register('notes')} />}
                </FormField>
            </form>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
                    Cancelar
                </Button>
                <Button type="submit" form="payment-form" disabled={isSubmitting}>
                    {isSubmitting ? 'Guardando...' : 'Registrar pago'}
                </Button>
            </DialogFooter>
        </>
    )
}