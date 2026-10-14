import { ClipboardList, ExternalLink } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import EmptyState from '@/components/shared/EmptyState'
import ErrorState from '@/components/shared/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMyPlan } from '@/hooks/useTrainingPlans'
import { BLOCKS } from '@/utils/exercises'
import { formatDate } from '@/utils/format'

function Detail({ label, value }) {
    if (value === null || value === undefined || value === '') return null
    return (
        <div>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-medium">{value}</dd>
        </div>
    )
}

function ExerciseCard({ exercise, index }) {
    return (
        <li className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2">
                <p className="font-medium">
                    {index + 1}. {exercise.exerciseName}
                </p>
                <Badge variant="secondary" className="shrink-0">
                    {BLOCKS[exercise.block]}
                </Badge>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <Detail label="Series" value={exercise.sets} />
                <Detail label="Repeticiones" value={exercise.reps} />
                <Detail label="Descanso" value={exercise.restSeconds != null ? `${exercise.restSeconds} seg` : null} />
                <Detail label="Intensidad" value={exercise.intensity} />
                <Detail label="Peso sugerido" value={exercise.suggestedWeight != null ? `${exercise.suggestedWeight} kg` : null} />
            </dl>

            {exercise.notes && (
                <p className="mt-3 rounded-md bg-muted/50 p-2 text-sm">
                    <span className="font-medium">Profe: </span>
                    {exercise.notes}
                </p>
            )}

            {exercise.videoUrl && (
                <a
                    href={exercise.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Ver video de ${exercise.exerciseName} (se abre en una pestaña nueva)`}
                    className="mt-3 inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
                >
                    Ver video <ExternalLink className="size-3" aria-hidden="true" />
                </a>
            )}
        </li>
    )
}

export default function MyPlanPage() {
    const { data: plan, isLoading, isError, refetch } = useMyPlan()

    if (isLoading) return <Skeleton className="h-48 w-full" role="status" aria-label="Cargando" />
    if (isError) return <ErrorState onRetry={refetch} />

    if (!plan) {
        return (
            <>
                <PageHeader title="Mi rutina" />
                <EmptyState
                    icon={ClipboardList}
                    title="Todavía no tenés una rutina"
                    description="Tu profesor te va a cargar una pronto. Consultalo en el gimnasio."
                />
            </>
        )
    }

    return (
        <>
            <PageHeader
                title={plan.name}
                description={`Desde el ${formatDate(plan.startDate)}${plan.objective ? ` · ${plan.objective}` : ''}`}
            />

            {plan.notes && <p className="mb-4 rounded-lg border bg-muted/50 p-3 text-sm">{plan.notes}</p>}

            <Tabs defaultValue="0">
                <TabsList className="mb-4 h-auto flex-wrap justify-start">
                    {plan.days.map((d, i) => (
                        <TabsTrigger key={d.id} value={String(i)}>
                            {d.name}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {plan.days.map((d, i) => (
                    <TabsContent key={d.id} value={String(i)}>
                        {d.exercises.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Este día no tiene ejercicios.</p>
                        ) : (
                            <ul className="space-y-3">
                                {d.exercises.map((e, idx) => (
                                    <ExerciseCard key={e.id} exercise={e} index={idx} />
                                ))}
                            </ul>
                        )}
                    </TabsContent>
                ))}
            </Tabs>
        </>
    )
}