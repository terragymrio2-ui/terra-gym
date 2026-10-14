import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// Espera a que el usuario deje de escribir (debounce) antes de avisar al padre,
// así no se hace una consulta a la API por cada letra.
export default function SearchInput({
    value,
    onChange,
    placeholder = 'Buscar...',
    label = 'Buscar',
    delay = 400,
    className,
}) {
    const [text, setText] = useState(value)

    useEffect(() => {
        const timer = setTimeout(() => {
            if (text !== value) onChange(text)
        }, delay)
        return () => clearTimeout(timer)
    }, [text, value, onChange, delay])

    return (
        <div className={cn('relative', className)}>
            <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
            />
            <Input
                type="search"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={placeholder}
                aria-label={label}
                className="pl-9"
            />
        </div>
    )
}