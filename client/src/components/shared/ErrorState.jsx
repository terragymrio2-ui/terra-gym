import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ErrorState({
    title = 'No pudimos cargar los datos',
    description = 'Revisá tu conexión e intentá nuevamente.',
    onRetry,
}) {
    return (
        <div
            role="alert"
            className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-10 text-center"
        >
            <AlertTriangle className="size-8 text-destructive" aria-hidden="true" />
            <h2 className="font-medium">{title}</h2>
            <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
            {onRetry && (
                <Button variant="outline" onClick={onRetry}>
                    Reintentar
                </Button>
            )}
        </div>
    )
}