import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchHotspots } from './api/hotspots.js'
import HotspotMap from './HotspotMap.jsx'
import './Dashboard.css'

/**
 *
 * @param {() => void} load - loader to run on each tick
 * @param {number} intervalMs - delay between ticks
 * @returns {void}
 */
// TODO: implement the interval + cleanup. The dashboard fetches once on mount
// for now (see the useEffect below) and refreshes manually from the header.
// eslint-disable-next-line no-unused-vars
function usePolling(load, intervalMs) { }

/** Headcount thresholds that drive the row's severity bar. */
function severityOf(headcount) {
  if (headcount >= 40) return 'high'
  if (headcount >= 20) return 'med'
  return 'low'
}

function formatClock(date) {
  if (!date) return '--:--:--'
  return date.toLocaleTimeString([], { hour12: false })
}

/**
 *
 * @param {Object} props
 * @param {string} props.dispatcherName
 * @param {() => void} props.onSignOut
 */
function Dashboard({ dispatcherName, onSignOut }) {
  const [hotspots, setHotspots] = useState([])
  const [isStub, setIsStub] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const [view, setView] = useState('list')

  const load = useCallback(async () => {
    setIsFetching(true)
    try {
      const result = await fetchHotspots()
      setHotspots(result.hotspots)
      setIsStub(result.isStub)
      setLastSync(new Date())
      setHasLoaded(true)
    } finally {
      setIsFetching(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const sorted = useMemo(
    () => [...hotspots].sort((a, b) => b.headcount - a.headcount),
    [hotspots],
  )

  const stats = useMemo(
    () => ({
      locations: hotspots.length,
      waiting: hotspots.reduce((total, spot) => total + spot.headcount, 0),
      unclaimed: hotspots.filter((spot) => !spot.claimedBy).length,
    }),
    [hotspots],
  )

  /**
   *
   * @param {string} id
   * @returns {void}
   */
  function handleClaim(id) {
    setHotspots(hotspots.map((spot) => spot.id === id ? { ...spot, claimedBy: dispatcherName } : spot))
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

      {isStub && hasLoaded && (
        <div className="dash-banner" role="status">
          <span className="pill is-warn">
            <span className="dot" />
            Backend unavailable
          </span>
          <span>Showing demo data — headcounts and claims are not live.</span>
        </div>
      )}

      <section className="dash-stats">
        <div className="stat">
          <span className="label">Locations</span>
          <span className="stat-value">{hasLoaded ? stats.locations : '--'}</span>
        </div>
        <div className="stat">
          <span className="label">People waiting</span>
          <span className="stat-value">{hasLoaded ? stats.waiting : '--'}</span>
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
            <span className="label col-count">Waiting</span>
            <span className="label col-action">Status</span>
          </div>

          {!hasLoaded && <p className="dash-note">Loading hotspots…</p>}

          {hasLoaded && sorted.length === 0 && (
            <p className="dash-note">No active hotspots reported.</p>
          )}

          {sorted.map((spot) => (
            <div className="row" key={spot.id}>
              <span className={`col-sev sev-${severityOf(spot.headcount)}`} />
              <span className="col-name">{spot.name}</span>
              <span className="col-count">{spot.headcount}</span>
              <span className="col-action">
                {spot.claimedBy ? (
                  <span
                    className={
                      spot.claimedBy === dispatcherName
                        ? 'pill is-ok'
                        : 'pill is-dim'
                    }
                  >
                    Claimed by {spot.claimedBy}
                  </span>
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
