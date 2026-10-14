export const MUSCLE_GROUPS = {
    PECHO: 'Pecho',
    ESPALDA: 'Espalda',
    HOMBROS: 'Hombros',
    BICEPS: 'Bíceps',
    TRICEPS: 'Tríceps',
    PIERNAS: 'Piernas',
    GLUTEOS: 'Glúteos',
    CORE: 'Core',
    CARDIO: 'Cardio',
    CUERPO_COMPLETO: 'Cuerpo completo',
}

const ALLOWED_VIDEO_HOSTS = [
    'youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be',
    'vimeo.com', 'www.vimeo.com', 'player.vimeo.com',
]

// Misma regla que el backend (que es quien la hace cumplir de verdad)
export function isValidVideoUrl(value) {
    try {
        const url = new URL(value)
        return url.protocol === 'https:' && ALLOWED_VIDEO_HOSTS.includes(url.hostname)
    } catch {
        return false
    }
}
export const BLOCKS = {
    ENTRADA_EN_CALOR: 'Entrada en calor',
    MOVILIDAD: 'Movilidad',
    PRINCIPAL: 'Principal',
    ACCESORIOS: 'Accesorios',
    CORE: 'Core',
    CARDIO: 'Cardio',
    ENFRIAMIENTO: 'Enfriamiento',
}