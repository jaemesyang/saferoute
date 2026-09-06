import type { Hotspot } from '../api/hotspots'

export interface LocalHotspotState {
  /** hotspot id -> dispatcher who claimed it */
  claims: Record<string, string>
  /** hotspots this dispatcher has already cleared */
  resolvedIds: string[]
}

export function mergeHotspots(incoming: Hotspot[], { claims, resolvedIds }: LocalHotspotState): Hotspot[] {
  const resolved = new Set(resolvedIds)

  return incoming
    .filter((spot) => !resolved.has(spot.id))
    .map((spot) => {
      // The server is the authority on who owns a hotspot. A local claim only
      // fills the gap while our own PATCH is still in flight (and in demo mode,
      // where there is no server to ask).
      const claimedBy = spot.claimedBy ?? claims[spot.id] ?? null
      return claimedBy === spot.claimedBy ? spot : { ...spot, claimedBy }
    })
}
