import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// Compatible con react-hook-form: {...register('campo')} funciona igual que con <Input>
const PasswordInput = forwardRef(function PasswordInput({ className, onChange, ...props }, ref) {
    const [visible, setVisible] = useState(false)
    const [hasValue, setHasValue] = useState(false)

    function handleChange(e) {
        const filled = e.target.value.length > 0
        setHasValue(filled)
        if (!filled) setVisible(false) // al vaciar el campo, vuelve a ocultarse
        onChange?.(e)
    }

    return (
        <div className="relative">
            <Input
                ref={ref}
                type={visible ? 'text' : 'password'}
                className={cn('pr-10', className)}
                onChange={handleChange}
                {...props}
            />
            {hasValue && (
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={visible}
                    className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                </button>
            )}
        </div>
    )
})

export default PasswordInput