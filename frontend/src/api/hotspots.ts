import { apiFetch } from './base'

export interface Hotspot {
  id: number
  name: string
  lat: number
  lng: number
  assigned: number
  arrived: number
  claimedBy: string | null
}

export async function fetchHotspots(): Promise<Hotspot[]> {
  const response = await apiFetch('/api/hotspots')

  const hotspots = await response.json()
  if (!Array.isArray(hotspots)) throw new Error('Invalid response')
  return hotspots
}

export interface ClaimResult {
  claimedBy: string | null
  resolveToken: string | null
}

export async function claimHotspot(id: number, dispatcherName: string): Promise<ClaimResult> {
  const response = await apiFetch('/api/hotspots/claim', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, dispatcherName })
    })
  return response.json()
}

export async function resolveHotspot(id: number, token: string): Promise<boolean> {
  await apiFetch('/api/hotspots/resolve', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, token })
    })
  return true
}
