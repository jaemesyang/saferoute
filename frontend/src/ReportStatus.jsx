import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchHotspots } from './api/hotspots.js'
import { checkIn } from './api/reports.js'
import { usePolling } from './hooks/usePolling.js'
import { haversineMeters, requestLocation } from './utils/geo.js'
import './ReportStatus.css'

const ARRIVAL_RADIUS_M = 50

const POLL_INTERVAL_MS = 5000

/**

 * @param {number} meters
 * @returns {string}
 */
function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

/**
 *
 * @param {Date} from
 * @param {Date | null} now
 * @returns {string}
 */
function formatAge(from, now) {
  const seconds = Math.max(0, Math.round(((now ?? new Date()).getTime() - from.getTime()) / 1000))
  if (seconds < 60) return 'a few seconds ago'
  const minutes = Math.round(seconds / 60)
  return minutes === 1 ? 'a minute ago' : `${minutes} minutes ago`
}

/**
 * @param {Object} props
 * @param {import('./api/reports.js').Assignment} props.assignment
 * @param {{ lat: number, lng: number }} props.coords 
 * @param {boolean} props.isStub
 */
function ReportStatus({ assignment, coords, isStub }) {
  const [distance, setDistance] = useState(() => {
    const meters = haversineMeters(coords.lat, coords.lng, assignment.lat, assignment.lng)
    return Number.isFinite(meters) ? { meters, at: new Date() } : null
  })
  const [isStale, setIsStale] = useState(false)
  const [headcount, setHeadcount] = useState(null)
  const [isResolved, setIsResolved] = useState(false)
  const [lastPoll, setLastPoll] = useState(null)
  const [checkInPhase, setCheckInPhase] = useState('idle')

  const hasSeenAssignment = useRef(false)

  const refresh = useCallback(async () => {
    if (isResolved) return

    try {
      const position = await requestLocation()
      const meters = haversineMeters(position.lat, position.lng, assignment.lat, assignment.lng)
      if (!Number.isFinite(meters)) throw new Error('no distance')
      setDistance({ meters, at: new Date() })
      setIsStale(false)
    } catch {
      setIsStale(true)
    }

    try {
      const result = await fetchHotspots()
      const match = result.hotspots.find((spot) => spot.id === assignment.id)
      if (match) {
        hasSeenAssignment.current = true
        setHeadcount(match.headcount)
      } else if (hasSeenAssignment.current) {
        setIsResolved(true)
      }
    } catch {
    }

    setLastPoll(new Date())
  }, [assignment, isResolved])

  useEffect(() => {
    refresh()
  }, [refresh])


  usePolling(refresh, isResolved ? 0 : POLL_INTERVAL_MS)

  async function handleCheckIn() {
    setCheckInPhase('sending')
    try {
      await checkIn(assignment.id)
    } catch {
    }
    setCheckInPhase('done')
  }

  const hasArrived = distance !== null && distance.meters < ARRIVAL_RADIUS_M

  return (
    <main className="status">
      <div className="status-inner">
        <header className="status-head">
          <span className="status-mark">SAFEROUTE</span>
          <span className="label">Go here</span>
        </header>

        <section className="status-place">
          <h1 className="status-name">{assignment.name}</h1>
          {headcount !== null && (
            <p className="status-headcount">
              <strong>{headcount}</strong> {headcount === 1 ? 'person' : 'people'} waiting here now
            </p>
          )}
        </section>

        {checkInPhase === 'done' ? (
          <section className="status-panel is-done" role="status">
            <span className="pill is-ok">
              <span className="dot" />
              Checked in
            </span>
            <p className="status-panel-text">
              You're checked in at {assignment.name}. Stay here — a dispatcher can see you've arrived.
            </p>
          </section>
        ) : isResolved ? (
          <section className="status-panel is-done" role="status">
            <span className="pill is-ok">
              <span className="dot" />
              All set
            </span>
            <p className="status-panel-text">
              {assignment.name} is no longer active. You're all set — no further action needed.
            </p>
          </section>
        ) : (
          <section className="status-gate">
            <span className="label">
              {hasArrived ? "You're here" : 'Distance remaining'}
            </span>
            <span className="status-distance">
              {distance ? formatDistance(distance.meters) : '—'}
            </span>

            {hasArrived ? (
              <button
                className="btn btn-primary status-checkin"
                type="button"
                onClick={handleCheckIn}
                disabled={checkInPhase === 'sending'}
              >
                {checkInPhase === 'sending' ? 'Checking in…' : "I'm here"}
              </button>
            ) : (
              <p className="status-hint">
                {distance
                  ? `Keep heading to ${assignment.name}. Check in here once you're within ${ARRIVAL_RADIUS_M} m.`
                  : 'Finding where you are…'}
              </p>
            )}

            {isStale && distance && (
              <p className="status-stale" role="status">
                Can't reach GPS right now — this is your position from {formatAge(distance.at, lastPoll)}.
              </p>
            )}
          </section>
        )}

        {isStub && (
          <p className="status-note">
            <span className="pill is-warn">
              <span className="dot" />
              Demo data
            </span>
            Headcount and location aren't live.
          </p>
        )}
      </div>
    </main>
  )
}

export default ReportStatus
