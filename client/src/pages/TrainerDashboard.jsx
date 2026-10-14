import { Link } from 'react-router-dom'
import { CalendarCheck, ClipboardCheck, ClipboardList, UserCheck, Users } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import ErrorState from '@/components/shared/ErrorState'
import StatCard from '@/components/shared/StatCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useTrainerDashboard } from '@/hooks/useDashboard'
import { useAuth } from '@/hooks/useAuth'

export default function TrainerDashboard() {
    const { user } = useAuth()
    const { data, isLoading, isError, refetch } = useTrainerDashboard()

    if (isError) return <ErrorState onRetry={refetch} />
    if (isLoading) return <Skeleton className="h-48 w-full" role="status" aria-label="Cargando panel" />

    const { cards } = data
    return (
        <>
            <PageHeader title={`Hola, ${user.firstName}`} description="Resumen de tu trabajo." />

            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Socios activos" value={cards.activeMembers} icon={Users} />
                <StatCard
                    title="Con rutina"
                    value={cards.withPlan}
                    icon={ClipboardCheck}
                />
                <StatCard
                    title="Sin rutina"
                    value={cards.withoutPlan}
                    hint="Esperan que les asignes una"
                    icon={ClipboardList}
                    tone={cards.withoutPlan > 0 ? 'warning' : undefined}
                />
                <StatCard title="Plantillas" value={cards.templates} icon={ClipboardList} />
                <StatCard title="Ingresos de hoy" value={cards.checkInsToday} icon={UserCheck} />
                <StatCard title="Ingresos esta semana" value={cards.checkInsThisWeek} icon={CalendarCheck} />
            </div>

            <div className="flex flex-wrap gap-2">
                <Button asChild>
                    <Link to="/socios-rutinas">Socios y rutinas</Link>
                </Button>
                <Button asChild variant="outline">
                    <Link to="/recepcion">Recepción</Link>
                </Button>
            </div>
        </>
    )
}