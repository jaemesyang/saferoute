import { useEffect } from 'react'

export function usePolling(load: () => void, intervalMs: number): void {
    useEffect(() => {
        load();
        if (!(intervalMs > 0)) return
        const id = setInterval(load, intervalMs)
        return () => { clearInterval(id) }
    }, [load, intervalMs])
}
