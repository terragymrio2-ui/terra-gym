import { CircleAlert, Info, UserCheck } from 'lucide-react'
import StatusBadge from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { warningText } from '@/utils/attendance'

function Warning({ warning }) {
    const isConfirm = warning.level === 'confirm'
    const Icon = isConfirm ? CircleAlert : Info
    return (
        <li
            className={cn(
                'flex items-start gap-2 rounded-md border p-2 text-sm',
                isConfirm
                    ? 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200'
                    : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
            )}
        >
            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{warningText(warning)}</span>
        </li>
    )
}

export default function CheckInCard({ member, onCheckIn, busy }) {
    const { membership } = member
    const clean = member.warnings.length === 0

    return (
        <li className="rounded-lg border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-lg font-medium">
                        {member.lastName}, {member.firstName}
                    </p>
                    <p className="text-sm text-muted-foreground">DNI {member.dni ?? '—'}</p>
                </div>
                {membership ? (
                    <StatusBadge status={membership.status} />
                ) : (
                    <Badge variant="secondary">Sin membresía</Badge>
                )}
            </div>

            {membership && (
                <p className="mt-2 text-sm">
                    {membership.planName}
                    {member.weekLimit !== null && (
                        <span className="text-muted-foreground">
                            {' '}
                            · Esta semana: {member.weekCount} de {member.weekLimit}
                        </span>
                    )}
                </p>
            )}

            {clean && membership && (
                <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                    <UserCheck className="size-4" aria-hidden="true" /> Todo en orden.
                </p>
            )}

            {!clean && (
                <ul className="mt-3 space-y-2">
                    {member.warnings.map((w) => (
                        <Warning key={w.code} warning={w} />
                    ))}
                </ul>
            )}

            <div className="mt-4">
                {member.checkedInToday ? (
                    <Button disabled className="w-full sm:w-auto">
                        Ya registró su ingreso hoy
                    </Button>
                ) : (
                    <Button
                        className="w-full sm:w-auto"
                        variant={member.requiresConfirmation ? 'outline' : 'default'}
                        disabled={busy}
                        onClick={() => onCheckIn(member)}
                    >
                        {member.requiresConfirmation ? 'Registrar con aviso...' : 'Registrar ingreso'}
                    </Button>
                )}
            </div>
        </li>
    )
}