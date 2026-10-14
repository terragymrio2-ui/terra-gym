import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import loginBg from '@/assets/login-bg.webp'
import PasswordInput from '@/components/shared/PasswordInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/services/api'
import { HOME_BY_ROLE } from '@/utils/roles'


const schema = z.object({
    email: z.string().trim().min(1, 'Ingresá tu email').email('El email no es válido'),
    password: z.string().min(1, 'Ingresá tu contraseña'),
    remember: z.boolean(),
})

export default function LoginPage() {
    const { user, login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { email: '', password: '', remember: false },
    })

    if (user) return <Navigate to={HOME_BY_ROLE[user.role]} replace />

    async function onSubmit(values) {
        try {
            const loggedUser = await login(values)
            if (loggedUser.mustChangePassword) {
                navigate('/cambiar-password', { replace: true })
            } else {
                navigate(location.state?.from?.pathname ?? HOME_BY_ROLE[loggedUser.role], { replace: true })
            }
        } catch (error) {
            toast.error(getErrorMessage(error))
        }
    }

    return (
        // "dark" fuerza el tema oscuro solo en esta pantalla, que es la de la marca
        <main className="dark relative grid h-dvh grid-rows-1 overflow-hidden bg-background text-foreground lg:grid-cols-2">
            {/* Celular: foto fija arriba. Escritorio: panel lateral */}
            <div className="absolute inset-x-0 top-0 h-[39%] lg:relative lg:h-auto">
                <img
                    src={loginBg}
                    alt="TerraGym: gimnasio con rack de pesas y mancuernas. Entrená, superate, avanzá."
                    className="absolute inset-0 size-full object-cover object-[center_40%]"
                />
                <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background lg:bg-gradient-to-r lg:to-background"
                />
            </div>

            <section className="relative flex overflow-y-auto px-5 pb-6 pt-[10dvh] lg:p-10">
                <div className="m-auto w-full max-w-sm rounded-2xl border bg-card/80 p-6 shadow-lg backdrop-blur motion-safe:animate-fade-up lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
                    <div className="text-center lg:text-left">
                        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ingresá a tu cuenta</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Entrená, superate, avanzá.</p>
                    </div>


                    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="username"
                                aria-invalid={!!errors.email}
                                aria-describedby={errors.email ? 'email-error' : undefined}
                                {...register('email')}
                            />
                            {errors.email && (
                                <p id="email-error" role="alert" className="text-sm text-destructive">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <PasswordInput
                                id="password"
                                autoComplete="current-password"
                                aria-invalid={!!errors.password}
                                aria-describedby={errors.password ? 'password-error' : undefined}
                                {...register('password')}
                            />
                            {errors.password && (
                                <p id="password-error" role="alert" className="text-sm text-destructive">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <div className="flex items-start gap-2">
                            <input
                                id="remember"
                                type="checkbox"
                                aria-describedby="remember-hint"
                                className="mt-0.5 size-4 shrink-0 cursor-pointer rounded accent-primary"
                                {...register('remember')}
                            />
                            <div className="grid gap-1 leading-none">
                                <Label htmlFor="remember" className="cursor-pointer">
                                    Mantener la sesión iniciada en este dispositivo
                                </Label>
                                <p id="remember-hint" className="text-xs text-muted-foreground">
                                    Usalo solo en tu celular o computadora personal.
                                </p>
                            </div>
                        </div>

                        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
                        </Button>
                    </form>
                </div>
            </section>
        </main>
    )
}