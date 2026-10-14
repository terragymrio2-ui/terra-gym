import { useState } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '@/components/layout/PageHeader'
import CheckInCard from '@/components/shared/CheckInCard'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import ErrorState from '@/components/shared/ErrorState'
import SearchInput from '@/components/shared/SearchInput'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAttendanceMutations, useAttendances, useLookup } from '@/hooks/useAttendances'
import { getErrorMessage } from '@/services/api'
import { warningText, OVERRIDE_LABELS } from '@/utils/attendance'
import { todayAR } from '@/utils/dates'
import { formatTime } from '@/utils/format'

function TodayList() {
    const today = todayAR()
    const { data, isLoading, isError, refetch } = useAttendances({ from: today, to: today, page: 1, limit: 50 })

    if (isLoading) return <Skeleton className="h-24 w-full" role="status" aria-label="Cargando ingresos" />
    if (isError) return <ErrorState onRetry={refetch} />

    const items = data.items.filter((a) => !a.isVoided)
    return (
        <section aria-labelledby="today-title" className="mt-10">
            <h2 id="today-title" className="mb-3 text-lg font-medium">
                Ingresos de hoy ({data.validCount})
            </h2>
            {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todavía no se registró ningún ingreso hoy.</p>
            ) : (
                <ul className="divide-y rounded-lg border">
                    {items.map((a) => (
                        <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                            <div>
                                <p className="font-medium">
                                    {a.member.lastName}, {a.member.firstName}
                                </p>
                                <p className="text-xs text-muted-foreground">{formatTime(a.checkedInAt)} hs</p>
                            </div>
                            {a.override && (
                                <Badge variant="secondary" className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                                    Excepción: {a.overrideReasons.map((r) => OVERRIDE_LABELS[r] ?? r).join(', ')}
                                </Badge>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}

export default function ReceptionPage() {
    const [search, setSearch] = useState('')
    const [pending, setPending] = useState(null) // { member, warnings }
    const { checkIn } = useAttendanceMutations()
    const lookup = useLookup(search)

    async function register(member, confirm = false) {
        try {
            const result = await checkIn.mutateAsync({ memberId: member.id, confirm })
            setPending(null)
            const count = `${result.weekCount}${result.weekLimit ? ` de ${result.weekLimit}` : ''}`
            toast.success(`Ingreso registrado: ${member.lastName}, ${member.firstName} (${count} esta semana)`)
        } catch (error) {
            const err = error.response?.data?.error
            // El servidor tiene la última palabra: si hay algo que confirmar, se abre el diálogo
            if (err?.code === 'CONFIRMATION_REQUIRED') {
                setPending({ member, warnings: err.details?.warnings ?? member.warnings })
                return
            }
            setPending(null)
            toast.error(getErrorMessage(error))
        }
    }

    function handleCheckIn(member) {
        if (member.requiresConfirmation) setPending({ member, warnings: member.warnings })
        else register(member)
    }

    const members = lookup.data ?? []
    const description = pending
        ? `${pending.warnings.map(warningText).join(' ')} Si continuás, el ingreso queda marcado como excepción.`
        : ''

    return (
        <>
            <PageHeader title="Recepción" description="Buscá al socio por nombre o DNI y registrá su ingreso." />

            <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Nombre, apellido o DNI"
                label="Buscar socio para registrar ingreso"
                delay={300}
                className="max-w-xl [&_input]:h-12 [&_input]:text-base"
            />

            <div className="mt-4 max-w-xl" aria-live="polite">
                {search.length < 2 && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Search className="size-4" aria-hidden="true" /> Escribí al menos 2 letras.
                    </p>
                )}
                {search.length >= 2 && lookup.isLoading && <Skeleton className="h-32 w-full" role="status" aria-label="Buscando" />}
                {lookup.isError && <ErrorState onRetry={lookup.refetch} />}
                {lookup.data && members.length === 0 && (
                    <p className="text-sm text-muted-foreground">No se encontró ningún socio activo con esa búsqueda.</p>
                )}
                {members.length > 0 && (
                    <ul className="space-y-3">
                        {members.map((m) => (
                            <CheckInCard key={m.id} member={m} onCheckIn={handleCheckIn} busy={checkIn.isPending} />
                        ))}
                    </ul>
                )}
            </div>

            <TodayList />

            <ConfirmDialog
                open={!!pending}
                onOpenChange={(open) => !open && setPending(null)}
                title={pending ? `Avisos para ${pending.member.firstName} ${pending.member.lastName}` : ''}
                description={description}
                confirmLabel="Registrar igual"
                loading={checkIn.isPending}
                onConfirm={() => register(pending.member, true)}
            />
        </>
    )
}