import { apiFetch } from './base'

export interface Assignment {
  id: number
  hotspotId: number
  name: string
  lat: number
  lng: number
  distanceToUser: number
  qrToken: string
}

export interface ReportResult {
  assignment: Assignment
}

export async function submitReport(lat: number, lng: number): Promise<ReportResult> {
  const response = await apiFetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng })
  })
  const closest = await response.json()
  if (!closest || !Number.isFinite(closest.lat) || !Number.isFinite(closest.lng)) {
    throw new Error('Invalid response')
  }

  return {
    assignment: {
      id: Number(closest.id),
      hotspotId: Number(closest.hotspotId),
      name: closest.name,
      lat: closest.lat,
      lng: closest.lng,
      distanceToUser: Number(closest.distanceMeters),
      qrToken: closest.qrToken
    }
  }
}

export async function checkIn(assignmentId: number): Promise<void> {
  await apiFetch('/api/reports/arrived', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({id: assignmentId})
    })
}

export async function fetchReportStatus(token: string): Promise<'assigned' | 'arrived' | 'pickedup'> {
  const response = await apiFetch(`/api/reports/status/${encodeURIComponent(token)}`, { cache: 'no-store' })
  const result = await response.json()
  if (!['assigned', 'arrived', 'pickedup'].includes(result?.status)) {
    throw new Error('Invalid response')
  }
  return result.status
}

export type PickupResult =
  | {
      status: 'pickedup' | 'already_pickedup'
      pickedUp: number
      total: number
      remaining: number
      allPickedUp: boolean
    }
  | { status: 'invalid' }

export async function pickup(token: string): Promise<PickupResult> {
  const response = await apiFetch('/api/reports/pickup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
  return response.json()
}
