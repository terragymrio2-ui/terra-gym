import { useEffect, useState } from 'react'

export function useCountUp(target, duration = 700) {
    const [value, setValue] = useState(target)

    useEffect(() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (reduce || !Number.isFinite(target)) {
            setValue(target)
            return
        }
        let frame
        const start = performance.now()
        const tick = (now) => {
            const p = Math.min((now - start) / duration, 1)
            const eased = 1 - (1 - p) ** 3 // desacelera al final
            setValue(Math.round(target * eased))
            if (p < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [target, duration])

    return value
}