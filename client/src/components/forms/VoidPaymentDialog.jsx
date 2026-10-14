import { useForm } from 'react-hook-form'
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
import { usePaymentMutations } from '@/hooks/usePayments'
import { getErrorMessage } from '@/services/api'
import { formatCurrency } from '@/utils/format'
import FormField from './FormField'

const schema = z.object({
    reason: z.string().trim().min(3, 'Indicá el motivo (mínimo 3 caracteres)').max(255, 'Máximo 255 caracteres'),
})

export default function VoidPaymentDialog({ payment, onClose }) {
    return (
        <Dialog open={!!payment} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>{payment && <VoidForm payment={payment} onDone={onClose} />}</DialogContent>
        </Dialog>
    )
}

function VoidForm({ payment, onDone }) {
    const { void: voidPayment } = usePaymentMutations()
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({ resolver: zodResolver(schema), defaultValues: { reason: '' } })

    async function onSubmit({ reason }) {
        try {
            await voidPayment.mutateAsync({ id: payment.id, reason })
            toast.success('Pago anulado')
            onDone()
        } catch (error) {
            toast.error(getErrorMessage(error))
        }
    }

    return (
        <>
            <DialogHeader>
                <DialogTitle>Anular pago de {formatCurrency(payment.amount)}</DialogTitle>
                <DialogDescription>
                    El pago deja de contar para el saldo, pero queda registrado con el motivo. No se puede deshacer.
                </DialogDescription>
            </DialogHeader>

            <form id="void-form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <FormField id="reason" label="Motivo de la anulación" error={errors.reason?.message}>
                    {(p) => <Input autoComplete="off" placeholder="Ej: cargado por error" {...p} {...register('reason')} />}
                </FormField>
            </form>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
                    Cancelar
                </Button>
                <Button type="submit" form="void-form" variant="destructive" disabled={isSubmitting}>
                    {isSubmitting ? 'Anulando...' : 'Anular pago'}
                </Button>
            </DialogFooter>
        </>
    )
}