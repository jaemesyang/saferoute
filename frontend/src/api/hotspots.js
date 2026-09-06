/**
 * @typedef {Object} Hotspot
 * @property {string} id
 * @property {string} name
 * @property {number} lat
 * @property {number} lng
 * @property {number} assigned
 * @property {number} arrived
 * @property {string | null} claimedBy
 */

/**
 * @typedef {Object} HotspotsResult
 * @property {Hotspot[]} hotspots
 * @property {boolean} isStub
 */

/**
 * @type {{ id: string, name: string, lat: number, lng: number }[]}
 */
export const PREDETERMINED_HOTSPOTS = [
  { name: 'Lincoln High School', lat: 40.8066, lng: -96.688649 },
  { name: 'Miller Middle School', lat: 41.2698, lng: -95.9745 },
  { name: 'Kennedy High School', lat: 41.2958, lng: -96.0313 },
  { name: 'North High Magnet School', lat: 41.2924, lng: -95.9406 },
  { name: 'Omaha South Magnet High School', lat: 41.2133, lng: -95.9438 },
  { name: 'Creighton University', lat: 41.2659, lng: -95.9451 },
  { name: 'Metropolitan Community College Fort Omaha Campus', lat: 41.2812, lng: -95.9284 },
  { name: 'Baxter Arena', lat: 41.2336, lng: -95.9569 }
].map((loc, i) => ({ ...loc, id: `stub-${i}` }))

/**
 * @returns {Promise<HotspotsResult>}
 */
export async function fetchHotspots() {
  const baseUrl = import.meta.env?.VITE_API_URL;

  if (!baseUrl) {
    return { hotspots: await getStubHotspots(), isStub: true };
  }

  try {
    const response = await fetch(`${baseUrl}/api/hotspots`);
    if (!response.ok) {
      return { hotspots: await getStubHotspots(), isStub: true };
    }
    return { hotspots: await response.json(), isStub: false };
  } catch {
    return { hotspots: await getStubHotspots(), isStub: true };
  }
}

/** @returns {Promise<{ claimedBy: string, resolveToken: string } | null>} */
export async function claimHotspot(id, dispatcherName, apiUrl) {
  const baseUrl = apiUrl ?? import.meta.env?.VITE_API_URL;

  if (!baseUrl) {
    return null;
  }

  try {
    const response = await fetch(`${baseUrl}/api/hotspots/claim`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, dispatcherName })
    });

    if (!response.ok) return null;

    return response.json();
  } catch {
    return null;
  }
}

/** @returns {Promise<boolean>} */
export async function resolveHotspot(id, token, apiUrl) {
  const baseUrl = apiUrl ?? import.meta.env?.VITE_API_URL;

  if (!baseUrl || !token) {
    return false;
  }

  try {
    const response = await fetch(`${baseUrl}/api/hotspots/resolve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, token })
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * @type {Map<string, string>}
 */
const STUB_CLAIMS = new Map(
  PREDETERMINED_HOTSPOTS.filter((_, i) => i % 4 === 0).map(loc => [loc.id, 'dispatchera'])
);

/**
 * @type {Map<string, { assigned: number, arrived: number }> | null}
 */
let stubCounts = null;

/**
 * @returns {Map<string, { assigned: number, arrived: number }>}
 */
function driftStubCounts() {
  if (!stubCounts) {
    stubCounts = new Map(
      PREDETERMINED_HOTSPOTS.map(loc => {
        const assigned = Math.floor(Math.random() * 60) + 1
        return [loc.id, { assigned, arrived: Math.floor(Math.random() * (assigned + 1)) }]
      })
    );
    return stubCounts;
  }

  for (const [id, counts] of stubCounts) {
    const assigned = Math.max(1, counts.assigned + Math.floor(Math.random() * 7) - 3)
    stubCounts.set(id, {
      assigned,
      arrived: Math.min(assigned, Math.max(0, counts.arrived + Math.floor(Math.random() * 5) - 2)),
    })
  }
  return stubCounts;
}

/**
 * @returns {Promise<Hotspot[]>}
 */
export async function getStubHotspots() {
  await new Promise(resolve => setTimeout(resolve, 500));

  const counts = driftStubCounts();

  return PREDETERMINED_HOTSPOTS.map(loc => ({
    ...loc,
    ...(counts.get(loc.id) ?? { assigned: 1, arrived: 0 }),
    claimedBy: STUB_CLAIMS.get(loc.id) ?? null
  }))
}
