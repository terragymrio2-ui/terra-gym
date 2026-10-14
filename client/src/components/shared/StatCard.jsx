import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useCountUp } from '@/hooks/useCountUp'

function AnimatedValue({ value, format }) {
    const n = useCountUp(value)
    return <>{format ? format(n) : n}</>
}

export default function StatCard({
    title,
    value,
    hint,
    icon: Icon,
    tone,
    format,
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>

                {Icon && (
                    <Icon
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                    />
                )}
            </CardHeader>

            <CardContent>
                <p
                    className={cn(
                        'text-2xl font-semibold tracking-tight font-display',
                        tone === 'warning' &&
                        'text-amber-700 dark:text-amber-400',
                        tone === 'danger' &&
                        'text-red-700 dark:text-red-400',
                    )}
                >
                    {typeof value === 'number' ? (
                        <AnimatedValue value={value} format={format} />
                    ) : (
                        value
                    )}
                </p>

                {hint && (
                    <p className="mt-1 text-xs text-muted-foreground">
                        {hint}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
