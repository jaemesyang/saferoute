import { useState } from 'react'
import { submitReport, type Assignment } from './api/reports'
import { requestLocation, type Coords } from './utils/geo'
import './VictimReport.css'

const ERRORS = {
  permission:
    "We can't see your location. Location access is turned off for this page. Turn it on in your browser settings, then try again.",
  unsupported:
    "This browser can't share your location. Try opening this page in a different browser, or call for help directly.",
  network:
    "We couldn't send your location. Check your signal and try again."
}

const LEDE = {
  unknown: 'Can you walk to safety?',
  canWalk: "Share where you are and we'll send you to the nearest safe place.",
  cannotWalk: 'Stay where you are.'
}

type Mobility = 'unknown' | 'canWalk' | 'cannotWalk'

export interface ReportedResult {
  assignment: Assignment
  coords: Coords
}

interface VictimReportProps {
  onReported: (result: ReportedResult) => void
  onDispatcherAccess: () => void
}

function VictimReport({ onReported, onDispatcherAccess }: VictimReportProps) {
  const [mobility, setMobility] = useState<Mobility>('unknown')
  const [phase, setPhase] = useState<'idle' | 'locating' | 'sending'>('idle')
  const [error, setError] = useState('')

  const isBusy = phase === 'locating' || phase === 'sending'

  async function handleShare() {
    setError('')

    if (!('geolocation' in navigator)) {
      setError(ERRORS.unsupported)
      setPhase('idle')
      return
    }

    let coords: Coords
    try {
      setPhase('locating')
      coords = await requestLocation()
    } catch (err) {
      const locationError = err as { code?: number, message?: string } | null | undefined
      setError(locationError?.code === 1 ? ERRORS.permission : locationError?.message || ERRORS.permission)
      setPhase('idle')
      return
    }

    try {
      setPhase('sending')
      const result = await submitReport(coords.lat, coords.lng)
      onReported({ assignment: result.assignment, coords })
    } catch {
      setError(ERRORS.network)
      setPhase('idle')
    }
  }

  function handleReconsider() {
    setError('')
    setMobility('unknown')
  }

  return (
    <main className="report">
      <div className="report-inner">
        <header className="report-head">
          <span className="report-mark">SAFEROUTE</span>
          <p className="report-lede">{LEDE[mobility]}</p>
        </header>

        {mobility === 'unknown' && (
          <>
            <div className="report-choice">
              <button
                className="btn btn-primary report-action"
                type="button"
                onClick={() => setMobility('canWalk')}
              >
                Yes, I can walk
              </button>
              <button
                className="btn report-action"
                type="button"
                onClick={() => setMobility('cannotWalk')}
              >
                No — I'm injured
              </button>
            </div>

            <p className="report-note">
              This only changes what we ask you to do next.
            </p>
          </>
        )}

        {mobility === 'canWalk' && (
          <>
            <button
              className="btn btn-primary report-action"
              type="button"
              onClick={handleShare}
              disabled={isBusy}
            >
              {isBusy ? 'Working…' : 'Share my location'}
            </button>

            {isBusy && (
              <p className="report-status" role="status">
                <span className="dot" />
                {phase === 'locating'
                  ? 'Finding where you are…'
                  : 'Looking for a safe place near you…'}
              </p>
            )}

            {error && !isBusy && (
              <div className="report-error" role="alert">
                <p className="report-error-text">{error}</p>
                <button
                  className="btn report-retry"
                  type="button"
                  onClick={handleShare}
                >
                  Try again
                </button>
              </div>
            )}

            <p className="report-note">
              Your location is only used to find you a safe place to go.
            </p>
          </>
        )}

        {mobility === 'cannotWalk' && (
          <>
            <div className="report-stay" role="status">
              <p className="report-stay-text">
                Do not try to walk. Moving with an injury can make it worse, and it
                makes you harder to find.
              </p>
              <p className="report-stay-text">
                Call 911 now if you haven't already. Nothing has been sent from this
                screen — a phone call is what brings help to you.
              </p>
            </div>

            <button
              className="report-reconsider"
              type="button"
              onClick={handleReconsider}
            >
              I can walk after all
            </button>
          </>
        )}
      </div>

      <button
        className="report-dispatcher"
        type="button"
        onClick={onDispatcherAccess}
      >
        Dispatcher access
      </button>
    </main>
  )
}

export default VictimReport
