import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Archive, ArchiveRestore, Megaphone } from 'lucide-react'
import { toast } from 'sonner'
import FormField from '@/components/forms/FormField'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import Pagination from '@/components/shared/Pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
    useAnnouncementMutations,
    useAnnouncements,
    useAudienceCount,
} from '@/hooks/useAnnouncements'
import { getErrorMessage } from '@/services/api'
import { AUDIENCES } from '@/utils/announcements'
import { formatDate } from '@/utils/format'

const schema = z.object({
    audience: z.string().min(1, 'Elegí los destinatarios'),
    title: z.string().trim().min(1, 'Ingresá el título').max(100, 'Máximo 100 caracteres'),
    message: z.string().trim().min(1, 'Ingresá el mensaje').max(1000, 'Máximo 1000 caracteres'),
})

function Composer() {
    const { create } = useAnnouncementMutations()
    const {
        control,
        register,
        handleSubmit,
        reset,
        watch,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { audience: 'TODOS', title: '', message: '' },
    })

    const audience = watch('audience')
    const message = watch('message')
    const count = useAudienceCount(audience)

    async function onSubmit(values) {
        try {
            const result = await create.mutateAsync(values)
            toast.success(`Aviso enviado a ${result.recipients} ${result.recipients === 1 ? 'socio' : 'socios'}`)
            reset({ audience: values.audience, title: '', message: '' })
        } catch (error) {
            const code = error.response?.data?.error?.code
            if (code === 'NO_RECIPIENTS') setError('audience', { message: 'Ningún socio coincide con esos destinatarios' })
            else toast.error(getErrorMessage(error))
        }
    }

    return (
        <Card className="mb-8 max-w-2xl">
            <CardHeader>
                <CardTitle>Nuevo aviso</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    <Controller
                        name="audience"
                        control={control}
                        render={({ field }) => (
                            <FormField
                                id="audience"
                                label="Destinatarios"
                                error={errors.audience?.message}
                                hint={
                                    count.isLoading
                                        ? 'Calculando...'
                                        : count.data
                                            ? `Lo van a recibir ${count.data.count} ${count.data.count === 1 ? 'socio' : 'socios'}.`
                                            : undefined
                                }
                            >
                                {(p) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger id={p.id} className="w-full sm:w-72">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(AUDIENCES).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </FormField>
                        )}
                    />

                    <FormField id="title" label="Título" error={errors.title?.message}>
                        {(p) => <Input autoComplete="off" placeholder="Ej: Información importante" {...p} {...register('title')} />}
                    </FormField>

                    <FormField
                        id="message"
                        label="Mensaje"
                        error={errors.message?.message}
                        hint={`${message?.length ?? 0} de 1000 caracteres`}
                    >
                        {(p) => (
                            <Textarea
                                rows={4}
                                placeholder="Ej: El lunes permanecemos cerrados por feriado."
                                {...p}
                                {...register('message')}
                            />
                        )}
                    </FormField>

                    <Button type="submit" disabled={isSubmitting || count.data?.count === 0}>
                        {isSubmitting ? 'Enviando...' : 'Enviar aviso'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

function History() {
    const [page, setPage] = useState(1)
    const { data, isLoading, isError, refetch } = useAnnouncements({ page, limit: 10 })
    const { setStatus } = useAnnouncementMutations()

    async function toggle(a) {
        try {
            await setStatus.mutateAsync({ id: a.id, isActive: !a.isActive })
            toast.success(a.isActive ? 'Aviso archivado' : 'Aviso reactivado')
        } catch (error) {
            toast.error(getErrorMessage(error))
        }
    }

    if (isLoading) return <Skeleton className="h-32 w-full" role="status" aria-label="Cargando avisos" />
    if (isError) return <ErrorState onRetry={refetch} />
    if (!data.items.length) {
        return (
            <EmptyState
                icon={Megaphone}
                title="Todavía no enviaste avisos"
                description="Usá el formulario de arriba para enviar el primero."
            />
        )
    }

    return (
        <>
            <ul className="space-y-3">
                {data.items.map((a) => (
                    <li key={a.id} className="rounded-lg border p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="font-medium">{a.title}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDate(a.createdAt)} · {a.createdBy} · {AUDIENCES[a.audience]}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {!a.isActive && <Badge variant="secondary">Archivado</Badge>}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggle(a)}
                                    disabled={setStatus.isPending}
                                    aria-label={`${a.isActive ? 'Archivar' : 'Reactivar'} el aviso ${a.title}`}
                                >
                                    {a.isActive ? <Archive aria-hidden="true" /> : <ArchiveRestore aria-hidden="true" />}
                                    {a.isActive ? 'Archivar' : 'Reactivar'}
                                </Button>
                            </div>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm">{a.message}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                            Leído por {a.readCount} de {a.recipients}
                        </p>
                    </li>
                ))}
            </ul>
            <Pagination
                page={page}
                totalPages={data.pagination.totalPages}
                total={data.pagination.total}
                onPageChange={setPage}
            />
        </>
    )
}

export default function AnnouncementsPage() {
    return (
        <>
            <PageHeader
                title="Avisos a socios"
                description="Los socios ven el aviso al entrar a su inicio y lo marcan como leído con “Entendido”."
            />
            <Composer />
            <h2 className="mb-3 text-lg font-medium">Avisos enviados</h2>
            <History />
        </>
    )
}