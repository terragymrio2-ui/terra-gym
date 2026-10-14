import { formatCurrency, formatDate } from './format'

// Arma el link wa.me. Solo usa el número si está en formato internacional (+54...);
// si no, abre WhatsApp para elegir el contacto a mano.
export function buildWhatsAppUrl({ phone, text }) {
    const digits = phone?.trim().startsWith('+') ? phone.replace(/\D/g, '') : ''
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

export function buildReminderMessage({ firstName, planName, endDate, expired, balance }) {
    const date = formatDate(endDate)
    let text = `¡Hola ${firstName}! Te escribimos de TerraGym. Tu membresía (${planName}) ${expired ? 'venció' : 'vence'
        } el ${date}.`
    if (balance > 0) text += ` Tenés un saldo pendiente de ${formatCurrency(balance)}.`
    return `${text} Para renovarla acercate al gimnasio. ¡Gracias!`
}