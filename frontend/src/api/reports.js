import { PREDETERMINED_HOTSPOTS } from './hotspots.js'
import { pickClosest } from '../utils/geo.js'

/**
 * @typedef {Object} Assignment
 * @property {string} id
 * @property {string} name
 * @property {number} lat
 * @property {number} lng
 * @property {number} distanceToUser 
 */

/**
 * @typedef {Object} ReportResult
 * @property {Assignment} assignment
 * @property {boolean} isStub
 */

/**
 *
 * @param {number} lat
 * @param {number} lng
 * @param {string} [apiUrl] 
 * @returns {Promise<ReportResult>}
 */
export async function submitReport(lat, lng, apiUrl) {
  const coords = { lat, lng };
  const baseUrl = apiUrl ?? import.meta.env?.VITE_API_URL;

  if (!baseUrl) {
    return { assignment: await getStubAssignment(coords), isStub: true };
  }

  try {
    const query = new URLSearchParams({ lat: String(lat), lng: String(lng) });
    const response = await fetch(`${baseUrl}/api/closest?${query}`);
    if (!response.ok) {
      return { assignment: await getStubAssignment(coords), isStub: true };
    }

    const closest = await response.json();
    if (!closest || !Number.isFinite(closest.lat) || !Number.isFinite(closest.lng)) {
      return { assignment: await getStubAssignment(coords), isStub: true };
    }

    return {
      assignment: {
        id: String(closest.id),
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

/**
 * @typedef {Object} CheckInResult
 * @property {boolean} confirmed
 * @property {boolean} isStub
 */

/**
 * @param {string} assignmentId
 * @returns {Promise<CheckInResult>}
 */
// TODO: implement — see JSDoc above.
// eslint-disable-next-line no-unused-vars
export async function checkIn(assignmentId) { }

/**
 * @param {{ lat: number, lng: number }} coords
 * @returns {Promise<Assignment>}
 */
export async function getStubAssignment(coords) {
  await new Promise(resolve => setTimeout(resolve, 500));

  const closest = pickClosest(coords, PREDETERMINED_HOTSPOTS);
  if (!closest) {
    throw new Error('Cannot pick a safe place without a position')
  }

  return {
    id: closest.spot.id,
    name: closest.spot.name,
    lat: closest.spot.lat,
    lng: closest.spot.lng,
    distanceToUser: closest.meters
  };
}
