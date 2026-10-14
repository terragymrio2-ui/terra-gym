import { Link } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import ErrorState from '@/components/shared/ErrorState'
import PendingAnnouncements from '@/components/shared/PendingAnnouncements'
import StatusBadge from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { useMemberDashboard } from '@/hooks/useDashboard'
import { formatCurrency, formatDate } from '@/utils/format'

export default function MemberDashboard() {
    const { user } = useAuth()
    const { data, isLoading, isError, refetch } = useMemberDashboard()

    return (
        <>
            <PendingAnnouncements />
            <PageHeader title={`Hola, ${user.firstName}`} description="Tu resumen en el gimnasio." />

            {isError && <ErrorState onRetry={refetch} />}
            {isLoading && <Skeleton className="h-48 w-full" role="status" aria-label="Cargando" />}

            {data && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Mi membresía</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            {data.membership ? (
                                <>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-medium">{data.membership.planName}</span>
                                        <StatusBadge status={data.membership.status} />
                                    </div>
                                    <p className="text-muted-foreground">Vence el {formatDate(data.membership.endDate)}</p>
                                    {data.membership.balance > 0 && data.membership.status !== 'CANCELADA' && (
                                        <p className="font-medium">Saldo pendiente: {formatCurrency(data.membership.balance)}</p>
                                    )}
                                </>
                            ) : (
                                <p className="text-muted-foreground">Todavía no tenés una membresía.</p>
                            )}
                            <Button asChild variant="outline" size="sm">
                                <Link to="/socio/membresia">Ver detalle</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Esta semana</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p className="text-3xl font-semibold tracking-tight">
                                {data.weekCount}
                                {data.membership && (
                                    <span className="text-lg font-normal text-muted-foreground">
                                        {' '}
                                        de {data.membership.daysPerWeek} días
                                    </span>
                                )}
                            </p>
                            <Button asChild variant="outline" size="sm">
                                <Link to="/socio/asistencias">Mis asistencias</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Mi rutina</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            {data.activePlan ? (
                                <p className="font-medium">{data.activePlan.name}</p>
                            ) : (
                                <p className="text-muted-foreground">Tu profesor todavía no te asignó una rutina.</p>
                            )}
                            {data.activePlan && (
                                <Button asChild variant="outline" size="sm">
                                    <Link to="/socio/rutina">Ver rutina</Link>
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </>
    )
}