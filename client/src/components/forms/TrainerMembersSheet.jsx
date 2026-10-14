import { useState } from 'react'
import { Plus, UserMinus, Users } from 'lucide-react'
import { toast } from 'sonner'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import StatusBadge from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useTrainerMemberMutations, useTrainerMembers } from '@/hooks/useTrainerMembers'
import { useUsers } from '@/hooks/useUsers'
import { getErrorMessage } from '@/services/api'

// Se monta solo cuando el popover está abierto, así no consulta socios hasta que se necesita
function MemberCommand({ assignedIds, onPick }) {
    const [text, setText] = useState('')
    const search = useDebouncedValue(text, 300)
    const { data, isLoading, isError } = useUsers({
        role: 'USUARIO',
        isActive: true,
        search: search || undefined,
        page: 1,
        limit: 30,
    })

    const options = (data?.items ?? []).filter((u) => !assignedIds.has(u.id))

    return (
        // shouldFilter={false}: el filtrado lo hace el servidor, no el componente
        <Command shouldFilter={false}>
            <CommandInput
                value={text}
                onValueChange={setText}
                placeholder="Buscar por nombre, email o DNI"
            />
            <CommandList>
                {isLoading && <p className="p-3 text-sm text-muted-foreground">Buscando...</p>}
                {isError && <p className="p-3 text-sm text-destructive">No se pudo buscar.</p>}
                {!isLoading && !isError && options.length === 0 && (
                    <CommandEmpty>No hay socios activos para asignar con esa búsqueda.</CommandEmpty>
                )}
                <CommandGroup>
                    {options.map((u) => (
                        <CommandItem key={u.id} value={String(u.id)} onSelect={() => onPick(u)}>
                            <div>
                                <p>
                                    {u.lastName}, {u.firstName}
                                </p>
                                <p className="text-xs text-muted-foreground">{u.dni ?? u.email}</p>
                            </div>
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </Command>
    )
}

function Content({ trainer }) {
    const [pickerOpen, setPickerOpen] = useState(false)
    const [toRemove, setToRemove] = useState(null)
    const { data: members, isLoading, isError, refetch } = useTrainerMembers(trainer.id)
    const { add, remove } = useTrainerMemberMutations(trainer.id)

    const assignedIds = new Set((members ?? []).map((m) => m.id))

    async function handlePick(user) {
        setPickerOpen(false)
        try {
            await add.mutateAsync([user.id])
            toast.success(`${user.firstName} ${user.lastName} asignado`)
        } catch (error) {
            toast.error(getErrorMessage(error))
        }
    }

    async function handleRemove() {
        try {
            await remove.mutateAsync(toRemove.id)
            toast.success('Asignación eliminada')
            setToRemove(null)
        } catch (error) {
            toast.error(getErrorMessage(error))
        }
    }

    return (
        <>
            <SheetHeader>
                <SheetTitle>
                    Socios de {trainer.firstName} {trainer.lastName}
                </SheetTitle>
                <SheetDescription>
                    El profesor solo puede ver y armar planes para los socios que tenga asignados.
                </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 px-4 pb-4">
                <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                    <PopoverTrigger asChild>
                        <Button className="w-full" disabled={add.isPending}>
                            <Plus aria-hidden="true" /> Asignar socio
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                        <MemberCommand assignedIds={assignedIds} onPick={handlePick} />
                    </PopoverContent>
                </Popover>

                {isLoading && (
                    <div className="space-y-2" role="status" aria-label="Cargando socios">
                        <Skeleton className="h-14 w-full" />
                        <Skeleton className="h-14 w-full" />
                    </div>
                )}

                {isError && <ErrorState onRetry={refetch} />}

                {members && members.length === 0 && (
                    <EmptyState
                        icon={Users}
                        title="Sin socios asignados"
                        description="Usá el botón de arriba para asignarle el primero."
                    />
                )}

                {members && members.length > 0 && (
                    <ul className="space-y-2">
                        {members.map((m) => (
                            <li key={m.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                                <div className="min-w-0">
                                    <p className="font-medium">
                                        {m.lastName}, {m.firstName}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">{m.dni ?? m.email}</p>
                                    {!m.isActive && <StatusBadge status="inactive" className="mt-1" />}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Quitar a ${m.firstName} ${m.lastName}`}
                                    onClick={() => setToRemove(m)}
                                >
                                    <UserMinus aria-hidden="true" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <ConfirmDialog
                open={!!toRemove}
                onOpenChange={(open) => !open && setToRemove(null)}
                title="¿Quitar este socio del profesor?"
                description="El profesor deja de ver a este socio y de poder editar sus planes. Los planes ya creados se conservan."
                confirmLabel="Quitar"
                destructive
                loading={remove.isPending}
                onConfirm={handleRemove}
            />
        </>
    )
}

export default function TrainerMembersSheet({ trainer, onClose }) {
    return (
        <Sheet open={!!trainer} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                {trainer && <Content trainer={trainer} />}
            </SheetContent>
        </Sheet>
    )
}