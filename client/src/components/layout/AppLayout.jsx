import { Outlet, useLocation } from 'react-router-dom'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/useAuth'
import AppSidebar from './AppSidebar'
import { titleFor } from './navigation'

export default function AppLayout() {
    const { pathname } = useLocation()
    const { user } = useAuth()

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-14 items-center gap-3 border-b px-4">
                    <SidebarTrigger aria-label="Abrir o cerrar menú" />
                    <p className="font-medium">{titleFor(pathname)}</p>
                    <p className="ml-auto hidden text-sm text-muted-foreground sm:block">
                        {user.firstName} {user.lastName}
                    </p>
                </header>
                <main className="flex-1 p-4 md:p-6">
                    <Outlet />
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}