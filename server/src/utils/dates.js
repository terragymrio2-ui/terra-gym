const TZ = 'America/Argentina/Cordoba'

// Fecha de hoy en Argentina ('YYYY-MM-DD'), sin importar la zona del servidor
export function todayAR() {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date())
}

// Fecha y hora actual en Argentina ('YYYY-MM-DD HH:mm:ss'), para columnas DATETIME
export function nowAR() {
    return new Intl.DateTimeFormat('sv-SE', {
        timeZone: TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
    }).format(new Date())
}

function parse(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number)
    return { y, m, d }
}

const pad = (n) => String(n).padStart(2, '0')

export function addDays(dateStr, days) {
    const { y, m, d } = parse(dateStr)
    return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

// 31/01 + 1 mes = 28/02 (se ajusta al último día del mes destino)
export function addMonths(dateStr, months) {
    const { y, m, d } = parse(dateStr)
    const total = y * 12 + (m - 1) + months
    const ny = Math.floor(total / 12)
    const nm = total % 12
    const lastDay = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate()
    return `${ny}-${pad(nm + 1)}-${pad(Math.min(d, lastDay))}`
}

// Último día incluido de la membresía: 15/10 + 1 mes → 14/11
export function membershipEnd(startDate, months) {
    return addDays(addMonths(startDate, months), -1)
}

// Lunes de la semana a la que pertenece la fecha ('YYYY-MM-DD')
export function weekStart(dateStr) {
    const { y, m, d } = parse(dateStr)
    const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay() // 0 = domingo
    return addDays(dateStr, -((dayOfWeek + 6) % 7))
}
// Días entre dos fechas 'YYYY-MM-DD' (positivo si "to" es posterior a "from")
export function daysBetween(fromStr, toStr) {
    const a = parse(fromStr)
    const b = parse(toStr)
    return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000)
}
// Lista de los últimos n días terminando en "endStr", ordenados de menor a mayor
export function lastDays(endStr, n) {
    return Array.from({ length: n }, (_, i) => addDays(endStr, i - (n - 1)))
}

// Lista de los últimos n meses ('YYYY-MM') terminando en el mes de "endStr"
export function lastMonths(endStr, n) {
    const first = `${endStr.slice(0, 7)}-01`
    return Array.from({ length: n }, (_, i) => addMonths(first, i - (n - 1)).slice(0, 7))
}