/** 
 * @typedef {Object} LocalHotspotState
 * @property {Record<string, string>} claims hotspot id -> dispatcher who claimed it
 * @property {string[]} resolvedIds hotspots this dispatcher has already cleared
 */

/**
 * @param {import('../api/hotspots.js').Hotspot[]} incoming
 * @param {LocalHotspotState} local
 * @returns {import('../api/hotspots.js').Hotspot[]}
 */
export function mergeHotspots(incoming, { claims, resolvedIds }) {
  const resolved = new Set(resolvedIds)

  return incoming
    .filter((spot) => !resolved.has(spot.id))
    .map((spot) => {
      const claimedBy = claims[spot.id] ?? spot.claimedBy ?? null
      return claimedBy === spot.claimedBy ? spot : { ...spot, claimedBy }
    })
}
