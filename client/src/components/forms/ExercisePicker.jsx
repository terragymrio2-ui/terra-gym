import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
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
import { useExercises } from '@/hooks/useExercises'
import { cn } from '@/lib/utils'
import { MUSCLE_GROUPS } from '@/utils/exercises'

function GroupFilter({ value, onChange }) {
    const options = [['all', 'Todos'], ...Object.entries(MUSCLE_GROUPS)]
    return (
        <div
            role="group"
            aria-label="Filtrar por grupo muscular"
            className="flex flex-wrap gap-1 border-b p-2"
        >
            {options.map(([key, label]) => (
                <button
                    key={key}
                    type="button"
                    onClick={() => onChange(key)}
                    aria-pressed={value === key}
                    className={cn(
                        'rounded-full border px-2.5 py-0.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        value === key
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                >
                    {label}
                </button>
            ))}
        </div>
    )
}

function ExerciseCommand({ onPick }) {
    const [text, setText] = useState('')
    const [group, setGroup] = useState('all')
    const search = useDebouncedValue(text, 300)
    const { data, isLoading, isError } = useExercises({
        search: search || undefined,
        muscleGroup: group === 'all' ? undefined : group,
        isActive: true,
        page: 1,
        limit: 100,
    })
    const options = data?.items ?? []

    // Agrupa por grupo muscular, respetando el orden definido en MUSCLE_GROUPS
    const grouped = useMemo(
        () =>
            Object.keys(MUSCLE_GROUPS)
                .map((key) => ({ key, items: options.filter((e) => e.muscleGroup === key) }))
                .filter((g) => g.items.length > 0),
        [options],
    )

    return (
        <Command shouldFilter={false}>
            <CommandInput value={text} onValueChange={setText} placeholder="Buscar ejercicio" />
            <GroupFilter value={group} onChange={setGroup} />
            <CommandList className="max-h-72">
                {isLoading && <p className="p-3 text-sm text-muted-foreground">Buscando...</p>}
                {isError && <p className="p-3 text-sm text-destructive">No se pudo buscar.</p>}
                {!isLoading && !isError && options.length === 0 && (
                    <CommandEmpty>No hay ejercicios con esa búsqueda.</CommandEmpty>
                )}
                {grouped.map((g) => (
                    <CommandGroup key={g.key} heading={MUSCLE_GROUPS[g.key]}>
                        {g.items.map((e) => (
                            <CommandItem key={e.id} value={String(e.id)} onSelect={() => onPick(e)}>
                                {e.name}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                ))}
            </CommandList>
        </Command>
    )
}

export default function ExercisePicker({ onPick }) {
    const [open, setOpen] = useState(false)
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button type="button" variant="outline">
                    <Plus aria-hidden="true" /> Agregar ejercicio
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
                <ExerciseCommand
                    onPick={(e) => {
                        onPick(e)
                        setOpen(false)
                    }}
                />
            </PopoverContent>
        </Popover>
    )
}