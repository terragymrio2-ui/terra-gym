import { useParams } from 'react-router-dom'
import TemplateEditor from '@/components/forms/TemplateEditor'
import ErrorState from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { useTemplate } from '@/hooks/useTrainingTemplates'

export default function TemplateEditorPage() {
    const { id } = useParams() // sin id → plantilla nueva
    const { data, isLoading, isError, refetch } = useTemplate(id)

    if (!id) return <TemplateEditor />
    if (isLoading) return <Skeleton className="h-64 w-full" role="status" aria-label="Cargando plantilla" />
    if (isError) {
        return <ErrorState title="No pudimos cargar la plantilla" description="Puede que ya no exista." onRetry={refetch} />
    }
    return <TemplateEditor key={`${data.id}-${data.revision}`} template={data} />
}