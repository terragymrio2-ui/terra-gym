import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
    return (
        <main className="grid min-h-screen place-items-center p-4 text-center">
            <div className="space-y-4">
                <p className="text-5xl font-semibold text-primary">404</p>
                <h1 className="text-xl font-medium">Esta página no existe</h1>
                <Button asChild>
                    <Link to="/">Volver al inicio</Link>
                </Button>
            </div>
        </main>
    )
}