import { useState } from 'react'
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
import { useAnnouncementMutations, usePendingAnnouncements } from '@/hooks/useAnnouncements'
import { getErrorMessage } from '@/services/api'
import { formatDate } from '@/utils/format'

export default function PendingAnnouncements() {
    const { data } = usePendingAnnouncements()
    const { markRead } = useAnnouncementMutations()
    // Los que se cierran sin "Entendido" no se muestran de nuevo en esta sesión,
    // pero siguen pendientes y vuelven a aparecer la próxima vez que entre
    const [dismissed, setDismissed] = useState(() => new Set())

    const current = (data ?? []).find((a) => !dismissed.has(a.id))

    async function understood() {
        try {
            await markRead.mutateAsync(current.id)
        } catch (error) {
            toast.error(getErrorMessage(error))
        }
    }

    return (
        <Dialog
            open={!!current}
            onOpenChange={(open) => {
                if (!open && current) setDismissed((s) => new Set(s).add(current.id))
            }}
        >
            <DialogContent>
                {current && (
                    <>
                        <DialogHeader>
                            <DialogTitle>{current.title}</DialogTitle>
                            <DialogDescription>Aviso del gimnasio · {formatDate(current.createdAt)}</DialogDescription>
                        </DialogHeader>
                        <p className="whitespace-pre-wrap text-sm">{current.message}</p>
                        <DialogFooter>
                            <Button onClick={understood} disabled={markRead.isPending}>
                                {markRead.isPending ? 'Guardando...' : 'Entendido'}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}