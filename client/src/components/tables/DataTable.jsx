import ErrorState from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// columns: [{ header, cell: (row) => node, className?, srOnly? }]
export default function DataTable({
    columns,
    rows = [],
    getRowId,
    renderCard,
    isLoading,
    isError,
    onRetry,
    empty,
}) {
    if (isError) return <ErrorState onRetry={onRetry} />

    if (isLoading) {
        return (
            <div className="space-y-3" role="status" aria-label="Cargando datos">
                {Array.from({ length: 5 }, (_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                ))}
            </div>
        )
    }

    if (!rows.length) return empty

    return (
        <>
            <div className="hidden rounded-lg border md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col) => (
                                <TableHead key={col.header} className={col.className}>
                                    {col.srOnly ? <span className="sr-only">{col.header}</span> : col.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={getRowId(row)}>
                                {columns.map((col) => (
                                    <TableCell key={col.header} className={col.className}>
                                        {col.cell(row)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <ul className="space-y-3 md:hidden">
                {rows.map((row) => (
                    <li key={getRowId(row)} className="rounded-lg border p-4">
                        {renderCard(row)}
                    </li>
                ))}
            </ul>
        </>
    )
}