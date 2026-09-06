import { test } from 'vitest'
import assert from 'node:assert/strict'
import { claimHotspot, resolveHotspot } from '../src/api/hotspots'

/**
 * Swap in a fake fetch, run `body`, and hand back every call it made.
 * @param {(url: string, options: any) => any} handler
 * @param {() => Promise<void>} body
 */
async function withFetch(handler, body) {
  const calls = []
  const realFetch = globalThis.fetch
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options })
    return handler(String(url), options)
  }
  try {
    await body(calls)
  } finally {
    globalThis.fetch = realFetch
  }
}

test('claiming a hotspot tells the backend, so other dispatchers see it', async () => {
  await withFetch(
    () => ({ ok: true, status: 200, json: async () => ({ claimedBy: 'dispatchera', resolveToken: 'tok-1' }) }),
    async (calls) => {
      const r = await claimHotspot('4', 'dispatchera', 'http://api.test')
      assert.ok(r)
      assert.equal(r.claimedBy, 'dispatchera')
      assert.equal(r.resolveToken, 'tok-1')
      assert.equal(calls.length, 1, 'claim must reach the backend')
      assert.equal(calls[0].url, 'http://api.test/api/hotspots/claim')
      assert.equal(calls[0].options.method, 'PATCH')
      assert.equal(calls[0].options.headers['Content-Type'], 'application/json')
      assert.deepEqual(JSON.parse(calls[0].options.body), { id: '4', dispatcherName: 'dispatchera' })
    },
  )
})

test('claiming a hotspot just accepts the backend result', async () => {
  await withFetch(
    () => ({ ok: true, status: 200, json: async () => ({ claimedBy: 'dispatcherb' }) }),
    async () => {
      const r = await claimHotspot('4', 'dispatcherb', 'http://api.test')
      assert.ok(r)
      assert.equal(r.claimedBy, 'dispatcherb')
    },
  )
})

test('an unreachable backend reports the claim as offline, not as claimed', async () => {
  await withFetch(
    () => { throw new Error('connection refused') },
    async () => {
      const r = await claimHotspot('4', 'dispatchera', 'http://api.test')
      assert.equal(r, null)
    },
  )
})

test('resolving a hotspot calls the backend', async () => {
  await withFetch(
    () => ({ ok: true, status: 200, json: async () => ({ resolved: true }) }),
    async (calls) => {
      const r = await resolveHotspot('4', 'tok-1', 'http://api.test')
      assert.equal(r, true)
      assert.equal(calls[0].url, 'http://api.test/api/hotspots/resolve')
      assert.equal(calls[0].options.method, 'PATCH')
      assert.deepEqual(JSON.parse(calls[0].options.body), { id: '4', token: 'tok-1' })
    },
  )
})

test('with no backend configured a claim is local-only, not a silent success', async () => {
  const r = await claimHotspot('stub-0', 'dispatchera')
  assert.equal(r, null)
})
