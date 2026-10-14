import { CreditCard, IdCard, LayoutDashboard, Receipt, Tags, UserCog, Users, Dumbbell, ClipboardList, ClipboardCheck, CalendarCheck, UserCheck, BellRing, Megaphone } from 'lucide-react'

export const NAV_BY_ROLE = {
    ADMIN: [
        { label: 'Inicio', to: '/admin', icon: LayoutDashboard },
        { label: 'Recepción', to: '/recepcion', icon: UserCheck },
        { label: 'Socios', to: '/admin/socios', icon: Users },
        { label: 'Profesores', to: '/admin/profesores', icon: UserCog },
        { label: 'Membresías', to: '/admin/membresias', icon: CreditCard },
        { label: 'Vencimientos', to: '/admin/vencimientos', icon: BellRing },
        { label: 'Avisos', to: '/admin/avisos', icon: Megaphone },
        { label: 'Pagos', to: '/admin/pagos', icon: Receipt },
        { label: 'Planes', to: '/admin/planes', icon: Tags },
        { label: 'Ejercicios', to: '/ejercicios', icon: Dumbbell },
        { label: 'Plantillas', to: '/plantillas', icon: ClipboardList },
        { label: 'Socios y rutinas', to: '/socios-rutinas', icon: ClipboardCheck },
        { label: 'Asistencias', to: '/asistencias', icon: CalendarCheck },
    ],
    PROFESOR: [{ label: 'Inicio', to: '/profesor', icon: LayoutDashboard }, { label: 'Ejercicios', to: '/ejercicios', icon: Dumbbell, label: 'Plantillas', to: '/plantillas', icon: ClipboardList }, { label: 'Socios y rutinas', to: '/socios-rutinas', icon: ClipboardCheck }, { label: 'Asistencias', to: '/asistencias', icon: CalendarCheck }, { label: 'Recepción', to: '/recepcion', icon: UserCheck }],

    USUARIO: [
        { label: 'Inicio', to: '/socio', icon: LayoutDashboard },
        { label: 'Mi membresía', to: '/socio/membresia', icon: IdCard },
        { label: 'Mi rutina', to: '/socio/rutina', icon: Dumbbell },
        { label: 'Mis asistencias', to: '/socio/asistencias', icon: CalendarCheck },
    ],
}
export function titleFor(pathname) {
    const all = Object.values(NAV_BY_ROLE).flat()
    // El link más específico que coincida con el inicio de la ruta
    const match = all
        .filter((i) => pathname === i.to || pathname.startsWith(`${i.to}/`))
        .sort((a, b) => b.to.length - a.to.length)[0]
    if (pathname === '/perfil') return 'Mi perfil'
    return match?.label ?? ''
}