import { useEffect } from 'react'
/**
 * Run `load` immediately, then on an interval. Pass an interval of 0 (or less)
 * to run once and stop — without this guard setInterval(fn, 0) spins as fast as
 * the event loop allows.
 */
export function usePolling(load: () => void, intervalMs: number): void {
    useEffect(() => {
        load();
        if (!(intervalMs > 0)) return
        const id = setInterval(load, intervalMs)
        return () => { clearInterval(id) }
    }, [load, intervalMs])
}
