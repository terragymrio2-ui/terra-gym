import { NavLink, useNavigate } from 'react-router-dom'
import { ChevronsUpDown, Dumbbell, LogOut, Monitor, Moon, Sun } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_LABELS } from '@/utils/roles'
import { NAV_BY_ROLE } from './navigation'
import { useState } from 'react'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { useUnsaved } from '@/contexts/UnsavedContext'
import { UserRound } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import Logo from '@/components/shared/Logo'


export default function AppSidebar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const { dirty, markDirty } = useUnsaved()
    const { theme, setTheme } = useTheme()

    const [pendingTo, setPendingTo] = useState(null)
    const items = NAV_BY_ROLE[user.role] ?? []

    async function handleLogout() {
        await logout()
        navigate('/login', { replace: true })
    }

    return (
        <Sidebar>
            <SidebarHeader>
                <div className="px-2 py-1.5">
                    <Logo />
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.to}>
                                    <NavLink
                                        to={item.to}
                                        end
                                        onClick={(e) => {
                                            if (dirty) {
                                                e.preventDefault()
                                                setPendingTo(item.to)
                                            }
                                        }}
                                    >
                                        {({ isActive }) => (
                                            <SidebarMenuButton asChild isActive={isActive}>
                                                <span>
                                                    <item.icon aria-hidden="true" />
                                                    {item.label}
                                                </span>
                                            </SidebarMenuButton>
                                        )}
                                    </NavLink>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton size="lg" aria-label="Menú de usuario">
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-medium">
                                            {user.firstName} {user.lastName}
                                        </span>
                                        <span className="truncate text-xs text-muted-foreground">
                                            {ROLE_LABELS[user.role]}
                                        </span>
                                    </div>
                                    <ChevronsUpDown className="size-4" aria-hidden="true" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="top" align="start" className="w-56">
                                <DropdownMenuLabel>Tema</DropdownMenuLabel>

                                <DropdownMenuRadioGroup
                                    value={theme}
                                    onValueChange={setTheme}
                                >
                                    <DropdownMenuRadioItem value="light">
                                        <Sun aria-hidden="true" />
                                        Claro
                                    </DropdownMenuRadioItem>

                                    <DropdownMenuRadioItem value="dark">
                                        <Moon aria-hidden="true" />
                                        Oscuro
                                    </DropdownMenuRadioItem>

                                    <DropdownMenuRadioItem value="system">
                                        <Monitor aria-hidden="true" />
                                        Automático
                                    </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem onSelect={() => navigate('/perfil')}>
                                    <UserRound aria-hidden="true" />
                                    Mi perfil
                                </DropdownMenuItem>

                                <DropdownMenuItem onSelect={handleLogout}>
                                    <LogOut aria-hidden="true" />
                                    Cerrar sesión
                                </DropdownMenuItem>
                            </DropdownMenuContent>

                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}