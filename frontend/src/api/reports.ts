import { apiUrl } from './base'

export interface Assignment {
  id: number
  hotspotId: number
  name: string
  lat: number
  lng: number
  distanceToUser: number
}

export interface ReportResult {
  assignment: Assignment
}

export async function submitReport(lat: number, lng: number): Promise<ReportResult> {
  const url = apiUrl('/api/reports');
  if (!url) throw new Error('API is not configured')

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng })
  })
  if (!response.ok) throw new Error(`Report request failed (${response.status})`)

  const closest = await response.json()
  if (!closest || !Number.isFinite(closest.lat) || !Number.isFinite(closest.lng)) {
    throw new Error('Invalid report response')
  }

  return {
    assignment: {
      id: Number(closest.id),
      hotspotId: Number(closest.hotspotId),
      name: closest.name,
      lat: closest.lat,
      lng: closest.lng,
      distanceToUser: Number(closest.distanceMeters)
    }
  }
}

export interface CheckInResult {
  confirmed: boolean
}

export async function checkIn(assignmentId: number): Promise<CheckInResult> {
  const url = apiUrl('/api/reports/arrived');
  if (!url) return {confirmed: false};
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({id: assignmentId})
    });
    return {confirmed: response.ok}
  } catch {
    return {confirmed: false};
  }
}
