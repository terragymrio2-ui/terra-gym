import { Label } from '@/components/ui/label'

// children es una función que recibe los atributos de accesibilidad para el input
export default function FormField({ id, label, error, hint, children }) {
    const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            {children({ id, 'aria-invalid': !!error, 'aria-describedby': describedBy })}
            {hint && !error && (
                <p id={`${id}-hint`} className="text-xs text-muted-foreground">
                    {hint}
                </p>
            )}
            {error && (
                <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            )}
        </div>
    )
}