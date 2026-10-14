import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import ErrorState from '@/components/shared/ErrorState'
import StatusBadge from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useMemberPlans, usePlanMutations } from '@/hooks/useTrainingPlans'
import { getErrorMessage } from '@/services/api'
import { formatDate } from '@/utils/format'

function Content({ member }) {
    const navigate = useNavigate()
    const { data, isLoading, isError, refetch } = useMemberPlans(member.id)
    const { setStatus } = usePlanMutations()

    async function toggle(plan) {
        try {
            await setStatus.mutateAsync({ id: plan.id, isActive: !plan.isActive })
            toast.success(plan.isActive ? 'Rutina desactivada' : 'Rutina activada')
        } catch (error) {
            toast.error(getErrorMessage(error))
        }
    }

    return (
        <>
            <SheetHeader>
                <SheetTitle>
                    Rutinas de {member.firstName} {member.lastName}
                </SheetTitle>
                <SheetDescription>Solo una puede estar activa. Activar otra reemplaza a la actual.</SheetDescription>
            </SheetHeader>

            <div className="px-4 pb-4">
                {isLoading && <Skeleton className="h-32 w-full" role="status" aria-label="Cargando" />}
                {isError && <ErrorState onRetry={refetch} />}
                {data?.length === 0 && <p className="text-sm text-muted-foreground">Todavía no tiene rutinas.</p>}
                {data?.length > 0 && (
                    <ul className="space-y-3">
                        {data.map((p) => (
                            <li key={p.id} className="rounded-lg border p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="font-medium">{p.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Desde {formatDate(p.startDate ?? p.createdAt)} · por {p.createdBy.firstName}{' '}
                                            {p.createdBy.lastName}
                                        </p>
                                    </div>
                                    <StatusBadge status={p.isActive ? 'active' : 'inactive'} />
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Button size="sm" variant="outline" onClick={() => navigate(`/socios-rutinas/rutina/${p.id}`)}>
                                        Ver / editar
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => toggle(p)} disabled={setStatus.isPending}>
                                        {p.isActive ? 'Desactivar' : 'Activar (reemplaza la actual)'}
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </>
    )
}

export default function MemberPlansSheet({ member, onClose }) {
    return (
        <Sheet open={!!member} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                {member && <Content member={member} />}
            </SheetContent>
        </Sheet>
    )
}