import { useEffect } from 'react'
/**
 *
 * @param {() => void} load 
 * @param {number} intervalMs
 * @returns {void}
 */

export function usePolling(load, intervalMs) {
    useEffect(() => {
        load();
        const id = setInterval(load, intervalMs)
        return () => { clearInterval(id) }
    }, [load, intervalMs])
}
