import { useCallback, useEffect, useState } from 'react'
import { Ban, CalendarCheck } from 'lucide-react'
import VoidAttendanceDialog from '@/components/forms/VoidAttendanceDialog'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import Pagination from '@/components/shared/Pagination'
import SearchInput from '@/components/shared/SearchInput'
import DataTable from '@/components/tables/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAttendances } from '@/hooks/useAttendances'
import { useAuth } from '@/hooks/useAuth'
import { OVERRIDE_LABELS } from '@/utils/attendance'
import { todayAR } from '@/utils/dates'
import { formatDate, formatTime } from '@/utils/format'

const PAGE_SIZE = 15

function StateCell({ a }) {
    if (a.isVoided) {
        return (
            <div>
                <Badge variant="secondary">Anulado</Badge>
                <p className="mt-1 text-xs text-muted-foreground">{a.voidReason}</p>
            </div>
        )
    }
    if (a.override) {
        return (
            <Badge variant="secondary" className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                Excepción: {a.overrideReasons.map((r) => OVERRIDE_LABELS[r] ?? r).join(', ')}
            </Badge>
        )
    }
    return (
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Válido
        </Badge>
    )
}

export default function AttendancesPage() {
    const { user } = useAuth()
    const isAdmin = user.role === 'ADMIN'
    const [from, setFrom] = useState(todayAR)
    const [to, setTo] = useState(todayAR)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [toVoid, setToVoid] = useState(null)

    const invalidRange = !!from && !!to && from > to
    const { data, isLoading, isError, refetch } = useAttendances(
        { from: from || undefined, to: to || undefined, search: search || undefined, page, limit: PAGE_SIZE },
        { enabled: !invalidRange },
    )

    const handleSearch = useCallback((value) => {
        setSearch(value)
        setPage(1)
    }, [])

    const totalPages = data?.pagination.totalPages ?? 1
    useEffect(() => {
        if (data && page > totalPages) setPage(Math.max(1, totalPages))
    }, [data, page, totalPages])

    const voidButton = (a) =>
        isAdmin && !a.isVoided ? (
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setToVoid(a)}
                aria-label={`Anular ingreso de ${a.member.firstName} ${a.member.lastName}`}
            >
                <Ban aria-hidden="true" /> Anular
            </Button>
        ) : null

    const columns = [
        {
            header: 'Fecha y hora',
            cell: (a) => (
                <span className={a.isVoided ? 'text-muted-foreground line-through' : ''}>
                    {formatDate(a.date)} · {formatTime(a.checkedInAt)} hs
                </span>
            ),
        },
        {
            header: 'Socio',
            cell: (a) => (
                <div>
                    <p className="font-medium">
                        {a.member.lastName}, {a.member.firstName}
                    </p>
                    <p className="text-xs text-muted-foreground">DNI {a.member.dni ?? '—'}</p>
                </div>
            ),
        },
        { header: 'Registrado por', cell: (a) => `${a.registeredBy.firstName} ${a.registeredBy.lastName}` },
        { header: 'Estado', cell: (a) => <StateCell a={a} /> },
        ...(isAdmin ? [{ header: 'Acciones', srOnly: true, className: 'w-28 text-right', cell: voidButton }] : []),
    ]

    const renderCard = (a) => (
        <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-2">
                <p className="font-medium">
                    {a.member.lastName}, {a.member.firstName}
                </p>
                {voidButton(a)}
            </div>
            <p className="text-xs text-muted-foreground">
                {formatDate(a.date)} · {formatTime(a.checkedInAt)} hs · {a.registeredBy.firstName}
            </p>
            <StateCell a={a} />
        </div>
    )

    return (
        <>
            <PageHeader title="Asistencias" description="Historial de ingresos al gimnasio." />

            <Card className="mb-4 max-w-xs">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos válidos</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-semibold tracking-tight" aria-live="polite">
                        {data?.validCount ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground">En el período elegido, sin contar anulados</p>
                </CardContent>
            </Card>

            <div className="mb-4 flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                    <Label htmlFor="from">Desde</Label>
                    <Input
                        id="from"
                        type="date"
                        value={from}
                        max={to || undefined}
                        onChange={(e) => {
                            setFrom(e.target.value)
                            setPage(1)
                        }}
                        className="w-44"
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="to">Hasta</Label>
                    <Input
                        id="to"
                        type="date"
                        value={to}
                        min={from || undefined}
                        onChange={(e) => {
                            setTo(e.target.value)
                            setPage(1)
                        }}
                        className="w-44"
                    />
                </div>
                <SearchInput
                    value={search}
                    onChange={handleSearch}
                    placeholder="Buscar por nombre o DNI"
                    label="Buscar ingresos por socio"
                    className="w-full sm:max-w-xs"
                />
            </div>

            {invalidRange && (
                <p role="alert" className="mb-4 text-sm text-destructive">
                    La fecha "Desde" no puede ser posterior a "Hasta".
                </p>
            )}

            <DataTable
                columns={columns}
                rows={invalidRange ? [] : data?.items}
                getRowId={(a) => a.id}
                renderCard={renderCard}
                isLoading={isLoading && !invalidRange}
                isError={isError}
                onRetry={refetch}
                empty={
                    <EmptyState
                        icon={CalendarCheck}
                        title="No hay ingresos en este período"
                        description="Probá ampliando el rango de fechas o cambiando la búsqueda."
                    />
                }
            />

            <Pagination
                page={page}
                totalPages={totalPages}
                total={data?.pagination.total ?? 0}
                onPageChange={setPage}
            />

            <VoidAttendanceDialog attendance={toVoid} onClose={() => setToVoid(null)} />
        </>
    )
}