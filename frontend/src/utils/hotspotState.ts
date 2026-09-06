import type { Hotspot } from '../api/hotspots'

export interface LocalHotspotState {
  claims: Record<number, string>
  resolvedIds: number[]
}

export function mergeHotspots(incoming: Hotspot[], { claims, resolvedIds }: LocalHotspotState): Hotspot[] {
  const resolved = new Set(resolvedIds)

  return incoming
    .filter((spot) => !resolved.has(spot.id))
    .map((spot) => {
      const claimedBy = spot.claimedBy ?? claims[spot.id] ?? null
      return claimedBy === spot.claimedBy ? spot : { ...spot, claimedBy }
    })
}
