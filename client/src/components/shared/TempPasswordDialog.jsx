import { Copy, MessageCircle, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { buildWhatsAppUrl } from '@/utils/whatsapp'

// credentials: { user, password, reset }. Si es null no se muestra nada.
export default function TempPasswordDialog({ credentials, onClose }) {
    if (!credentials) return null
    const { user, password, reset } = credentials

    const message =
        `¡Hola ${user.firstName}! Te damos la bienvenida a TerraGym.\n` +
        `Ingresá en ${window.location.origin}\n` +
        `Email: ${user.email}\n` +
        `Contraseña temporal: ${password}\n` +
        `Al entrar te va a pedir que la cambies.`

    async function copy() {
        try {
            await navigator.clipboard.writeText(password)
            toast.success('Contraseña copiada')
        } catch {
            toast.error('No se pudo copiar. Seleccionala y copiala manualmente.')
        }
    }

    return (
        <Dialog open onOpenChange={() => { }}>
            <DialogContent
                // Solo se cierra con el botón: la contraseña no se vuelve a mostrar
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                showCloseButton={false}
            >
                <DialogHeader>
                    <DialogTitle>{reset ? 'Contraseña restablecida' : 'Usuario creado'}</DialogTitle>
                    <DialogDescription>
                        Contraseña temporal para {user.firstName} {user.lastName}. Va a tener que cambiarla al
                        ingresar.
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-md border bg-muted/50 p-4 text-center">
                    <code className="select-all text-xl font-semibold tracking-wider">{password}</code>
                </div>

                <div
                    role="alert"
                    className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
                >
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <p>Guardala ahora: por seguridad no se puede volver a ver. Si se pierde, se genera otra.</p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                    <Button variant="outline" onClick={copy}>
                        <Copy aria-hidden="true" /> Copiar
                    </Button>
                    <Button variant="outline" asChild>
                        <a
                            href={buildWhatsAppUrl({ phone: user.phone, text: message })}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <MessageCircle aria-hidden="true" /> Enviar por WhatsApp
                        </a>
                    </Button>
                </div>

                <DialogFooter>
                    <Button onClick={onClose}>Listo, ya la guardé</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}