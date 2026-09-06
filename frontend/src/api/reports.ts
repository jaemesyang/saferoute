import { apiUrl } from './base'
import { PREDETERMINED_HOTSPOTS } from './hotspots'
import { pickClosest, type Coords } from '../utils/geo'

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
  isStub: boolean
}

export async function submitReport(lat: number, lng: number): Promise<ReportResult> {
  const coords = { lat, lng };
  const url = apiUrl('/api/reports');

  if (!url) {
    return { assignment: await getStubAssignment(coords), isStub: true };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(coords)
    });
    if (!response.ok) {
      return { assignment: await getStubAssignment(coords), isStub: true };
    }

    const closest = await response.json();
    if (!closest || !Number.isFinite(closest.lat) || !Number.isFinite(closest.lng)) {
      return { assignment: await getStubAssignment(coords), isStub: true };
    }

    return {
      assignment: {
        id: Number(closest.id),
        hotspotId: Number(closest.hotspotId),
        name: closest.name,
        lat: closest.lat,
        lng: closest.lng,
        distanceToUser: Number.isFinite(closest.distanceMeters)
          ? closest.distanceMeters
          : pickClosest(coords, [closest])?.meters ?? 0
      },
      isStub: false
    };
  } catch {
    return { assignment: await getStubAssignment(coords), isStub: true };
  }
}

export interface CheckInResult {
  confirmed: boolean
  isStub: boolean
}

export async function checkIn(assignmentId: number): Promise<CheckInResult> {
  const url = apiUrl('/api/reports/arrived');
  if (!url) {
    return {confirmed: false, isStub: true};
  }
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({id: assignmentId})
    });
    if (!response.ok) {
      return {confirmed: false, isStub: true};
    }
    return {confirmed: true, isStub: false}
  } catch {
    return {confirmed: false, isStub: true};
  }
}

export async function getStubAssignment(coords: Coords): Promise<Assignment> {
  await new Promise(resolve => setTimeout(resolve, 500));

  const closest = pickClosest(coords, PREDETERMINED_HOTSPOTS);
  if (!closest) {
    throw new Error('Cannot pick a safe place without a position')
  }

  return {
    id: closest.spot.id,
    hotspotId: closest.spot.id,
    name: closest.spot.name,
    lat: closest.spot.lat,
    lng: closest.spot.lng,
    distanceToUser: closest.meters
  };
}
