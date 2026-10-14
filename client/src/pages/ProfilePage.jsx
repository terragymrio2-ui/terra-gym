import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import FormField from '@/components/forms/FormField'
import PageHeader from '@/components/layout/PageHeader'
import PasswordInput from '@/components/shared/PasswordInput'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/services/api'
import { authService } from '@/services/auth.service'
import { ROLE_LABELS } from '@/utils/roles'

const schema = z
    .object({
        currentPassword: z.string().min(1, 'Ingresá tu contraseña actual'),
        newPassword: z.string().min(4, 'Debe tener al menos 4 caracteres').max(72, 'No puede superar los 72 caracteres'),
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
    ['currentPassword', 'Contraseña actual', 'current-password'],
    ['newPassword', 'Nueva contraseña', 'new-password'],
    ['confirmPassword', 'Repetir nueva contraseña', 'new-password'],
]

export default function ProfilePage() {
    const { user } = useAuth()
    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    })

    async function onSubmit({ currentPassword, newPassword }) {
        try {
            await authService.changePassword({ currentPassword, newPassword })
            toast.success('Contraseña actualizada')
            reset()
        } catch (error) {
            if (error.response?.data?.error?.code === 'WRONG_PASSWORD') {
                setError('currentPassword', { message: 'La contraseña actual es incorrecta' })
            } else {
                toast.error(getErrorMessage(error))
            }
        }
    }

    return (
        <>
            <PageHeader title="Mi perfil" description="Tus datos y tu contraseña." />

            <Card className="mb-6 max-w-md">
                <CardHeader>
                    <CardTitle className="text-base">Datos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                    <p className="font-medium">
                        {user.firstName} {user.lastName}
                    </p>
                    <p className="text-muted-foreground">{user.email}</p>
                    <p className="text-muted-foreground">{ROLE_LABELS[user.role]}</p>
                </CardContent>
            </Card>

            <Card className="max-w-md">
                <CardHeader>
                    <CardTitle className="text-base">Cambiar contraseña</CardTitle>
                    <CardDescription>Tu sesión sigue abierta después del cambio.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                        {FIELDS.map(([name, label, autoComplete]) => (
                            <FormField key={name} id={name} label={label} error={errors[name]?.message}>
                                {(p) => <PasswordInput autoComplete={autoComplete} {...p} {...register(name)} />}
                            </FormField>
                        ))}
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : 'Guardar contraseña'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </>
    )
}