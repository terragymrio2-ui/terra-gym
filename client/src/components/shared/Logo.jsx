import darkLogo from '@/assets/terragym-logo-dark.png'
import lightLogo from '@/assets/terragym-icon.png'
import { cn } from '@/lib/utils'

// Muestra la versión que se lee bien según el tema (la clase "dark" vive en <html>)
export default function Logo({ className = 'h-10 w-auto' }) {
    return (
        <>
            <img src={lightLogo} alt="TerraGym" className={cn('object-contain dark:hidden', className)} />
            <img src={darkLogo} alt="TerraGym" className={cn('hidden object-contain dark:block', className)} />
        </>
    )
}