export interface Hotspot {
  id: string
  name: string
  lat: number
  lng: number
  assigned: number
  arrived: number
  claimedBy: string | null
}

export interface HotspotsResult {
  hotspots: Hotspot[]
  isStub: boolean
}

export const PREDETERMINED_HOTSPOTS: { id: string, name: string, lat: number, lng: number }[] = [
  { name: 'Lincoln High School', lat: 40.8066, lng: -96.688649 },
  { name: 'Miller Middle School', lat: 41.2698, lng: -95.9745 },
  { name: 'Kennedy High School', lat: 41.2958, lng: -96.0313 },
  { name: 'North High Magnet School', lat: 41.2924, lng: -95.9406 },
  { name: 'Omaha South Magnet High School', lat: 41.2133, lng: -95.9438 },
  { name: 'Creighton University', lat: 41.2659, lng: -95.9451 },
  { name: 'Metropolitan Community College Fort Omaha Campus', lat: 41.2812, lng: -95.9284 },
  { name: 'Baxter Arena', lat: 41.2336, lng: -95.9569 }
].map((loc, i) => ({ ...loc, id: `stub-${i}` }))

export async function fetchHotspots(): Promise<HotspotsResult> {
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

export interface ClaimResult {
  claimedBy: string
  resolveToken: string
}

export async function claimHotspot(id: string, dispatcherName: string, apiUrl?: string): Promise<ClaimResult | null> {
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

export async function resolveHotspot(id: string, token: string, apiUrl?: string): Promise<boolean> {
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

const STUB_CLAIMS = new Map<string, string>(
  PREDETERMINED_HOTSPOTS.filter((_, i) => i % 4 === 0).map(loc => [loc.id, 'dispatchera'])
);

let stubCounts: Map<string, { assigned: number, arrived: number }> | null = null;

function driftStubCounts(): Map<string, { assigned: number, arrived: number }> {
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

export async function getStubHotspots(): Promise<Hotspot[]> {
  await new Promise(resolve => setTimeout(resolve, 500));

  const counts = driftStubCounts();

  return PREDETERMINED_HOTSPOTS.map(loc => ({
    ...loc,
    ...(counts.get(loc.id) ?? { assigned: 1, arrived: 0 }),
    claimedBy: STUB_CLAIMS.get(loc.id) ?? null
  }))
}
