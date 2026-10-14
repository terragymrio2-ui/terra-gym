import { useCallback, useEffect, useState } from 'react'
import { BellRing, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import Pagination from '@/components/shared/Pagination'
import SearchInput from '@/components/shared/SearchInput'
import StatusBadge from '@/components/shared/StatusBadge'
import DataTable from '@/components/tables/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useExpirations, useLogWhatsapp } from '@/hooks/useNotifications'
import { getErrorMessage } from '@/services/api'
import { formatCurrency, formatDate } from '@/utils/format'
import { buildReminderMessage, buildWhatsAppUrl } from '@/utils/whatsapp'

const PAGE_SIZE = 10

function daysText(n) {
    if (n === 0) return 'Vence hoy'
    if (n === 1) return 'Vence mañana'
    if (n > 1) return `Vence en ${n} días`
    if (n === -1) return 'Venció ayer'
    return `Venció hace ${-n} días`
}

function WhatsAppButton({ item }) {
    const log = useLogWhatsapp()
    const { member } = item
    const text = buildReminderMessage({
        firstName: member.firstName,
        planName: item.planName,
        endDate: item.endDate,
        expired: item.status === 'VENCIDA',
        balance: item.balance,
    })
    const hasPhone = !!member.phone?.trim().startsWith('+')

    return (
        <div className="space-y-1">
            <Button asChild size="sm" variant="outline">
                <a
                    href={buildWhatsAppUrl({ phone: member.phone, text })}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Avisar por WhatsApp a ${member.firstName} ${member.lastName} (se abre en una pestaña nueva)`}
                    // El link se abre normalmente; el registro del aviso corre aparte en segundo plano
                    onClick={() =>
                        log.mutate(item.membershipId, { onError: (e) => toast.error(getErrorMessage(e)) })
                    }
                >
                    <MessageCircle aria-hidden="true" /> WhatsApp
                </a>
            </Button>
            {!hasPhone && (
                <p className="text-xs text-muted-foreground">Sin teléfono internacional: elegís el contacto a mano.</p>
            )}
        </div>
    )
}

function NoticeCell({ item }) {
    if (!item.notifiedAt) return <Badge variant="secondary">Sin avisar</Badge>
    return (
        <Badge variant="secondary" className="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
            Chat abierto el {formatDate(item.notifiedAt)}
        </Badge>
    )
}

function SummaryCard({ title, value }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-semibold tracking-tight" aria-live="polite">
                    {value}
                </p>
            </CardContent>
        </Card>
    )
}

export default function ExpirationsPage() {
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('all')
    const [notified, setNotified] = useState('all')
    const [page, setPage] = useState(1)

    const { data, isLoading, isError, refetch } = useExpirations({
        search: search || undefined,
        status: status === 'all' ? undefined : status,
        notified: notified === 'all' ? undefined : notified,
        page,
        limit: PAGE_SIZE,
    })

    const handleSearch = useCallback((value) => {
        setSearch(value)
        setPage(1)
    }, [])

    const totalPages = data?.pagination.totalPages ?? 1
    useEffect(() => {
        if (data && page > totalPages) setPage(Math.max(1, totalPages))
    }, [data, page, totalPages])

    const hasFilters = !!search || status !== 'all' || notified !== 'all'

    const columns = [
        {
            header: 'Socio',
            cell: (i) => (
                <div>
                    <p className="font-medium">
                        {i.member.lastName}, {i.member.firstName}
                    </p>
                    <p className="text-xs text-muted-foreground">{i.member.phone ?? 'Sin teléfono'}</p>
                </div>
            ),
        },
        { header: 'Plan', cell: (i) => i.planName },
        {
            header: 'Vencimiento',
            cell: (i) => (
                <div>
                    <p>{formatDate(i.endDate)}</p>
                    <p className="text-xs text-muted-foreground">{daysText(i.daysLeft)}</p>
                </div>
            ),
        },
        { header: 'Estado', cell: (i) => <StatusBadge status={i.status} /> },
        {
            header: 'Deuda',
            cell: (i) => (i.balance > 0 ? formatCurrency(i.balance) : <span className="text-muted-foreground">—</span>),
        },
        { header: 'Aviso', cell: (i) => <NoticeCell item={i} /> },
        { header: 'Acciones', srOnly: true, className: 'w-44', cell: (i) => <WhatsAppButton item={i} /> },
    ]

    const renderCard = (i) => (
        <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="font-medium">
                        {i.member.lastName}, {i.member.firstName}
                    </p>
                    <p className="text-xs text-muted-foreground">{i.planName}</p>
                </div>
                <StatusBadge status={i.status} />
            </div>
            <p className="text-sm">
                {formatDate(i.endDate)} · <span className="text-muted-foreground">{daysText(i.daysLeft)}</span>
            </p>
            {i.balance > 0 && <p className="text-sm">Debe {formatCurrency(i.balance)}</p>}
            <NoticeCell item={i} />
            <WhatsAppButton item={i} />
        </div>
    )

    return (
        <>
            <PageHeader
                title="Vencimientos"
                description="Socios con la membresía por vencer o recién vencida, y el aviso por WhatsApp."
            />

            <div className="mb-4 grid max-w-md grid-cols-2 gap-3">
                <SummaryCard title="Por vencer (7 días)" value={data?.summary.expiring ?? 0} />
                <SummaryCard title="Vencidas (60 días)" value={data?.summary.expired ?? 0} />
            </div>

            <div className="mb-4 flex flex-wrap gap-3">
                <SearchInput
                    value={search}
                    onChange={handleSearch}
                    placeholder="Buscar por nombre o DNI"
                    label="Buscar vencimientos"
                    className="w-full sm:max-w-xs"
                />
                <Select
                    value={status}
                    onValueChange={(v) => {
                        setStatus(v)
                        setPage(1)
                    }}
                >
                    <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar por estado">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="POR_VENCER">Por vencer</SelectItem>
                        <SelectItem value="VENCIDA">Vencidas</SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    value={notified}
                    onValueChange={(v) => {
                        setNotified(v)
                        setPage(1)
                    }}
                >
                    <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar por aviso">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Con o sin aviso</SelectItem>
                        <SelectItem value="no">Sin avisar</SelectItem>
                        <SelectItem value="yes">Chat abierto</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <DataTable
                columns={columns}
                rows={data?.items}
                getRowId={(i) => i.membershipId}
                renderCard={renderCard}
                isLoading={isLoading}
                isError={isError}
                onRetry={refetch}
                empty={
                    <EmptyState
                        icon={BellRing}
                        title={hasFilters ? 'No se encontraron socios' : 'No hay vencimientos pendientes'}
                        description={
                            hasFilters ? 'Probá con otra búsqueda o cambiá los filtros.' : 'Todos los socios están al día.'
                        }
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