import { useState } from 'react'
import { MoreHorizontal, Pencil, Plus, Power, Tags } from 'lucide-react'
import { toast } from 'sonner'
import MembershipPlanFormSheet from '@/components/forms/MembershipPlanFormSheet'
import PageHeader from '@/components/layout/PageHeader'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import EmptyState from '@/components/shared/EmptyState'
import StatusBadge from '@/components/shared/StatusBadge'
import DataTable from '@/components/tables/DataTable'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useMembershipPlans, usePlanMutations } from '@/hooks/useMembershipPlans'
import { getErrorMessage } from '@/services/api'
import { formatCurrency } from '@/utils/format'

function RowActions({ plan, onEdit, onToggle }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Acciones para ${plan.name}`}>
                    <MoreHorizontal aria-hidden="true" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onEdit(plan)}>
                    <Pencil aria-hidden="true" /> Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onSelect={() => onToggle(plan)}
                    className={plan.isActive ? 'text-destructive focus:text-destructive' : undefined}
                >
                    <Power aria-hidden="true" /> {plan.isActive ? 'Desactivar' : 'Activar'}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default function PlansPage() {
    const [sheet, setSheet] = useState({ open: false, plan: null })
    const [toToggle, setToToggle] = useState(null)
    const { data, isLoading, isError, refetch } = useMembershipPlans()
    const { setStatus } = usePlanMutations()

    async function handleToggle() {
        try {
            await setStatus.mutateAsync({ id: toToggle.id, isActive: !toToggle.isActive })
            toast.success(toToggle.isActive ? 'Plan desactivado' : 'Plan activado')
            setToToggle(null)
        } catch (error) {
            toast.error(getErrorMessage(error))
        }
    }

    const openCreate = () => setSheet({ open: true, plan: null })
    const actionsFor = (p) => (
        <RowActions
            plan={p}
            onEdit={(plan) => setSheet({ open: true, plan })}
            onToggle={setToToggle}
        />
    )

    const columns = [
        {
            header: 'Plan',
            cell: (p) => (
                <div>
                    <p className="font-medium">{p.name}</p>
                    {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                </div>
            ),
        },
        { header: 'Días por semana', cell: (p) => p.daysPerWeek },
        {
            header: 'Duración',
            cell: (p) => `${p.durationMonths} ${p.durationMonths === 1 ? 'mes' : 'meses'}`,
        },
        { header: 'Precio', cell: (p) => <span className="font-medium">{formatCurrency(p.price)}</span> },
        { header: 'Estado', cell: (p) => <StatusBadge status={p.isActive ? 'active' : 'inactive'} /> },
        { header: 'Acciones', srOnly: true, className: 'w-12 text-right', cell: actionsFor },
    ]

    const renderCard = (p) => (
        <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
                <p className="font-medium">{p.name}</p>
                <p className="text-sm">
                    {formatCurrency(p.price)} · {p.daysPerWeek} días/sem · {p.durationMonths}{' '}
                    {p.durationMonths === 1 ? 'mes' : 'meses'}
                </p>
                <StatusBadge status={p.isActive ? 'active' : 'inactive'} />
            </div>
            {actionsFor(p)}
        </div>
    )

    return (
        <>
            <PageHeader
                title="Planes de membresía"
                description="Los planes que se ofrecen a los socios y su precio."
                actions={
                    <Button onClick={openCreate}>
                        <Plus aria-hidden="true" /> Nuevo plan
                    </Button>
                }
            />

            <DataTable
                columns={columns}
                rows={data}
                getRowId={(p) => p.id}
                renderCard={renderCard}
                isLoading={isLoading}
                isError={isError}
                onRetry={refetch}
                empty={
                    <EmptyState
                        icon={Tags}
                        title="Todavía no hay planes"
                        description="Creá el primer plan para poder dar de alta membresías."
                        action={
                            <Button onClick={openCreate}>
                                <Plus aria-hidden="true" /> Nuevo plan
                            </Button>
                        }
                    />
                }
            />

            <MembershipPlanFormSheet
                open={sheet.open}
                onOpenChange={(open) => setSheet((s) => ({ ...s, open }))}
                plan={sheet.plan}
            />

            <ConfirmDialog
                open={!!toToggle}
                onOpenChange={(open) => !open && setToToggle(null)}
                title={toToggle?.isActive ? '¿Desactivar este plan?' : '¿Activar este plan?'}
                description={
                    toToggle?.isActive
                        ? 'No se podrán crear membresías nuevas con este plan. Las membresías existentes no se modifican.'
                        : 'Volverá a estar disponible para nuevas membresías.'
                }
                confirmLabel={toToggle?.isActive ? 'Desactivar' : 'Activar'}
                destructive={toToggle?.isActive}
                loading={setStatus.isPending}
                onConfirm={handleToggle}
            />
        </>
    )
}