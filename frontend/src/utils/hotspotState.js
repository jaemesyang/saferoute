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
      // The server is the authority on who owns a hotspot. A local claim only
      // fills the gap while our own PATCH is still in flight (and in demo mode,
      // where there is no server to ask).
      const claimedBy = spot.claimedBy ?? claims[spot.id] ?? null
      return claimedBy === spot.claimedBy ? spot : { ...spot, claimedBy }
    })
}
