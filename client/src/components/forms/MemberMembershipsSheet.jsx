import { useState } from 'react'
import ErrorState from '@/components/shared/ErrorState'
import MembershipHistory from '@/components/shared/MembershipHistory'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useMemberships } from '@/hooks/useMemberships'
import PaymentFormDialog from './PaymentFormDialog'
import VoidPaymentDialog from './VoidPaymentDialog'

function Content({ member }) {
    const [toPay, setToPay] = useState(null)
    const [toVoid, setToVoid] = useState(null)
    const { data, isLoading, isError, refetch } = useMemberships({
        userId: member.id,
        current: false,
        limit: 50,
    })
    const memberships = data?.items ?? []

    // El diálogo trabaja sobre la versión más reciente (después de pagar se actualiza el saldo)
    const payTarget = toPay && memberships.find((m) => m.id === toPay.id)

    return (
        <>
            <SheetHeader>
                <SheetTitle>
                    {member.lastName}, {member.firstName}
                </SheetTitle>
                <SheetDescription>Todos los períodos y pagos de este socio.</SheetDescription>
            </SheetHeader>

            <div className="px-4 pb-4">
                {isLoading && <Skeleton className="h-40 w-full" role="status" aria-label="Cargando" />}
                {isError && <ErrorState onRetry={refetch} />}
                {data && memberships.length === 0 && (
                    <p className="text-sm text-muted-foreground">Este socio todavía no tiene membresías.</p>
                )}
                {memberships.length > 0 && (
                    <MembershipHistory
                        memberships={memberships}
                        onRegisterPayment={setToPay}
                        onVoidPayment={setToVoid}
                    />
                )}
            </div>

            <PaymentFormDialog membership={payTarget ?? null} onClose={() => setToPay(null)} />
            <VoidPaymentDialog payment={toVoid} onClose={() => setToVoid(null)} />
        </>
    )
}

export default function MemberMembershipsSheet({ member, onClose }) {
    return (
        <Sheet open={!!member} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
                {member && <Content member={member} />}
            </SheetContent>
        </Sheet>
    )
}