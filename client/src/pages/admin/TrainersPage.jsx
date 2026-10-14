import { useState } from 'react'
import { UserCog } from 'lucide-react'
import TrainerMembersSheet from '@/components/forms/TrainerMembersSheet'
import UsersManagementPage from './UsersManagementPage'

export default function TrainersPage() {
    const [trainer, setTrainer] = useState(null)

    return (
        <>
            <UsersManagementPage
                role="PROFESOR"
                title="Profesores"
                description="Gestioná los profesores y qué socios tiene asignados cada uno."
                singular="profesor"
                plural="profesores"
                icon={UserCog}
                onManageMembers={setTrainer}
            />
            <TrainerMembersSheet trainer={trainer} onClose={() => setTrainer(null)} />
        </>
    )
}