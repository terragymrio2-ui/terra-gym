import { useEffect, useState } from 'react'
import { Receipt } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import Pagination from '@/components/shared/Pagination'
import DataTable from '@/components/tables/DataTable'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePayments } from '@/hooks/usePayments'
import { todayAR } from '@/utils/dates'
import { formatCurrency, formatDate } from '@/utils/format'
import { PAYMENT_METHODS } from '@/utils/payments'

const PAGE_SIZE = 10

// Primer día del mes en curso
const monthStart = () => `${todayAR().slice(0, 8)}01`

export default function PaymentsPage() {
    const [from, setFrom] = useState(monthStart)
    const [to, setTo] = useState(todayAR)
    const [method, setMethod] = useState('all')
    const [page, setPage] = useState(1)

    const invalidRange = !!from && !!to && from > to
    const { data, isLoading, isError, refetch } = usePayments({
        from: from || undefined,
        to: to || undefined,
        method: method === 'all' ? undefined : method,
        page,
        limit: PAGE_SIZE,
    })

    const totalPages = data?.pagination.totalPages ?? 1
    useEffect(() => {
        if (data && page > totalPages) setPage(Math.max(1, totalPages))
    }, [data, page, totalPages])

    const columns = [
        { header: 'Fecha', cell: (p) => formatDate(p.paidAt) },
        {
            header: 'Socio',
            cell: (p) => (
                <div>
                    <p className="font-medium">
                        {p.member.lastName}, {p.member.firstName}
                    </p>
                    <p className="text-xs text-muted-foreground">{p.planName}</p>
                </div>
            ),
        },
        { header: 'Medio', cell: (p) => PAYMENT_METHODS[p.method] },
        {
            header: 'Monto',
            cell: (p) => (
                <span className={p.isVoided ? 'text-muted-foreground line-through' : 'font-medium'}>
                    {formatCurrency(p.amount)}
                </span>
            ),
        },
        {
            header: 'Estado',
            cell: (p) =>
                p.isVoided ? (
                    <div>
                        <Badge variant="secondary">Anulado</Badge>
                        <p className="mt-1 text-xs text-muted-foreground">{p.voidReason}</p>
                    </div>
                ) : (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Válido
                    </Badge>
                ),
        },
    ]

    const renderCard = (p) => (
        <div className="space-y-1">
            <div className="flex justify-between gap-2">
                <p className="font-medium">
                    {p.member.lastName}, {p.member.firstName}
                </p>
                <span className={p.isVoided ? 'text-muted-foreground line-through' : 'font-medium'}>
                    {formatCurrency(p.amount)}
                </span>
            </div>
            <p className="text-xs text-muted-foreground">
                {formatDate(p.paidAt)} · {PAYMENT_METHODS[p.method]} · {p.planName}
            </p>
            {p.isVoided && <Badge variant="secondary">Anulado: {p.voidReason}</Badge>}
        </div>
    )

    return (
        <>
            <PageHeader title="Pagos" description="Cobros registrados en el período elegido." />

            <Card className="mb-4 max-w-xs">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total cobrado</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-semibold tracking-tight" aria-live="polite">
                        {formatCurrency(data?.collected ?? 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Sin contar pagos anulados</p>
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
                <Select
                    value={method}
                    onValueChange={(v) => {
                        setMethod(v)
                        setPage(1)
                    }}
                >
                    <SelectTrigger className="w-full sm:w-48" aria-label="Filtrar por medio de pago">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los medios</SelectItem>
                        {Object.entries(PAYMENT_METHODS).map(([v, label]) => (
                            <SelectItem key={v} value={v}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {invalidRange && (
                <p role="alert" className="mb-4 text-sm text-destructive">
                    La fecha "Desde" no puede ser posterior a "Hasta".
                </p>
            )}

            <DataTable
                columns={columns}
                rows={invalidRange ? [] : data?.items}
                getRowId={(p) => p.id}
                renderCard={renderCard}
                isLoading={isLoading}
                isError={isError}
                onRetry={refetch}
                empty={
                    <EmptyState
                        icon={Receipt}
                        title="No hay pagos en este período"
                        description="Probá ampliando el rango de fechas o cambiando el medio de pago."
                    />
                }
            />

            <Pagination
                page={page}
                totalPages={totalPages}
                total={data?.pagination.total ?? 0}
                onPageChange={setPage}
            />
        </>
    )
}