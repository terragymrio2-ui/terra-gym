import { IdCard } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import MembershipHistory from '@/components/shared/MembershipHistory'
import StatusBadge from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyMemberships } from '@/hooks/useMemberships'
import { formatCurrency, formatDate } from '@/utils/format'

// La "actual": en curso, si no la próxima programada, si no la última
function pickCurrent(list) {
    const inProgress = list.find((m) => ['VIGENTE', 'POR_VENCER'].includes(m.status))
    if (inProgress) return inProgress
    const scheduled = list.filter((m) => m.status === 'PROGRAMADA').sort((a, b) => a.startDate.localeCompare(b.startDate))
    return scheduled[0] ?? list.find((m) => m.status !== 'CANCELADA') ?? list[0]
}

const MESSAGES = {
    VIGENTE: 'Tu membresía está al día.',
    POR_VENCER: 'Tu membresía está por vencer. Acordate de renovarla.',
    VENCIDA: 'Tu membresía venció. Consultá en recepción para renovarla.',
    PROGRAMADA: 'Tu membresía todavía no empezó.',
    CANCELADA: 'Esta membresía fue cancelada.',
}

export default function MyMembershipPage() {
    const { data, isLoading, isError, refetch } = useMyMemberships()

    if (isLoading) {
        return <Skeleton className="h-48 w-full" role="status" aria-label="Cargando" />
    }
    if (isError) return <ErrorState onRetry={refetch} />

    if (!data.length) {
        return (
            <>
                <PageHeader title="Mi membresía" />
                <EmptyState
                    icon={IdCard}
                    title="Todavía no tenés una membresía"
                    description="Consultá en recepción para dar de alta tu plan."
                />
            </>
        )
    }

    const current = pickCurrent(data)

    return (
        <>
            <PageHeader title="Mi membresía" description="Tu plan actual, vencimiento y pagos." />

            <Card className="mb-6">
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle className="text-xl">{current.plan.name}</CardTitle>
                        <div className="flex gap-2">
                            <StatusBadge status={current.status} />
                            {current.status !== 'CANCELADA' && <StatusBadge status={current.paymentStatus} />}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p className="text-sm">{MESSAGES[current.status]}</p>
                    <p className="text-sm text-muted-foreground">
                        Vigencia: {formatDate(current.startDate)} → {formatDate(current.endDate)} ·{' '}
                        {current.plan.daysPerWeek} días por semana
                    </p>
                    {current.status !== 'CANCELADA' && current.balance > 0 && (
                        <p className="text-sm font-medium" role="status">
                            Saldo pendiente: {formatCurrency(current.balance)}
                        </p>
                    )}
                </CardContent>
            </Card>

            <h2 className="mb-3 text-lg font-medium">Historial</h2>
            <MembershipHistory memberships={data} />
        </>
    )
}