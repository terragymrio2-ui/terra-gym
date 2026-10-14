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
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePlanMutations } from '@/hooks/useTrainingPlans'
import { useTemplates } from '@/hooks/useTrainingTemplates'
import { getErrorMessage } from '@/services/api'

// members: [{ id, name, hasPlan }] | null
export default function AssignTemplateDialog({ members, onClose, onDone }) {
    return (
        <Dialog open={!!members} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>{members && <Form members={members} onClose={onClose} onDone={onDone} />}</DialogContent>
        </Dialog>
    )
}

function Form({ members, onClose, onDone }) {
    const [templateId, setTemplateId] = useState('')
    const { data, isLoading } = useTemplates({ page: 1, limit: 100 })
    const { assign } = usePlanMutations()
    const replacing = members.filter((m) => m.hasPlan).length

    async function submit() {
        try {
            await assign.mutateAsync({
                templateId: Number(templateId),
                memberIds: members.map((m) => m.id),
            })
            toast.success(members.length === 1 ? 'Rutina asignada' : `Rutina asignada a ${members.length} socios`)
            onDone?.()
            onClose()
        } catch (error) {
            toast.error(getErrorMessage(error))
        }
    }

    return (
        <>
            <DialogHeader>
                <DialogTitle>Asignar plantilla</DialogTitle>
                <DialogDescription>
                    {members.length === 1
                        ? `Para ${members[0].name}.`
                        : `Para ${members.length} socios. Cada uno recibe su propia copia.`}
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
                <Label htmlFor="template">Plantilla</Label>
                <Select value={templateId} onValueChange={setTemplateId} disabled={isLoading}>
                    <SelectTrigger id="template" className="w-full">
                        <SelectValue placeholder={isLoading ? 'Cargando...' : 'Elegí una plantilla'} />
                    </SelectTrigger>
                    <SelectContent>
                        {(data?.items ?? []).map((t) => (
                            <SelectItem key={t.id} value={String(t.id)}>
                                {t.name} · {t.daysCount} {t.daysCount === 1 ? 'día' : 'días'}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {!isLoading && data?.items.length === 0 && (
                    <p className="text-sm text-muted-foreground">Todavía no hay plantillas. Creá una primero.</p>
                )}
            </div>

            {replacing > 0 && (
                <p role="status" className="rounded-md border bg-muted/50 p-3 text-sm">
                    {replacing === 1 ? '1 socio ya tiene' : `${replacing} socios ya tienen`} una rutina activa. Pasará al
                    historial y la nueva ocupa su lugar.
                </p>
            )}

            <DialogFooter>
                <Button variant="outline" onClick={onClose} disabled={assign.isPending}>
                    Cancelar
                </Button>
                <Button onClick={submit} disabled={!templateId || assign.isPending}>
                    {assign.isPending ? 'Asignando...' : 'Asignar'}
                </Button>
            </DialogFooter>
        </>
    )
}