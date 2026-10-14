import { useCallback, useEffect, useState } from 'react'
import { Ban, IdCard, MoreHorizontal, Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import MembershipFormSheet from '@/components/forms/MembershipFormSheet'
import PageHeader from '@/components/layout/PageHeader'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import EmptyState from '@/components/shared/EmptyState'
import Pagination from '@/components/shared/Pagination'
import SearchInput from '@/components/shared/SearchInput'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMembershipMutations, useMemberships } from '@/hooks/useMemberships'
import { getErrorMessage } from '@/services/api'
import { formatCurrency, formatDate } from '@/utils/format'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Eye } from 'lucide-react'
import MemberMembershipsSheet from '@/components/forms/MemberMembershipsSheet'

const PAGE_SIZE = 10

const STATUS_OPTIONS = [
    ['all', 'Todos los estados'],
    ['VIGENTE', 'Vigentes'],
    ['POR_VENCER', 'Por vencer'],
    ['VENCIDA', 'Vencidas'],
    ['PROGRAMADA', 'Programadas'],
    ['CANCELADA', 'Canceladas'],
]

const PAYMENT_OPTIONS = [
    ['all', 'Todos los pagos'],
    ['PENDIENTE', 'Sin pagar'],
    ['PARCIAL', 'Pago parcial'],
    ['PAGADA', 'Pagadas'],
]


function FilterSelect({ value, onChange, options, label }) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-full sm:w-48" aria-label={label}>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {options.map(([v, text]) => (
                    <SelectItem key={v} value={v}>
                        {text}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

function PaymentCell({ m }) {
    if (m.status === 'CANCELADA') return <span className="text-muted-foreground">—</span>
    return (
        <div className="space-y-1">
            <StatusBadge status={m.paymentStatus} />
            {m.balance > 0 && (
                <p className="text-xs text-muted-foreground">Debe {formatCurrency(m.balance)}</p>
            )}
        </div>
    )
}

function RowActions({ membership, onRenew, onCancel, onDetail }) {
    const name = `${membership.member.firstName} ${membership.member.lastName}`
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Acciones de la membresía de ${name}`}>
                    <MoreHorizontal aria-hidden="true" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onDetail(membership.member)}>
                    <Eye aria-hidden="true" /> Ver detalles
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onRenew(membership.member)}>
                    <RefreshCw aria-hidden="true" /> Renovar
                </DropdownMenuItem>
                {membership.status !== 'CANCELADA' && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={() => onCancel(membership)}
                            className="text-destructive focus:text-destructive"
                        >
                            <Ban aria-hidden="true" /> Cancelar membresía
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default function MembershipsPage() {
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('all')
    const [paymentStatus, setPaymentStatus] = useState('all')
    const [showHistory, setShowHistory] = useState(false)   // ← acá
    const [page, setPage] = useState(1)
    const [sheet, setSheet] = useState({ open: false, member: null })
    const [toCancel, setToCancel] = useState(null)

    const { cancel } = useMembershipMutations()
    const { data, isLoading, isError, refetch } = useMemberships({
        search: search || undefined,
        status: status === 'all' ? undefined : status,
        paymentStatus: paymentStatus === 'all' ? undefined : paymentStatus,
        current: !showHistory,
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

    const hasFilters = !!search || status !== 'all' || paymentStatus !== 'all'
    const openCreate = (member = null) => setSheet({ open: true, member })

    async function handleCancel() {
        try {
            await cancel.mutateAsync(toCancel.id)
            toast.success('Membresía cancelada')
            setToCancel(null)
        } catch (error) {
            toast.error(getErrorMessage(error))
        }
    }
    const [detailMember, setDetailMember] = useState(null)
    const actionsFor = (m) => (
        <RowActions membership={m} onDetail={setDetailMember} onRenew={openCreate} onCancel={setToCancel} />
    )


    const columns = [
        {
            header: 'Socio',
            cell: (m) => (
                <div>
                    <p className="font-medium">
                        {m.member.lastName}, {m.member.firstName}
                    </p>
                    <p className="text-xs text-muted-foreground">DNI {m.member.dni ?? '—'}</p>
                </div>
            ),
        },
        {
            header: 'Plan',
            cell: (m) => (
                <div>
                    <p>{m.plan.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(m.price)}</p>
                </div>
            ),
        },
        {
            header: 'Vigencia',
            cell: (m) => `${formatDate(m.startDate)} → ${formatDate(m.endDate)}`,
        },
        { header: 'Estado', cell: (m) => <StatusBadge status={m.status} /> },
        { header: 'Pago', cell: (m) => <PaymentCell m={m} /> },
        { header: 'Acciones', srOnly: true, className: 'w-12 text-right', cell: actionsFor },
    ]

    const renderCard = (m) => (
        <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1.5">
                <p className="font-medium">
                    {m.member.lastName}, {m.member.firstName}
                </p>
                <p className="text-sm">
                    {m.plan.name} · {formatCurrency(m.price)}
                </p>
                <p className="text-xs text-muted-foreground">
                    {formatDate(m.startDate)} → {formatDate(m.endDate)}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={m.status} />
                    {m.status !== 'CANCELADA' && <StatusBadge status={m.paymentStatus} />}
                </div>
                {m.status !== 'CANCELADA' && m.balance > 0 && (
                    <p className="text-xs text-muted-foreground">Debe {formatCurrency(m.balance)}</p>
                )}
            </div>
            {actionsFor(m)}
        </div>
    )

    return (
        <>
            <PageHeader
                title="Membresías"
                description={
                    showHistory
                        ? 'Todas las membresías, incluyendo renovaciones y períodos anteriores.'
                        : 'Membresía actual de cada socio. Activá el historial para ver todos los períodos.'
                }
                actions={
                    <Button onClick={() => openCreate()}>
                        <Plus aria-hidden="true" /> Nueva membresía
                    </Button>
                }
            />

            <div className="mb-4 flex flex-wrap gap-3">
                <SearchInput
                    value={search}
                    onChange={handleSearch}
                    placeholder="Buscar por nombre o DNI"
                    label="Buscar membresías"
                    className="w-full sm:max-w-xs"
                />
                <FilterSelect
                    value={status}
                    onChange={(v) => {
                        setStatus(v)
                        setPage(1)
                    }}
                    options={STATUS_OPTIONS}
                    label="Filtrar por estado"
                />
                <FilterSelect
                    value={paymentStatus}
                    onChange={(v) => {
                        setPaymentStatus(v)
                        setPage(1)
                    }}
                    options={PAYMENT_OPTIONS}
                    label="Filtrar por estado de pago"
                />
                <div className="flex items-center gap-2">
                    <Switch
                        id="history"
                        checked={showHistory}
                        onCheckedChange={(v) => {
                            setShowHistory(v)
                            setPage(1)
                        }}
                    />
                    <Label htmlFor="history" className="cursor-pointer">
                        Ver historial completo
                    </Label>
                </div>
            </div>

            <DataTable
                columns={columns}
                rows={data?.items}
                getRowId={(m) => m.id}
                renderCard={renderCard}
                isLoading={isLoading}
                isError={isError}
                onRetry={refetch}
                empty={
                    <EmptyState
                        icon={IdCard}
                        title={hasFilters ? 'No se encontraron membresías' : 'Todavía no hay membresías'}
                        description={
                            hasFilters
                                ? 'Probá con otra búsqueda o cambiá los filtros.'
                                : 'Creá la primera para empezar a controlar vencimientos.'
                        }
                        action={
                            !hasFilters && (
                                <Button onClick={() => openCreate()}>
                                    <Plus aria-hidden="true" /> Nueva membresía
                                </Button>
                            )
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

            <MembershipFormSheet
                open={sheet.open}
                onOpenChange={(open) => setSheet((s) => ({ ...s, open }))}
                initialMember={sheet.member}
            />
            <MemberMembershipsSheet member={detailMember} onClose={() => setDetailMember(null)} />

            <ConfirmDialog
                open={!!toCancel}
                onOpenChange={(open) => !open && setToCancel(null)}
                title="¿Cancelar esta membresía?"
                description="Se da de baja y deja de contar como vigente. No se devuelve dinero ni se anulan los pagos ya registrados."
                confirmLabel="Cancelar membresía"
                destructive
                loading={cancel.isPending}
                onConfirm={handleCancel}
            />
        </>
    )

}