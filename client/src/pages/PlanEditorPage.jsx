import { useParams } from 'react-router-dom'
import TemplateEditor from '@/components/forms/TemplateEditor'
import ErrorState from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { usePlan } from '@/hooks/useTrainingPlans'

const BACK = '/socios-rutinas'

export default function PlanEditorPage() {
    const { id, memberId } = useParams() // sin id → rutina nueva para memberId
    const { data, isLoading, isError, refetch } = usePlan(id)

    if (!id) return <TemplateEditor kind="plan" memberId={Number(memberId)} backTo={BACK} />
    if (isLoading) return <Skeleton className="h-64 w-full" role="status" aria-label="Cargando rutina" />
    if (isError) {
        return <ErrorState title="No pudimos cargar la rutina" description="Puede que ya no exista." onRetry={refetch} />
    }
    return <TemplateEditor key={`${data.id}-${data.revision}`} kind="plan" template={data} backTo={BACK} />
}