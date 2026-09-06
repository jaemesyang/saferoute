import test from 'node:test'
import assert from 'node:assert/strict'
import { submitReport, getStubAssignment } from '../src/api/reports.js'

// Baxter Arena is at 41.2336, -95.9569. Standing a block away, the closest
// predetermined hotspot is Baxter Arena — not whatever is hardcoded.
const NEAR_BAXTER = { lat: 41.2340, lng: -95.9570 }
const NEAR_KENNEDY = { lat: 41.2955, lng: -96.0310 }
const NEAR_LINCOLN = { lat: 40.8070, lng: -96.6890 }

test('offline fallback picks the hotspot closest to the caller', async () => {
  const a = await getStubAssignment(NEAR_BAXTER)
  assert.equal(a.name, 'Baxter Arena')
})

test('offline fallback follows the caller to a different city', async () => {
  const a = await getStubAssignment(NEAR_LINCOLN)
  assert.equal(a.name, 'Lincoln High School')
})

test('offline fallback distinguishes two nearby Omaha hotspots', async () => {
  const a = await getStubAssignment(NEAR_KENNEDY)
  assert.equal(a.name, 'Kennedy High School')
})

test('fallback assignment reports the real distance to the caller', async () => {
  const a = await getStubAssignment(NEAR_BAXTER)
  assert.ok(a.distanceToUser < 100, `expected <100 m, got ${a.distanceToUser}`)
})

test('submitReport with no API configured still uses the caller position', async () => {
  const r = await submitReport(NEAR_BAXTER.lat, NEAR_BAXTER.lng)
  assert.equal(r.isStub, true)
  assert.equal(r.assignment.name, 'Baxter Arena')
})

test('submitReport posts to the reports endpoint and normalises its shape', async () => {
  const calls = []
  const realFetch = globalThis.fetch
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options })
    return {
      ok: true,
      json: async () => ({
        id: 7, name: 'Live Hotspot', lat: 41.1, lng: -96.1, distanceMeters: 812.5
      })
    }
  }
  try {
    const r = await submitReport(41.2340, -95.9570, 'http://api.test')
    assert.equal(r.isStub, false)
    assert.equal(r.assignment.name, 'Live Hotspot')
    assert.equal(r.assignment.distanceToUser, 812.5)
    assert.equal(calls[0].url, 'http://api.test/api/reports')
    assert.equal(calls[0].options.method, 'POST')
    assert.equal(calls[0].options.headers['Content-Type'], 'application/json')
    assert.deepEqual(JSON.parse(calls[0].options.body), { lat: 41.234, lng: -95.957 })
  } finally {
    globalThis.fetch = realFetch
  }
})

test('assignment id matches an entry in the polled hotspot list', async () => {
  // ReportStatus finds the headcount with `spot.id === assignment.id`, and
  // treats a missing id as "this hotspot is resolved".
  const { getStubHotspots } = await import('../src/api/hotspots.js')
  const assignment = await getStubAssignment(NEAR_BAXTER)
  const hotspots = await getStubHotspots()
  const match = hotspots.find((spot) => spot.id === assignment.id)
  assert.ok(match, `assignment id ${assignment.id} is in no hotspot list entry`)
  assert.equal(match.name, 'Baxter Arena')
})
