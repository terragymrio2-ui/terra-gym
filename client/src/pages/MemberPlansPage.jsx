import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, FilePlus, History, MoreHorizontal, Pencil, Send } from 'lucide-react'
import AssignTemplateDialog from '@/components/forms/AssignTemplateDialog'
import MemberPlansSheet from '@/components/forms/MemberPlansSheet'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import Pagination from '@/components/shared/Pagination'
import SearchInput from '@/components/shared/SearchInput'
import DataTable from '@/components/tables/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useOverview } from '@/hooks/useTrainingPlans'
import { formatDate } from '@/utils/format'

const PAGE_SIZE = 10

const asTarget = (u) => ({ id: u.id, name: `${u.firstName} ${u.lastName}`, hasPlan: !!u.activePlan })

function RowActions({ member, onAssign, onCreate, onEdit, onHistory }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Acciones para ${member.firstName} ${member.lastName}`}>
                    <MoreHorizontal aria-hidden="true" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onAssign([asTarget(member)])}>
                    <Send aria-hidden="true" /> Asignar plantilla
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onCreate(member)}>
                    <FilePlus aria-hidden="true" /> Armar desde cero
                </DropdownMenuItem>
                {member.activePlan && (
                    <DropdownMenuItem onSelect={() => onEdit(member.activePlan)}>
                        <Pencil aria-hidden="true" /> Ver / editar rutina activa
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => onHistory(member)}>
                    <History aria-hidden="true" /> Historial de rutinas
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function PlanCell({ member }) {
    if (!member.activePlan) return <Badge variant="secondary">Sin rutina</Badge>
    return (
        <div>
            <p className="text-sm">{member.activePlan.name}</p>
            <p className="text-xs text-muted-foreground">Desde {formatDate(member.activePlan.startDate)}</p>
        </div>
    )
}

export default function MemberPlansPage() {
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('all')
    const [page, setPage] = useState(1)
    const [selected, setSelected] = useState(() => new Map()) // id → destino de asignación
    const [assignTo, setAssignTo] = useState(null)
    const [historyOf, setHistoryOf] = useState(null)

    const { data, isLoading, isError, refetch } = useOverview({
        search: search || undefined,
        hasPlan: filter === 'all' ? undefined : filter,
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

    function toggleSelected(member) {
        setSelected((prev) => {
            const next = new Map(prev)
            if (next.has(member.id)) next.delete(member.id)
            else next.set(member.id, asTarget(member))
            return next
        })
    }

    const check = (u) => (
        <Checkbox
            checked={selected.has(u.id)}
            onCheckedChange={() => toggleSelected(u)}
            aria-label={`Seleccionar a ${u.firstName} ${u.lastName}`}
        />
    )

    const actionsFor = (u) => (
        <RowActions
            member={u}
            onAssign={setAssignTo}
            onCreate={(m) => navigate(`/socios-rutinas/${m.id}/nueva`)}
            onEdit={(plan) => navigate(`/socios-rutinas/rutina/${plan.id}`)}
            onHistory={setHistoryOf}
        />
    )

    const columns = [
        { header: 'Seleccionar', srOnly: true, className: 'w-10', cell: check },
        {
            header: 'Socio',
            cell: (u) => (
                <div>
                    <p className="font-medium">
                        {u.lastName}, {u.firstName}
                    </p>
                    <p className="text-xs text-muted-foreground">DNI {u.dni ?? '—'}</p>
                </div>
            ),
        },
        { header: 'Rutina activa', cell: (u) => <PlanCell member={u} /> },
        { header: 'Acciones', srOnly: true, className: 'w-12 text-right', cell: actionsFor },
    ]

    const renderCard = (u) => (
        <div className="flex items-start gap-3">
            <div className="pt-1">{check(u)}</div>
            <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium">
                    {u.lastName}, {u.firstName}
                </p>
                <PlanCell member={u} />
            </div>
            {actionsFor(u)}
        </div>
    )

    const hasFilters = !!search || filter !== 'all'

    return (
        <>
            <PageHeader
                title="Socios y rutinas"
                description="Asigná una plantilla a uno o varios socios, o armá una rutina a medida."
            />

            <div className="mb-4 flex flex-wrap gap-3">
                <SearchInput
                    value={search}
                    onChange={handleSearch}
                    placeholder="Buscar por nombre o DNI"
                    label="Buscar socios"
                    className="w-full sm:max-w-xs"
                />
                <Select
                    value={filter}
                    onValueChange={(v) => {
                        setFilter(v)
                        setPage(1)
                    }}
                >
                    <SelectTrigger className="w-full sm:w-48" aria-label="Filtrar por rutina">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="without">Sin rutina</SelectItem>
                        <SelectItem value="with">Con rutina</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {selected.size > 0 && (
                <div
                    role="status"
                    className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/50 p-3"
                >
                    <p className="text-sm font-medium">
                        {selected.size} {selected.size === 1 ? 'socio seleccionado' : 'socios seleccionados'}
                    </p>
                    <div className="flex gap-2">
                        <Button size="sm" onClick={() => setAssignTo([...selected.values()])}>
                            <Send aria-hidden="true" /> Asignar plantilla
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setSelected(new Map())}>
                            Limpiar
                        </Button>
                    </div>
                </div>
            )}

            <DataTable
                columns={columns}
                rows={data?.items}
                getRowId={(u) => u.id}
                renderCard={renderCard}
                isLoading={isLoading}
                isError={isError}
                onRetry={refetch}
                empty={
                    <EmptyState
                        icon={ClipboardCheck}
                        title={hasFilters ? 'No se encontraron socios' : 'Todavía no hay socios activos'}
                        description={
                            hasFilters ? 'Probá con otra búsqueda o cambiá el filtro.' : 'Creá socios desde la sección Socios.'
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

            <AssignTemplateDialog
                members={assignTo}
                onClose={() => setAssignTo(null)}
                onDone={() => setSelected(new Map())}
            />
            <MemberPlansSheet member={historyOf} onClose={() => setHistoryOf(null)} />
        </>
    )
}