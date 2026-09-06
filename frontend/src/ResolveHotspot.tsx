import { useState } from 'react'
import { resolveHotspot } from './api/hotspots'
import './ResolveHotspot.css'

interface ResolveHotspotProps {
  id: string
  token: string
}

type Phase = 'confirm' | 'sending' | 'done' | 'error'

function ResolveHotspot({ id, token }: ResolveHotspotProps) {
  const [phase, setPhase] = useState<Phase>('confirm')

  async function handleConfirm(): Promise<void> {
    setPhase('sending')

    const resolved = await resolveHotspot(id, token)

    setPhase(resolved ? 'done' : 'error')
  }

  return (
    <main className="resolve">
      <div className="resolve-inner">
        <header className="resolve-head">
          <span className="resolve-mark">SAFEROUTE</span>
          <span className="label">Pickup</span>
        </header>

        {phase === 'done' ? (
          <section className="resolve-panel is-done" role="status">
            <span className="pill is-ok">
              <span className="dot" />
              Resolved
            </span>
            <p className="resolve-panel-text">
              Pickup confirmed. Dispatch has cleared this location — you're good to go.
            </p>
          </section>
        ) : phase === 'error' ? (
          <section className="resolve-panel is-error" role="alert">
            <span className="pill is-warn">
              <span className="dot" />
              Not resolved
            </span>
            <p className="resolve-panel-text">
              Nothing was resolved. The code may be out of date, this pickup may
              already be done, or the connection dropped. Try again, and ask
              dispatch to show a fresh code if it keeps failing.
            </p>
            <button
              className="btn btn-primary resolve-retry"
              type="button"
              onClick={handleConfirm}
            >
              Try again
            </button>
          </section>
        ) : (
          <section className="resolve-gate">
            <span className="label">Confirm this pickup</span>
            <p className="resolve-lede">
              Tap below once everyone at this location has been picked up. This clears
              the location for dispatch and cannot be undone.
            </p>
            <button
              className="btn btn-primary resolve-confirm"
              type="button"
              onClick={handleConfirm}
              disabled={phase === 'sending'}
            >
              {phase === 'sending' ? 'Confirming…' : 'Confirm pickup complete'}
            </button>
          </section>
        )}

        <p className="resolve-ref">
          <span className="label">Reference</span>
          <code>{id}</code>
        </p>
      </div>
    </main>
  )
}

export default ResolveHotspot