import { Fragment, useCallback, useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { claimHotspot, fetchHotspots, resolveHotspot, type Hotspot } from './api/hotspots'
import { usePolling } from './hooks/usePolling'
import { mergeHotspots } from './utils/hotspotState'
import HotspotMap from './HotspotMap'
import './Dashboard.css'

const REFRESH_INTERVAL_MS = 15000

function severityOf(assigned: number) {
  if (assigned >= 40) return 'high'
  if (assigned >= 20) return 'med'
  return 'low'
}

function resolveUrlFor(id: string, token: string): string {
  const url = new URL(window.location.origin)
  url.searchParams.set('resolve', id)
  url.searchParams.set('token', token)
  return url.toString()
}

function formatClock(date: Date | null): string {
  if (!date) return '--:--:--'
  return date.toLocaleTimeString([], { hour12: false })
}


const TOKEN_LOST =
  'This tab lost the code for that pickup (a reload clears it). Claim it again to mint a new one — any code already shown will stop working.'

interface DashboardProps {
  dispatcherName: string
  onSignOut: () => void
}

function Dashboard({ dispatcherName, onSignOut }: DashboardProps) {
  const [serverHotspots, setServerHotspots] = useState<Hotspot[]>([])
  const [claims, setClaims] = useState<Record<number, string>>({})
  const [resolvedIds, setResolvedIds] = useState<number[]>([])
  const [isStub, setIsStub] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [view, setView] = useState<'list' | 'map'>('list')
  const [tokens, setTokens] = useState<Record<number, string>>({})
  const [notice, setNotice] = useState<string | null>(null)
  // One QR open at a time — two codes on screen is how the wrong one gets scanned.
  const [qrFor, setQrFor] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsFetching(true)
    try {
      const result = await fetchHotspots()
      setServerHotspots(result.hotspots)
      setIsStub(result.isStub)
      setLastSync(new Date())
      setHasLoaded(true)
    } finally {
      setIsFetching(false)
    }
  }, [])

  usePolling(load, REFRESH_INTERVAL_MS)

  const hotspots = useMemo(
    () => mergeHotspots(serverHotspots, { claims, resolvedIds }),
    [serverHotspots, claims, resolvedIds],
  )

  const sorted = useMemo(
    () => [...hotspots].sort((a, b) => b.assigned - a.assigned),
    [hotspots],
  )

  const stats = useMemo(
    () => ({
      locations: hotspots.length,
      assigned: hotspots.reduce((total, spot) => total + spot.assigned, 0),
      arrived: hotspots.reduce((total, spot) => total + spot.arrived, 0),
      unclaimed: hotspots.filter((spot) => !spot.claimedBy).length,
    }),
    [hotspots],
  )

  async function handleClaim(id: number): Promise<void> {
    setClaims((prev) => ({ ...prev, [id]: dispatcherName }))
    setNotice(null)

    const result = await claimHotspot(id, dispatcherName)

    if (result) {
      setTokens((prev) => ({ ...prev, [id]: result.resolveToken }))
      setQrFor((prev) => (prev === id ? null : prev))
      await load()
      return
    }

    setClaims((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })

    setNotice('Could not reach dispatch. Claim not saved — try again.')

    await load()
  }

  async function handleResolve(id: number): Promise<void> {
    setNotice(null)

    const token = tokens[id]
    if (!token) {
      setNotice(TOKEN_LOST)
      return
    }

    const resolved = await resolveHotspot(id, token)

    if (!resolved) {
      setNotice('Could not reach dispatch. Hotspot not resolved — try again.')
      return
    }

    setResolvedIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    setQrFor((prev) => (prev === id ? null : prev))
    await load()
  }

  function handleToggleQr(id: string): void {
    if (qrFor === id) {
      setQrFor(null)
      return
    }

    setNotice(null)

    if (!tokens[id]) {
      setNotice(TOKEN_LOST)
      return
    }

    setQrFor(id)
  }

  return (
    <div className="dash">
      <header className="dash-head">
        <div className="dash-id">
          <span className="dash-mark">SAFEROUTE</span>
          <span className="dash-sep" />
          <span className="label">Dispatch</span>
        </div>

        <div className="dash-head-right">
          <span className="dash-user">
            <span className="label">Dispatcher</span>
            <strong>{dispatcherName}</strong>
          </span>
          <span className="dash-clock label">Synced {formatClock(lastSync)}</span>
          <span className="view-toggle">
            <button
              className={view === 'list' ? 'btn is-active' : 'btn'}
              type="button"
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
            >
              List
            </button>
            <button
              className={view === 'map' ? 'btn is-active' : 'btn'}
              type="button"
              onClick={() => setView('map')}
              aria-pressed={view === 'map'}
            >
              Map
            </button>
          </span>
          <button
            className="btn"
            type="button"
            onClick={load}
            disabled={isFetching}
          >
            {isFetching ? 'Syncing' : 'Refresh'}
          </button>
          <button className="btn" type="button" onClick={onSignOut}>
            Exit
          </button>
        </div>
      </header>

      {notice && (
        <div className="dash-banner" role="alert">
          <span className="pill is-warn">
            <span className="dot" />
            Claim
          </span>
          <span>{notice}</span>
        </div>
      )}

      {isStub && hasLoaded && (
        <div className="dash-banner" role="status">
          <span className="pill is-warn">
            <span className="dot" />
            Backend unavailable
          </span>
          <span>Showing demo data — assignments, arrivals, and claims are not live.</span>
        </div>
      )}

      <section className="dash-stats">
        <div className="stat">
          <span className="label">Locations</span>
          <span className="stat-value">{hasLoaded ? stats.locations : '--'}</span>
        </div>
        <div className="stat">
          <span className="label">Assigned</span>
          <span className="stat-value">{hasLoaded ? stats.assigned : '--'}</span>
        </div>
        <div className="stat">
          <span className="label">Arrived</span>
          <span className="stat-value">{hasLoaded ? stats.arrived : '--'}</span>
        </div>
        <div className="stat">
          <span className="label">Unclaimed</span>
          <span
            className={
              !hasLoaded
                ? 'stat-value'
                : stats.unclaimed > 0
                  ? 'stat-value is-alert'
                  : 'stat-value is-ok'
            }
          >
            {hasLoaded ? stats.unclaimed : '--'}
          </span>
        </div>
      </section>

      {view === 'list' ? (
        <main className="dash-list">
          <div className="row row-head">
            <span className="col-sev" />
            <span className="label col-name">Location</span>
            <span className="label col-assigned">Assigned</span>
            <span className="label col-arrived">Arrived</span>
            <span className="label col-action">Status</span>
          </div>

          {!hasLoaded && <p className="dash-note">Loading hotspots…</p>}

          {hasLoaded && sorted.length === 0 && (
            <p className="dash-note">No active hotspots reported.</p>
          )}

          {sorted.map((spot) => (
            <Fragment key={spot.id}>
              <div className="row">
                <span className={`col-sev sev-${severityOf(spot.assigned)}`} />
                <span className="col-name">{spot.name}</span>
                <span className="col-assigned">{spot.assigned}</span>
                <span className="col-arrived">{spot.arrived}</span>
                <span className="col-action">
                  {spot.claimedBy ? (
                    <>
                      <span
                        className={
                          spot.claimedBy === dispatcherName
                            ? 'pill is-ok'
                            : 'pill is-dim'
                        }
                      >
                        Claimed by {spot.claimedBy}
                      </span>
                      {spot.claimedBy === dispatcherName && (
                        <>
                          <button
                            className="btn"
                            type="button"
                            onClick={() => handleToggleQr(spot.id)}
                            aria-pressed={qrFor === spot.id}
                          >
                            {qrFor === spot.id ? 'Hide QR' : 'Show QR'}
                          </button>
                          <button
                            className="btn"
                            type="button"
                            onClick={() => handleResolve(spot.id)}
                          >
                            Resolve
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={() => handleClaim(spot.id)}
                    >
                      Claim
                    </button>
                  )}
                </span>
              </div>

              {qrFor === spot.id && tokens[spot.id] && (
                <div className="qr-panel">
                  {/* White plate behind the code: scanners need the light
                      quiet zone, and this console is otherwise near-black. */}
                  <div className="qr-plate">
                    <QRCodeSVG
                      value={resolveUrlFor(spot.id, tokens[spot.id])}
                      size={172}
                      level="M"
                    />
                  </div>
                  <div className="qr-meta">
                    <span className="label">Scan to resolve</span>
                    <p className="qr-caption">{spot.name}</p>
                    <p className="qr-hint">
                      Hold this up for the driver once the pickup is done. They
                      confirm on their own phone — no sign-in needed.
                    </p>
                  </div>
                </div>
              )}
            </Fragment>
          ))}
        </main>
      ) : (
        <main className="dash-map">
          <HotspotMap
            hotspots={sorted}
            dispatcherName={dispatcherName}
            onClaim={handleClaim}
          />
        </main>
      )}
    </div>
  )
}

export default Dashboard