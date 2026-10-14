import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Pagination({ page, totalPages, total, onPageChange }) {
    if (!total) return null

    return (
        <nav aria-label="Paginación" className="mt-4 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground" aria-live="polite">
                Página {page} de {totalPages} · {total} resultado{total !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                    <ChevronLeft aria-hidden="true" /> Anterior
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                >
                    Siguiente <ChevronRight aria-hidden="true" />
                </Button>
            </div>
        </nav>
    )
}