import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import PasswordInput from '@/components/shared/PasswordInput'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/services/api'
import { authService } from '@/services/auth.service'
import { HOME_BY_ROLE } from '@/utils/roles'
import Logo from '@/components/shared/Logo'

const schema = z
    .object({
        currentPassword: z.string().min(1, 'Ingresá tu contraseña actual'),
        newPassword: z
            .string()
            .min(4, 'Debe tener al menos 4 caracteres')
            .max(72, 'No puede superar los 72 caracteres'),
        confirmPassword: z.string().min(1, 'Repetí la nueva contraseña'),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
        message: 'Las contraseñas no coinciden',
        path: ['confirmPassword'],
    })
    .refine((d) => d.currentPassword !== d.newPassword, {
        message: 'Debe ser distinta a la actual',
        path: ['newPassword'],
    })

const FIELDS = [
    { name: 'currentPassword', label: 'Contraseña actual', autoComplete: 'current-password' },
    { name: 'newPassword', label: 'Nueva contraseña', autoComplete: 'new-password' },
    { name: 'confirmPassword', label: 'Repetir nueva contraseña', autoComplete: 'new-password' },
]

export default function ChangePasswordPage() {
    const { user, markPasswordChanged } = useAuth()
    const navigate = useNavigate()
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    })

    async function onSubmit({ currentPassword, newPassword }) {
        try {
            await authService.changePassword({ currentPassword, newPassword })
            markPasswordChanged()
            toast.success('Contraseña actualizada')
            navigate(HOME_BY_ROLE[user.role], { replace: true })
        } catch (error) {
            const code = error.response?.data?.error?.code
            if (code === 'WRONG_PASSWORD') {
                setError('currentPassword', { message: 'La contraseña actual es incorrecta' })
            } else {
                toast.error(getErrorMessage(error))
            }
        }
    }

    return (
        <main className="grid min-h-screen place-items-center bg-muted/40 p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <Logo className="mx-auto mb-3 h-14 w-auto" />
                    <CardTitle className="text-2xl">Cambiá tu contraseña</CardTitle>
                    <CardDescription>
                        Por seguridad, tenés que elegir una contraseña nueva antes de continuar.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                        {FIELDS.map(({ name, label, autoComplete }) => (
                            <div key={name} className="space-y-2">
                                <Label htmlFor={name}>{label}</Label>
                                <PasswordInput
                                    id={name}
                                    autoComplete={autoComplete}
                                    aria-invalid={!!errors[name]}
                                    aria-describedby={errors[name] ? `${name}-error` : undefined}
                                    {...register(name)}
                                />
                                {errors[name] && (
                                    <p id={`${name}-error`} role="alert" className="text-sm text-destructive">
                                        {errors[name].message}
                                    </p>
                                )}
                            </div>
                        ))}
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : 'Guardar contraseña'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </main>
    )
}