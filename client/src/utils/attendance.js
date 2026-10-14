import { formatCurrency, formatDate } from './format'

export function warningText(w) {
    const d = w.data ?? {}
    switch (w.code) {
        case 'NO_MEMBERSHIP':
            return 'No tiene ninguna membresía.'
        case 'EXPIRED':
            return `Su membresía venció el ${formatDate(d.endDate)}.`
        case 'CANCELLED':
            return 'Su membresía está cancelada.'
        case 'NOT_STARTED':
            return `Su membresía todavía no empezó (arranca el ${formatDate(d.startDate)}).`
        case 'EXPIRING':
            return `Su membresía vence el ${formatDate(d.endDate)}.`
        case 'WEEKLY_LIMIT':
            return `Ya vino ${d.weekCount} de ${d.daysPerWeek} días esta semana.`
        case 'DEBT':
            return `Debe ${formatCurrency(d.balance)}.`
        default:
            return 'Aviso.'
    }
}

// Motivos cortos para las excepciones del historial
export const OVERRIDE_LABELS = {
    NO_MEMBERSHIP: 'Sin membresía',
    EXPIRED: 'Vencida',
    CANCELLED: 'Cancelada',
    NOT_STARTED: 'No empezó',
    WEEKLY_LIMIT: 'Cupo semanal',
}