export default function EmptyState({ icon: Icon, title, description, action }) {
    return (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
            {Icon && <Icon className="size-8 text-muted-foreground" aria-hidden="true" />}
            <h2 className="font-medium">{title}</h2>
            {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
            {action}
        </div>
    )
}