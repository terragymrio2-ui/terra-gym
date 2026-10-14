import { Ban } from 'lucide-react'
import StatusBadge from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/utils/format'
import { PAYMENT_METHODS } from '@/utils/payments'

// onRegisterPayment / onVoidPayment son opcionales: sin ellos es solo lectura (vista del socio)
export default function MembershipHistory({ memberships, onRegisterPayment, onVoidPayment }) {
    return (
        <ul className="space-y-4">
            {memberships.map((m) => (
                <li key={m.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                            <p className="font-medium">{m.plan.name}</p>
                            <p className="text-sm text-muted-foreground">
                                {formatDate(m.startDate)} → {formatDate(m.endDate)}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <StatusBadge status={m.status} />
                            {m.status !== 'CANCELADA' && <StatusBadge status={m.paymentStatus} />}
                        </div>
                    </div>

                    <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                        <div>
                            <dt className="text-xs text-muted-foreground">Precio</dt>
                            <dd className="font-medium">{formatCurrency(m.price)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-muted-foreground">Pagado</dt>
                            <dd className="font-medium">{formatCurrency(m.paid)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-muted-foreground">Debe</dt>
                            <dd className="font-medium">{m.status === 'CANCELADA' ? '—' : formatCurrency(m.balance)}</dd>
                        </div>
                    </dl>

                    {m.payments.length > 0 && (
                        <ul className="mt-3 divide-y rounded-md border text-sm">
                            {m.payments.map((p) => (
                                <li key={p.id} className="flex items-center justify-between gap-2 p-2">
                                    <div className={p.isVoided ? 'text-muted-foreground line-through' : ''}>
                                        <p>
                                            {formatCurrency(p.amount)} · {PAYMENT_METHODS[p.method]}
                                        </p>
                                        <p className="text-xs">{formatDate(p.paidAt)}</p>
                                    </div>
                                    {p.isVoided ? (
                                        <p className="text-right text-xs text-muted-foreground">Anulado: {p.voidReason}</p>
                                    ) : (
                                        onVoidPayment && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onVoidPayment(p)}
                                                aria-label={`Anular pago de ${formatCurrency(p.amount)}`}
                                            >
                                                <Ban aria-hidden="true" /> Anular
                                            </Button>
                                        )
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}

                    {onRegisterPayment && m.status !== 'CANCELADA' && m.balance > 0 && (
                        <Button className="mt-3" size="sm" onClick={() => onRegisterPayment(m)}>
                            Registrar pago
                        </Button>
                    )}
                </li>
            ))}
        </ul>
    )
}