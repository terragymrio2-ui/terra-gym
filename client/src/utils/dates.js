const TZ = 'America/Argentina/Cordoba'
const pad = (n) => String(n).padStart(2, '0')

export function todayAR() {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date())
}

export function addDays(dateStr, days) {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

export function addMonths(dateStr, months) {
    const [y, m, d] = dateStr.split('-').map(Number)
    const total = y * 12 + (m - 1) + months
    const ny = Math.floor(total / 12)
    const nm = total % 12
    const lastDay = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate()
    return `${ny}-${pad(nm + 1)}-${pad(Math.min(d, lastDay))}`
}

export const membershipEnd = (start, months) => addDays(addMonths(start, months), -1)