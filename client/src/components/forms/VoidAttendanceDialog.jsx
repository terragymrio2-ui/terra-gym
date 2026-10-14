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
import { useAttendanceMutations } from '@/hooks/useAttendances'
import { getErrorMessage } from '@/services/api'
import { formatDate, formatTime } from '@/utils/format'
import FormField from './FormField'

const schema = z.object({
    reason: z.string().trim().min(3, 'Indicá el motivo (mínimo 3 caracteres)').max(255, 'Máximo 255 caracteres'),
})

export default function VoidAttendanceDialog({ attendance, onClose }) {
    return (
        <Dialog open={!!attendance} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>{attendance && <VoidForm attendance={attendance} onDone={onClose} />}</DialogContent>
        </Dialog>
    )
}

function VoidForm({ attendance, onDone }) {
    const { void: voidAttendance } = useAttendanceMutations()
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({ resolver: zodResolver(schema), defaultValues: { reason: '' } })

    async function onSubmit({ reason }) {
        try {
            await voidAttendance.mutateAsync({ id: attendance.id, reason })
            toast.success('Ingreso anulado')
            onDone()
        } catch (error) {
            toast.error(getErrorMessage(error))
        }
    }

    return (
        <>
            <DialogHeader>
                <DialogTitle>Anular ingreso</DialogTitle>
                <DialogDescription>
                    {attendance.member.firstName} {attendance.member.lastName} · {formatDate(attendance.date)}{' '}
                    {formatTime(attendance.checkedInAt)} hs. Deja de contar para el cupo semanal pero queda registrado.
                </DialogDescription>
            </DialogHeader>

            <form id="void-attendance-form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <FormField id="reason" label="Motivo de la anulación" error={errors.reason?.message}>
                    {(p) => <Input autoComplete="off" placeholder="Ej: cargado por error" {...p} {...register('reason')} />}
                </FormField>
            </form>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
                    Cancelar
                </Button>
                <Button type="submit" form="void-attendance-form" variant="destructive" disabled={isSubmitting}>
                    {isSubmitting ? 'Anulando...' : 'Anular ingreso'}
                </Button>
            </DialogFooter>
        </>
    )
}