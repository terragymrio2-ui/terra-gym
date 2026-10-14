import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import ErrorState from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyAttendances } from '@/hooks/useAttendances'
import { cn } from '@/lib/utils'
import { todayAR } from '@/utils/dates'

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const WEEKDAYS = [
    ['L', 'Lunes'], ['M', 'Martes'], ['M', 'Miércoles'], ['J', 'Jueves'],
    ['V', 'Viernes'], ['S', 'Sábado'], ['D', 'Domingo'],
]

function shiftMonth(ym, delta) {
    const [y, m] = ym.split('-').map(Number)
    const total = y * 12 + (m - 1) + delta
    return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`
}

// Semanas de lunes a domingo; null = celda vacía
function buildWeeks(ym) {
    const [y, m] = ym.split('-').map(Number)
    const offset = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7
    const days = new Date(Date.UTC(y, m, 0)).getUTCDate()
    const cells = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
    while (cells.length % 7) cells.push(null)
    return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7))
}

export default function MyAttendancesPage() {
    const today = todayAR()
    const currentMonth = today.slice(0, 7)
    const [month, setMonth] = useState(currentMonth)
    const { data, isLoading, isError, refetch } = useMyAttendances(month)

    if (isError) return <ErrorState onRetry={refetch} />

    const [year, monthNumber] = month.split('-').map(Number)
    const attended = new Set((data?.dates ?? []).map((d) => Number(d.slice(8, 10))))
    const todayDay = today.startsWith(month) ? Number(today.slice(8, 10)) : null
    const monthLabel = `${MONTHS[monthNumber - 1]} ${year}`

    return (
        <>
            <PageHeader title="Mis asistencias" description="Los días que viniste al gimnasio." />

            {data && data.weekLimit !== null && (
                <Card className="mb-6 max-w-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Esta semana</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-semibold tracking-tight">
                            {data.weekCount} <span className="text-lg font-normal text-muted-foreground">de {data.weekLimit} días</span>
                        </p>
                    </CardContent>
                </Card>
            )}

            <div className="mb-3 flex max-w-md items-center justify-between">
                <Button variant="outline" size="icon" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Mes anterior">
                    <ChevronLeft aria-hidden="true" />
                </Button>
                <h2 className="text-lg font-medium" aria-live="polite">
                    {monthLabel}
                </h2>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setMonth(shiftMonth(month, 1))}
                    disabled={month >= currentMonth}
                    aria-label="Mes siguiente"
                >
                    <ChevronRight aria-hidden="true" />
                </Button>
            </div>

            {isLoading ? (
                <Skeleton className="h-64 max-w-md" role="status" aria-label="Cargando calendario" />
            ) : (
                <table className="w-full max-w-md table-fixed border-separate border-spacing-1 text-center">
                    <caption className="sr-only">Asistencias de {monthLabel}</caption>
                    <thead>
                        <tr>
                            {WEEKDAYS.map(([short, full]) => (
                                <th key={full} scope="col" className="pb-1 text-xs font-medium text-muted-foreground">
                                    <abbr title={full} className="no-underline">
                                        {short}
                                    </abbr>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {buildWeeks(month).map((week, i) => (
                            <tr key={i}>
                                {week.map((day, j) => (
                                    <td key={j} className="p-0">
                                        {day && (
                                            <div
                                                aria-label={`${day} de ${MONTHS[monthNumber - 1]}${attended.has(day) ? ', asististe' : ''}${day === todayDay ? ', hoy' : ''}`}
                                                className={cn(
                                                    'grid aspect-square place-items-center rounded-md text-sm',
                                                    attended.has(day) ? 'bg-primary font-semibold text-primary-foreground' : 'bg-muted/40',
                                                    day === todayDay && 'ring-2 ring-ring ring-offset-1',
                                                )}
                                            >
                                                {day}
                                            </div>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {data && (
                <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
                    {attended.size === 0
                        ? 'No registraste asistencias este mes.'
                        : `Asististe ${attended.size} ${attended.size === 1 ? 'día' : 'días'} en ${monthLabel}.`}
                </p>
            )}
        </>
    )
}