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
 * @returns {Promise<ReportResult>}
 */
export async function submitReport(lat, lng) {
  const baseUrl = import.meta.env.VITE_API_URL;

  if (!baseUrl) {
    return { assignment: await getStubAssignment(), isStub: true };
  }

  try {
    // TODO: confirm endpoint path with backend
    const response = await fetch(`${baseUrl}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng })
    });
    if (!response.ok) {
      return { assignment: await getStubAssignment(), isStub: true };
    }
    return { assignment: await response.json(), isStub: false };
  } catch {
    return { assignment: await getStubAssignment(), isStub: true };
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
 * @returns {Promise<Assignment>}
 */
export async function getStubAssignment() {
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    id: 'stub-assignment-0',
    name: 'Creighton University',
    lat: 41.2659,
    lng: -95.9451,
    distanceToUser: 1.4
  };
}
