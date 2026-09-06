import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchHotspots } from './api/hotspots'
import { checkIn, type Assignment } from './api/reports'
import { usePolling } from './hooks/usePolling'
import { haversineMeters, requestLocation, type Coords } from './utils/geo'
import './ReportStatus.css'

const ARRIVAL_RADIUS_M = 50

const POLL_INTERVAL_MS = 5000

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

function formatAge(from: Date, now: Date | null): string {
  const seconds = Math.max(0, Math.round(((now ?? new Date()).getTime() - from.getTime()) / 1000))
  if (seconds < 60) return 'a few seconds ago'
  const minutes = Math.round(seconds / 60)
  return minutes === 1 ? 'a minute ago' : `${minutes} minutes ago`
}

interface ReportStatusProps {
  assignment: Assignment
  coords: Coords
}

function ReportStatus({ assignment, coords }: ReportStatusProps) {
  const [distance, setDistance] = useState<{ meters: number, at: Date } | null>(() => {
    const meters = haversineMeters(coords.lat, coords.lng, assignment.lat, assignment.lng)
    return Number.isFinite(meters) ? { meters, at: new Date() } : null
  })
  const [isStale, setIsStale] = useState(false)
  const [counts, setCounts] = useState<{ assigned: number, arrived: number } | null>(null)
  const [isResolved, setIsResolved] = useState(false)
  const [lastPoll, setLastPoll] = useState<Date | null>(null)
  const [checkInPhase, setCheckInPhase] = useState<'idle' | 'sending' | 'done'>('idle')
  const [checkInError, setCheckInError] = useState(false)

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
      const match = result.find((spot) => spot.id === assignment.hotspotId)
      if (match) {
        hasSeenAssignment.current = true
        setCounts({ assigned: match.assigned, arrived: match.arrived })
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
    setCheckInError(false)
    setCheckInPhase('sending')
    try {
      await checkIn(assignment.id)
    } catch {
      setCheckInError(true)
      setCheckInPhase('idle')
      return
    }
    await refresh()
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
          {counts !== null && (
            <p className="status-counts">
              <strong>{counts.assigned}</strong> assigned · <strong>{counts.arrived}</strong> arrived
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
            {checkInError && (
              <p className="status-stale" role="alert">
                Couldn't confirm check-in. Check your connection and try again.
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  )
}

export default ReportStatus
