import { Users } from 'lucide-react'
import UsersManagementPage from './UsersManagementPage'

export default function MembersPage() {
    return (
        <UsersManagementPage
            role="USUARIO"
            title="Socios"
            description="Alta, edición y estado de los socios del gimnasio."
            singular="socio"
            plural="socios"
            icon={Users}
        />
    )
}