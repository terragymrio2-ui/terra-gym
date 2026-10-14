import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// rows: [{ label, value }] → tabla alternativa solo para lectores de pantalla
export default function ChartCard({ title, description, rows, isEmpty, children }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                {isEmpty ? (
                    <p className="grid h-48 place-items-center text-sm text-muted-foreground">
                        Todavía no hay datos para mostrar.
                    </p>
                ) : (
                    <>
                        <div aria-hidden="true">{children}</div>
                        <table className="sr-only">
                            <caption>{title}</caption>
                            <tbody>
                                {rows.map((r) => (
                                    <tr key={r.label}>
                                        <th scope="row">{r.label}</th>
                                        <td>{r.value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
            </CardContent>
        </Card>
    )
}