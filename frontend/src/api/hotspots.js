/**
 * @typedef {Object} Hotspot
 * @property {string} id
 * @property {string} name
 * @property {number} lat
 * @property {number} lng
 * @property {number} headcount
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

/**
 * @returns {Promise<Hotspot[]>}
 */
export async function getStubHotspots() {
  await new Promise(resolve => setTimeout(resolve, 500));

  return PREDETERMINED_HOTSPOTS.map((loc, i) => ({
    ...loc,
    headcount: Math.floor(Math.random() * 60) + 1,
    claimedBy: i % 4 === 0 ? 'dispatchera' : null
  }))
}
