import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const GREEN = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
const AMBER = 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
const RED = 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
const BLUE = 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
const GRAY = 'bg-muted text-muted-foreground'

const STATUSES = {
    // Usuarios
    active: { label: 'Activo', className: GREEN },
    inactive: { label: 'Inactivo', className: GRAY },
    visible: { label: 'Visible', className: GREEN },
    hidden: { label: 'Oculto', className: GRAY },
    // Membresías
    VIGENTE: { label: 'Vigente', className: GREEN },
    POR_VENCER: { label: 'Por vencer', className: AMBER },
    VENCIDA: { label: 'Vencida', className: RED },
    PROGRAMADA: { label: 'Programada', className: BLUE },
    CANCELADA: { label: 'Cancelada', className: GRAY },
    // Pagos
    PAGADA: { label: 'Pagada', className: GREEN },
    PARCIAL: { label: 'Pago parcial', className: AMBER },
    PENDIENTE: { label: 'Sin pagar', className: RED },
}

export default function StatusBadge({ status, className }) {
    const config = STATUSES[status]
    if (!config) return null
    return (
        <Badge variant="secondary" className={cn('border-transparent', config.className, className)}>
            {config.label}
        </Badge>
    )
}