import { useCallback, useEffect, useState } from 'react'
import { Dumbbell, ExternalLink, Eye, EyeOff, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import ExerciseFormSheet from '@/components/forms/ExerciseFormSheet'
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
import { useExerciseMutations, useExercises } from '@/hooks/useExercises'
import { getErrorMessage } from '@/services/api'
import { MUSCLE_GROUPS } from '@/utils/exercises'

const PAGE_SIZE = 10

function VideoLink({ exercise }) {
    if (!exercise.videoUrl) return <span className="text-muted-foreground">—</span>
    return (
        <a
            href={exercise.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Ver video de ${exercise.name} (se abre en una pestaña nueva)`}
            className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
        >
            Ver video <ExternalLink className="size-3" aria-hidden="true" />
        </a>
    )
}

function RowActions({ exercise, onEdit, onToggle, onDelete }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Acciones para ${exercise.name}`}>
                    <MoreHorizontal aria-hidden="true" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onEdit(exercise)}>
                    <Pencil aria-hidden="true" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onToggle(exercise)}>
                    {exercise.isActive ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                    {exercise.isActive ? 'Ocultar' : 'Volver a mostrar'}
                </DropdownMenuItem>
                {!exercise.inUse && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={() => onDelete(exercise)}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 aria-hidden="true" /> Eliminar
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default function ExercisesPage() {
    const [search, setSearch] = useState('')
    const [group, setGroup] = useState('all')
    const [visibility, setVisibility] = useState('true') // por defecto, solo los visibles
    const [page, setPage] = useState(1)
    const [sheet, setSheet] = useState({ open: false, exercise: null })
    const [confirm, setConfirm] = useState(null) // { type: 'toggle' | 'delete', exercise }

    const { setStatus, remove } = useExerciseMutations()
    const { data, isLoading, isError, refetch } = useExercises({
        search: search || undefined,
        muscleGroup: group === 'all' ? undefined : group,
        isActive: visibility === 'all' ? undefined : visibility,
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

    const hasFilters = !!search || group !== 'all' || visibility !== 'true'
    const openCreate = () => setSheet({ open: true, exercise: null })

    async function handleConfirm() {
        const { type, exercise } = confirm
        try {
            if (type === 'delete') {
                await remove.mutateAsync(exercise.id)
                toast.success('Ejercicio eliminado')
            } else {
                await setStatus.mutateAsync({ id: exercise.id, isActive: !exercise.isActive })
                toast.success(exercise.isActive ? 'Ejercicio oculto' : 'Ejercicio visible otra vez')
            }
            setConfirm(null)
        } catch (error) {
            toast.error(getErrorMessage(error))
            setConfirm(null)
        }
    }

    const actionsFor = (e) => (
        <RowActions
            exercise={e}
            onEdit={(exercise) => setSheet({ open: true, exercise })}
            onToggle={(exercise) => setConfirm({ type: 'toggle', exercise })}
            onDelete={(exercise) => setConfirm({ type: 'delete', exercise })}
        />
    )

    const columns = [
        {
            header: 'Ejercicio',
            cell: (e) => (
                <div>
                    <p className="font-medium">{e.name}</p>
                    {e.description && <p className="text-xs text-muted-foreground">{e.description}</p>}
                </div>
            ),
        },
        { header: 'Grupo muscular', cell: (e) => MUSCLE_GROUPS[e.muscleGroup] },
        { header: 'Video', cell: (e) => <VideoLink exercise={e} /> },
        { header: 'Estado', cell: (e) => <StatusBadge status={e.isActive ? 'visible' : 'hidden'} /> },
        { header: 'Acciones', srOnly: true, className: 'w-12 text-right', cell: actionsFor },
    ]

    const renderCard = (e) => (
        <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
                <p className="font-medium">{e.name}</p>
                <p className="text-xs text-muted-foreground">{MUSCLE_GROUPS[e.muscleGroup]}</p>
                <VideoLink exercise={e} />
                <div>
                    <StatusBadge status={e.isActive ? 'visible' : 'hidden'} />
                </div>
            </div>
            {actionsFor(e)}
        </div>
    )

    const isDelete = confirm?.type === 'delete'
    const hiding = confirm?.type === 'toggle' && confirm.exercise.isActive

    return (
        <>
            <PageHeader
                title="Ejercicios"
                description="Catálogo compartido que se usa para armar las rutinas."
                actions={
                    <Button onClick={openCreate}>
                        <Plus aria-hidden="true" /> Nuevo ejercicio
                    </Button>
                }
            />

            <div className="mb-4 flex flex-wrap gap-3">
                <SearchInput
                    value={search}
                    onChange={handleSearch}
                    placeholder="Buscar por nombre"
                    label="Buscar ejercicios"
                    className="w-full sm:max-w-xs"
                />
                <Select
                    value={group}
                    onValueChange={(v) => {
                        setGroup(v)
                        setPage(1)
                    }}
                >
                    <SelectTrigger className="w-full sm:w-48" aria-label="Filtrar por grupo muscular">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los grupos</SelectItem>
                        {Object.entries(MUSCLE_GROUPS).map(([v, label]) => (
                            <SelectItem key={v} value={v}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={visibility}
                    onValueChange={(v) => {
                        setVisibility(v)
                        setPage(1)
                    }}
                >
                    <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar por visibilidad">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="true">Visibles</SelectItem>
                        <SelectItem value="false">Ocultos</SelectItem>
                        <SelectItem value="all">Todos</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <DataTable
                columns={columns}
                rows={data?.items}
                getRowId={(e) => e.id}
                renderCard={renderCard}
                isLoading={isLoading}
                isError={isError}
                onRetry={refetch}
                empty={
                    <EmptyState
                        icon={Dumbbell}
                        title={hasFilters ? 'No se encontraron ejercicios' : 'Todavía no hay ejercicios'}
                        description={
                            hasFilters
                                ? 'Probá con otra búsqueda o cambiá los filtros.'
                                : 'Cargá el primero para empezar a armar rutinas.'
                        }
                        action={
                            !hasFilters && (
                                <Button onClick={openCreate}>
                                    <Plus aria-hidden="true" /> Nuevo ejercicio
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

            <ExerciseFormSheet
                open={sheet.open}
                onOpenChange={(open) => setSheet((s) => ({ ...s, open }))}
                exercise={sheet.exercise}
            />

            <ConfirmDialog
                open={!!confirm}
                onOpenChange={(open) => !open && setConfirm(null)}
                title={
                    isDelete
                        ? '¿Eliminar este ejercicio?'
                        : hiding
                            ? '¿Ocultar este ejercicio?'
                            : '¿Volver a mostrar este ejercicio?'
                }
                description={
                    isDelete
                        ? 'Se elimina definitivamente. Solo es posible porque nunca se usó en una rutina.'
                        : hiding
                            ? 'Deja de aparecer al armar rutinas nuevas. Las rutinas que ya lo usan lo siguen mostrando, y podés volver a mostrarlo cuando quieras.'
                            : 'Vuelve a aparecer al armar rutinas.'
                }
                confirmLabel={isDelete ? 'Eliminar' : hiding ? 'Ocultar' : 'Mostrar'}
                destructive={isDelete}
                loading={setStatus.isPending || remove.isPending}
                onConfirm={handleConfirm}
            />
        </>
    )
}