import { Link } from 'react-router-dom'
import { AlertTriangle, BellRing, CalendarCheck, Coins, IdCard, UserCheck, Users, Wallet } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import PageHeader from '@/components/layout/PageHeader'
import ChartCard from '@/components/shared/ChartCard'
import ErrorState from '@/components/shared/ErrorState'
import StatCard from '@/components/shared/StatCard'
import StatusBadge from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminDashboard } from '@/hooks/useDashboard'
import { formatCurrency, formatDate } from '@/utils/format'

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const monthLabel = (ym) => MONTHS[Number(ym.slice(5, 7)) - 1]
const dayLabel = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}`

const config = (label) => ({ value: { label, color: 'var(--primary)' } })

function BarCard({ title, description, data, xKey, label, formatX, formatValue, emptyWhenZero = true }) {
    const rows = data.map((d) => ({ label: formatX ? formatX(d[xKey]) : d[xKey], value: formatValue ? formatValue(d.value) : d.value }))
    const isEmpty = emptyWhenZero && data.every((d) => d.value === 0)
    return (
        <ChartCard title={title} description={description} rows={rows} isEmpty={isEmpty}>
            <ChartContainer config={config(label)} className="h-56 w-full">
                <BarChart data={data.map((d) => ({ ...d, name: formatX ? formatX(d[xKey]) : d[xKey] }))}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
                    <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                </BarChart>
            </ChartContainer>
        </ChartCard>
    )
}

export default function AdminDashboard() {
    const { data, isLoading, isError, refetch } = useAdminDashboard()

    if (isError) return <ErrorState onRetry={refetch} />
    if (isLoading) {
        return (
            <div className="space-y-4" role="status" aria-label="Cargando panel">
                <Skeleton className="h-8 w-48" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 8 }, (_, i) => (
                        <Skeleton key={i} className="h-24" />
                    ))}
                </div>
                <Skeleton className="h-64" />
            </div>
        )
    }

    const { cards } = data

    return (
        <>
            <PageHeader title="Panel" description="Resumen del gimnasio." />

            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Socios activos" value={cards.activeMembers} icon={Users} />
                <StatCard title="Membresías vigentes" value={cards.activeMemberships} icon={IdCard} />
                <StatCard
                    title="Por vencer"
                    value={cards.expiring}
                    hint="En los próximos 7 días"
                    icon={BellRing}
                    tone={cards.expiring > 0 ? 'warning' : undefined}
                />
                <StatCard
                    title="Vencidas"
                    value={cards.expired}
                    icon={AlertTriangle}
                    tone={cards.expired > 0 ? 'danger' : undefined}
                />
                <StatCard title="Cobrado este mes" value={cards.collectedThisMonth} format={formatCurrency} icon={Coins} />
                <StatCard title="Deuda pendiente" value={cards.debt} format={formatCurrency}
                    hint="En membresías no canceladas"
                    icon={Wallet}
                    tone={cards.debt > 0 ? 'warning' : undefined}
                />
                <StatCard title="Ingresos de hoy" value={cards.checkInsToday} icon={UserCheck} />
                <StatCard title="Ingresos (30 días)" value={data.attendanceByDay.reduce((s, d) => s + d.count, 0)} icon={CalendarCheck} />
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-2">
                <BarCard
                    title="Cobrado por mes"
                    description="Últimos 6 meses, sin pagos anulados"
                    data={data.revenueByMonth.map((d) => ({ month: d.month, value: d.total }))}
                    xKey="month"
                    label="Cobrado"
                    formatX={monthLabel}
                    formatValue={formatCurrency}
                />
                <BarCard
                    title="Ingresos por día"
                    description="Últimos 30 días"
                    data={data.attendanceByDay.map((d) => ({ date: d.date, value: d.count }))}
                    xKey="date"
                    label="Ingresos"
                    formatX={dayLabel}
                />
                <BarCard
                    title="Hora pico"
                    description="Ingresos por hora del día, últimos 30 días"
                    data={data.attendanceByHour.map((d) => ({ hour: d.hour, value: d.count }))}
                    xKey="hour"
                    label="Ingresos"
                    formatX={(h) => `${h}h`}
                />
                <BarCard
                    title="Socios por plan"
                    description="Membresías en curso"
                    data={data.membersByPlan.map((d) => ({ plan: d.plan, value: d.count }))}
                    xKey="plan"
                    label="Socios"
                />
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Próximos vencimientos</CardTitle>
                    <Button asChild variant="outline" size="sm">
                        <Link to="/admin/vencimientos">Ver todos</Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {data.upcomingExpirations.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay membresías por vencer en los próximos 7 días.</p>
                    ) : (
                        <ul className="divide-y">
                            {data.upcomingExpirations.map((e) => (
                                <li key={e.membershipId} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                                    <div>
                                        <p className="font-medium">
                                            {e.member.lastName}, {e.member.firstName}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {e.planName} · vence el {formatDate(e.endDate)}
                                        </p>
                                    </div>
                                    <StatusBadge status={e.status} />
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </>
    )
}