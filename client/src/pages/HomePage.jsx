import PageHeader from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_LABELS } from '@/utils/roles'
import PendingAnnouncements from '@/components/shared/PendingAnnouncements'

export default function HomePage() {
    const { user } = useAuth()
    return (
        <>
            {user.role === 'USUARIO' && <PendingAnnouncements />}
            <PageHeader title={`Hola, ${user.firstName}`} description={`Panel de ${ROLE_LABELS[user.role]}`} />
            <Card>
                <CardHeader>
                    <CardTitle>Próximamente</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    Acá van a aparecer tus datos a medida que avancemos con las próximas etapas.
                </CardContent>
            </Card>
        </>
    )
}