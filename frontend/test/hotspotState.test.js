import test from 'node:test'
import assert from 'node:assert/strict'
import { mergeHotspots } from '../src/utils/hotspotState.js'
import { getStubHotspots } from '../src/api/hotspots.js'

const SERVER = [
  { id: 'a', name: 'Baxter Arena', lat: 41.2336, lng: -95.9569, assigned: 12, arrived: 4, claimedBy: null },
  { id: 'b', name: 'Creighton University', lat: 41.2659, lng: -95.9451, assigned: 30, arrived: 18, claimedBy: null },
]

const NO_LOCAL = { claims: {}, resolvedIds: [] }

test('a refresh does not drop who claimed what', () => {
  const local = { claims: { a: 'dispatcherb' }, resolvedIds: [] }
  const merged = mergeHotspots(SERVER, local)
  assert.equal(merged.find(s => s.id === 'a').claimedBy, 'dispatcherb')
  assert.equal(merged.find(s => s.id === 'b').claimedBy, null)
})

test('a refresh still picks up live assigned count for a claimed hotspot', () => {
  const local = { claims: { a: 'dispatcherb' }, resolvedIds: [] }
  const later = SERVER.map(s => s.id === 'a' ? { ...s, assigned: 41 } : s)
  const merged = mergeHotspots(later, local)
  const a = merged.find(s => s.id === 'a')
  assert.equal(a.assigned, 41)
  assert.equal(a.claimedBy, 'dispatcherb')
})

test('a resolved hotspot does not come back on the next poll', () => {
  const merged = mergeHotspots(SERVER, { claims: {}, resolvedIds: ['b'] })
  assert.deepEqual(merged.map(s => s.id), ['a'])
})

test('a claim by another dispatcher survives when the server reports one', () => {
  const server = SERVER.map(s => s.id === 'b' ? { ...s, claimedBy: 'dispatchera' } : s)
  const merged = mergeHotspots(server, NO_LOCAL)
  assert.equal(merged.find(s => s.id === 'b').claimedBy, 'dispatchera')
})

test('the server wins over a local claim it turned down', () => {
  const server = SERVER.map(s => s.id === 'b' ? { ...s, claimedBy: 'dispatchera' } : s)
  const merged = mergeHotspots(server, { claims: { b: 'dispatcherb' }, resolvedIds: [] })
  assert.equal(merged.find(s => s.id === 'b').claimedBy, 'dispatchera')
})

test('hotspots the backend omits claimedBy for read as unclaimed', () => {
  const server = [{ id: 'c', name: 'Kennedy High School', lat: 41.2958, lng: -96.0313, assigned: 5, arrived: 0 }]
  assert.equal(mergeHotspots(server, NO_LOCAL)[0].claimedBy, null)
})

test('demo data keeps the same claims across polls', async () => {
  const first = await getStubHotspots()
  const second = await getStubHotspots()
  assert.deepEqual(
    first.map(s => [s.id, s.claimedBy]),
    second.map(s => [s.id, s.claimedBy]),
  )
})
