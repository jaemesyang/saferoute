import { apiUrl } from './base'

export interface Hotspot {
  id: number
  name: string
  lat: number
  lng: number
  assigned: number
  arrived: number
  claimedBy: string | null
}

export interface HotspotsResult {
  hotspots: Hotspot[]
}

export async function fetchHotspots(): Promise<HotspotsResult> {
  const url = apiUrl('/api/hotspots');
  if (!url) throw new Error('API is not configured')

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Hotspots request failed (${response.status})`)

  const hotspots = await response.json()
  if (!Array.isArray(hotspots)) throw new Error('Invalid hotspots response')
  return { hotspots }
}

export interface ClaimResult {
  claimedBy: string
  resolveToken: string
}

export async function claimHotspot(id: number, dispatcherName: string): Promise<ClaimResult | null> {
  const url = apiUrl('/api/hotspots/claim');

  if (!url) {
    return null;
  }

  try {
    const response = await fetch(url, {
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

export async function resolveHotspot(id: number, token: string): Promise<boolean> {
  const url = apiUrl('/api/hotspots/resolve');

  if (!url || !token) {
    return false;
  }

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, token })
    });

    return response.ok;
  } catch {
    return false;
  }
}
