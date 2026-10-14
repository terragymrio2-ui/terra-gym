import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { useUserMutations } from '@/hooks/useUsers'
import { getErrorMessage } from '@/services/api'
import FormField from './FormField'

const schema = z.object({
    firstName: z.string().trim().min(1, 'Ingresá el nombre').max(80, 'Máximo 80 caracteres'),
    lastName: z.string().trim().min(1, 'Ingresá el apellido').max(80, 'Máximo 80 caracteres'),
    email: z.string().trim().min(1, 'Ingresá el email').email('El email no es válido'),
    dni: z.string().trim().regex(/^(\d{7,9})?$/, 'El DNI debe tener entre 7 y 9 dígitos'),
    phone: z.string().trim().regex(/^(\+?[\d\s-]{8,20})?$/, 'Teléfono inválido'),
    birthDate: z.string(),
    notifyEmail: z.boolean(),
})

const FIELDS = ['firstName', 'lastName', 'email', 'dni', 'phone', 'birthDate']

function toDefaults(user) {
    return {
        firstName: user?.firstName ?? '',
        lastName: user?.lastName ?? '',
        email: user?.email ?? '',
        dni: user?.dni ?? '',
        phone: user?.phone ?? '',
        birthDate: user?.birthDate ?? '',
        notifyEmail: user?.notifyEmail ?? true,
    }
}

// user = null → alta. user = objeto → edición.
export default function UserFormSheet({ open, onOpenChange, role, roleLabel, user, onCreated }) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                {/* Se monta solo con el Sheet abierto, así el formulario siempre arranca con datos frescos */}
                <UserForm
                    role={role}
                    roleLabel={roleLabel}
                    user={user}
                    onDone={() => onOpenChange(false)}
                    onCreated={onCreated}
                />
            </SheetContent>
        </Sheet>
    )
}

function UserForm({ role, roleLabel, user, onDone, onCreated }) {
    const isEdit = !!user
    const { create, update } = useUserMutations()
    const {
        register,
        control,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({ resolver: zodResolver(schema), defaultValues: toDefaults(user) })

    function handleServerError(error) {
        const err = error.response?.data?.error

        // Email o DNI repetido: el error se muestra en el campo correspondiente
        if (err?.code === 'DUPLICATE') {
            setError(err.message.includes('DNI') ? 'dni' : 'email', { message: err.message })
            return
        }
        if (err?.code === 'VALIDATION_ERROR') {
            let handled = false
            for (const d of err.details ?? []) {
                if (FIELDS.includes(d.field)) {
                    setError(d.field, { message: d.message })
                    handled = true
                }
            }
            if (handled) return
        }
        toast.error(getErrorMessage(error))
    }

    async function onSubmit(values) {
        try {
            if (isEdit) {
                await update.mutateAsync({ id: user.id, data: values })
                toast.success('Datos actualizados')
                onDone()
            } else {
                const result = await create.mutateAsync({ ...values, role })
                onDone()
                onCreated?.(result)
            }
        } catch (error) {
            handleServerError(error)
        }
    }

    return (
        <>
            <SheetHeader>
                <SheetTitle>{isEdit ? `Editar ${roleLabel}` : `Nuevo ${roleLabel}`}</SheetTitle>
                <SheetDescription>
                    {isEdit
                        ? 'Modificá los datos y guardá los cambios.'
                        : 'Se genera una contraseña temporal que vas a poder copiar o enviar por WhatsApp.'}
                </SheetDescription>
            </SheetHeader>

            <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4" noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField id="firstName" label="Nombre" error={errors.firstName?.message}>
                        {(p) => <Input autoComplete="off" {...p} {...register('firstName')} />}
                    </FormField>
                    <FormField id="lastName" label="Apellido" error={errors.lastName?.message}>
                        {(p) => <Input autoComplete="off" {...p} {...register('lastName')} />}
                    </FormField>
                </div>

                <FormField id="email" label="Email" error={errors.email?.message}>
                    {(p) => <Input type="email" autoComplete="off" {...p} {...register('email')} />}
                </FormField>

                <FormField id="dni" label="DNI (opcional)" error={errors.dni?.message} hint="Solo números, sin puntos.">
                    {(p) => <Input inputMode="numeric" autoComplete="off" {...p} {...register('dni')} />}
                </FormField>

                <FormField
                    id="phone"
                    label="Teléfono (opcional)"
                    error={errors.phone?.message}
                    hint="Con código de país para que funcione WhatsApp. Ej: +5493511234567"
                >
                    {(p) => <Input type="tel" autoComplete="off" {...p} {...register('phone')} />}
                </FormField>

                <FormField id="birthDate" label="Fecha de nacimiento (opcional)" error={errors.birthDate?.message}>
                    {(p) => <Input type="date" {...p} {...register('birthDate')} />}
                </FormField>

                <div className="flex items-center gap-2">
                    <Controller
                        name="notifyEmail"
                        control={control}
                        render={({ field }) => (
                            <Checkbox
                                id="notifyEmail"
                                checked={field.value}
                                onCheckedChange={(checked) => field.onChange(checked === true)}
                            />
                        )}
                    />
                    <Label htmlFor="notifyEmail" className="cursor-pointer">
                        Recibir avisos de vencimiento por email
                    </Label>
                </div>
            </form>

            <SheetFooter>
                <Button type="submit" form="user-form" disabled={isSubmitting}>
                    {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : `Crear ${roleLabel}`}
                </Button>
                <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
                    Cancelar
                </Button>
            </SheetFooter>
        </>
    )
}