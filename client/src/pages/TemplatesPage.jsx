import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ClipboardList, Copy, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '@/components/layout/PageHeader'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import EmptyState from '@/components/shared/EmptyState'
import Pagination from '@/components/shared/Pagination'
import SearchInput from '@/components/shared/SearchInput'
import DataTable from '@/components/tables/DataTable'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { useTemplateMutations, useTemplates } from '@/hooks/useTrainingTemplates'
import { getErrorMessage } from '@/services/api'
import { formatDate } from '@/utils/format'

const PAGE_SIZE = 10

function RowActions({ template, canDelete, onEdit, onDuplicate, onDelete }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Acciones para ${template.name}`}>
                    <MoreHorizontal aria-hidden="true" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onEdit(template)}>
                    <Pencil aria-hidden="true" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onDuplicate(template)}>
                    <Copy aria-hidden="true" /> Duplicar
                </DropdownMenuItem>
                {canDelete && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={() => onDelete(template)}
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

export default function TemplatesPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [toDelete, setToDelete] = useState(null)

    const { duplicate, remove } = useTemplateMutations()
    const { data, isLoading, isError, refetch } = useTemplates({
        search: search || undefined,
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

    const edit = (t) => navigate(`/plantillas/${t.id}`)
    const canDelete = (t) => user.role === 'ADMIN' || t.createdBy.id === user.id

    async function handleDuplicate(t) {
        try {
            const copy = await duplicate.mutateAsync(t.id)
            toast.success('Plantilla duplicada. Ya podés editar tu copia.')
            navigate(`/plantillas/${copy.id}`)
        } catch (error) {
            toast.error(getErrorMessage(error))
        }
    }

    async function handleDelete() {
        try {
            await remove.mutateAsync(toDelete.id)
            toast.success('Plantilla eliminada')
        } catch (error) {
            toast.error(getErrorMessage(error))
        } finally {
            setToDelete(null)
        }
    }

    const actionsFor = (t) => (
        <RowActions
            template={t}
            canDelete={canDelete(t)}
            onEdit={edit}
            onDuplicate={handleDuplicate}
            onDelete={setToDelete}
        />
    )

    const columns = [
        {
            header: 'Plantilla',
            cell: (t) => (
                <div>
                    <Link to={`/plantillas/${t.id}`} className="font-medium hover:underline">
                        {t.name}
                    </Link>
                    {t.objective && <p className="text-xs text-muted-foreground">{t.objective}</p>}
                </div>
            ),
        },
        {
            header: 'Contenido',
            cell: (t) => `${t.daysCount} ${t.daysCount === 1 ? 'día' : 'días'} · ${t.exercisesCount} ejercicios`,
        },
        { header: 'Creada por', cell: (t) => `${t.createdBy.firstName} ${t.createdBy.lastName}` },
        { header: 'Actualizada', cell: (t) => formatDate(t.updatedAt) },
        { header: 'Acciones', srOnly: true, className: 'w-12 text-right', cell: actionsFor },
    ]

    const renderCard = (t) => (
        <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
                <Link to={`/plantillas/${t.id}`} className="font-medium hover:underline">
                    {t.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                    {t.daysCount} {t.daysCount === 1 ? 'día' : 'días'} · {t.exercisesCount} ejercicios
                </p>
                <p className="text-xs text-muted-foreground">
                    {t.createdBy.firstName} {t.createdBy.lastName} · {formatDate(t.updatedAt)}
                </p>
            </div>
            {actionsFor(t)}
        </div>
    )

    return (
        <>
            <PageHeader
                title="Plantillas de rutina"
                description="Rutinas reutilizables, compartidas entre todos los profesores."
                actions={
                    <Button onClick={() => navigate('/plantillas/nueva')}>
                        <Plus aria-hidden="true" /> Nueva plantilla
                    </Button>
                }
            />

            <div className="mb-4">
                <SearchInput
                    value={search}
                    onChange={handleSearch}
                    placeholder="Buscar por nombre u objetivo"
                    label="Buscar plantillas"
                    className="w-full sm:max-w-sm"
                />
            </div>

            <DataTable
                columns={columns}
                rows={data?.items}
                getRowId={(t) => t.id}
                renderCard={renderCard}
                isLoading={isLoading}
                isError={isError}
                onRetry={refetch}
                empty={
                    <EmptyState
                        icon={ClipboardList}
                        title={search ? 'No se encontraron plantillas' : 'Todavía no hay plantillas'}
                        description={
                            search ? 'Probá con otra búsqueda.' : 'Creá la primera para poder asignarla a tus socios.'
                        }
                        action={
                            !search && (
                                <Button onClick={() => navigate('/plantillas/nueva')}>
                                    <Plus aria-hidden="true" /> Nueva plantilla
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

            <ConfirmDialog
                open={!!toDelete}
                onOpenChange={(open) => !open && setToDelete(null)}
                title="¿Eliminar esta plantilla?"
                description="Se elimina para todos los profesores. Los socios que ya recibieron una copia no se ven afectados."
                confirmLabel="Eliminar"
                destructive
                loading={remove.isPending}
                onConfirm={handleDelete}
            />
        </>
    )
}