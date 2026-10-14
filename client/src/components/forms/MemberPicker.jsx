import { useState } from 'react'
import { ChevronsUpDown } from 'lucide-react'
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
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useUsers } from '@/hooks/useUsers'

function MemberCommand({ onPick }) {
    const [text, setText] = useState('')
    const search = useDebouncedValue(text, 300)
    const { data, isLoading, isError } = useUsers({
        role: 'USUARIO',
        isActive: true,
        search: search || undefined,
        page: 1,
        limit: 30,
    })
    const options = data?.items ?? []

    return (
        <Command shouldFilter={false}>
            <CommandInput value={text} onValueChange={setText} placeholder="Buscar por nombre, email o DNI" />
            <CommandList>
                {isLoading && <p className="p-3 text-sm text-muted-foreground">Buscando...</p>}
                {isError && <p className="p-3 text-sm text-destructive">No se pudo buscar.</p>}
                {!isLoading && !isError && options.length === 0 && (
                    <CommandEmpty>No hay socios activos con esa búsqueda.</CommandEmpty>
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

// selected: { id, firstName, lastName } | null
export default function MemberPicker({ id, selected, onSelect, invalid, describedBy }) {
    const [open, setOpen] = useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    aria-invalid={invalid}
                    aria-describedby={describedBy}
                    className="w-full justify-between font-normal"
                >
                    <span className={selected ? '' : 'text-muted-foreground'}>
                        {selected ? `${selected.lastName}, ${selected.firstName}` : 'Elegí un socio'}
                    </span>
                    <ChevronsUpDown className="opacity-50" aria-hidden="true" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                <MemberCommand
                    onPick={(u) => {
                        onSelect(u)
                        setOpen(false)
                    }}
                />
            </PopoverContent>
        </Popover>
    )
}