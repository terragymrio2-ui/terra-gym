const currency = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
})

export const formatCurrency = (n) => currency.format(Number(n) || 0)

// 'YYYY-MM-DD' → 'DD/MM/YYYY' sin pasar por Date (evita corrimientos de zona horaria)
export function formatDate(value) {
    if (!value) return '—'
    const [y, m, d] = value.slice(0, 10).split('-')
    return `${d}/${m}/${y}`
}
// 'YYYY-MM-DD HH:mm:ss' → 'HH:mm'
export const formatTime = (value) => (value ? value.slice(11, 16) : '—')