import { useCallback, useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'
import { resolveHotspot, type Hotspot } from './api/hotspots'
import './ScanPickup.css'

const PICKUP_ID_PARAM = 'resolve'
const PICKUP_TOKEN_PARAM = 'token'

export interface PickupTarget {
  id: number
  token: string
}

function parsePickupCode(scanned: string): PickupTarget | null {
  let url: URL

  try {
    url = new URL(scanned)
  } catch {
    return null
  }

  const rawId = url.searchParams.get(PICKUP_ID_PARAM)
  const token = url.searchParams.get(PICKUP_TOKEN_PARAM)

  if (!rawId || !token) return null

  const id = Number(rawId)
  if (!Number.isInteger(id)) return null

  return { id, token }
}

type Phase = 'idle' | 'scanning' | 'review' | 'sending' | 'done' | 'error'

interface ScanPickupProps {
  hotspots: Hotspot[]
  onClose: () => void
  onResolved: (id: number) => void
}

function ScanPickup({ hotspots, onClose, onResolved }: ScanPickupProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [target, setTarget] = useState<PickupTarget | null>(null)
  const [failure, setFailure] = useState('')
  const [rejected, setRejected] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)
  const phaseRef = useRef<Phase>('idle')

  const enterPhase = useCallback((next: Phase) => {
    phaseRef.current = next
    setPhase(next)
  }, [])


  const handleDecode = useCallback(
    (scanned: string) => {
      if (phaseRef.current !== 'scanning') return

      const parsed = parsePickupCode(scanned)

      if (!parsed) {
        setRejected(true)
        return
      }

      setRejected(false)
      setTarget(parsed)
      enterPhase('review')

      void scannerRef.current?.pause()
    },
    [enterPhase],
  )

  useEffect(() => {
    const video = videoRef.current
    if (!video) return


    let cancelled = false

    const scanner = new QrScanner(video, (result) => handleDecode(result.data), {
      returnDetailedScanResult: true,
      preferredCamera: 'environment',
      highlightScanRegion: true,
      highlightCodeOutline: true,

      maxScansPerSecond: 5,
    })

    scannerRef.current = scanner

    scanner
      .start()
      .then(() => {
        if (cancelled) return
        enterPhase('scanning')
      })
      .catch(() => {
        if (cancelled) return
        setFailure('Camera unavailable. Check camera permission and try again.')
        enterPhase('error')
      })

    return () => {
      cancelled = true
      scanner.stop()
      scanner.destroy()
      scannerRef.current = null
    }
  }, [handleDecode, enterPhase])

  function resumeScanning(): void {
    setTarget(null)
    setFailure('')
    setRejected(false)
    enterPhase('scanning')
    void scannerRef.current?.start()
  }

  async function handleConfirm(): Promise<void> {
    if (!target) return

    enterPhase('sending')

    try {
      if (!await resolveHotspot(target.id, target.token)) {
        setFailure('Pickup could not be cleared. Check the connection and try again.')
        enterPhase('error')
        return
      }
    } catch {
      setFailure('Pickup could not be cleared. Check the connection and try again.')
      enterPhase('error')
      return
    }

    enterPhase('done')
    onResolved(target.id)
  }

  const scannedSpot = target
    ? hotspots.find((spot) => spot.id === target.id) ?? null
    : null

  return (
    <div className="scan">
      <header className="scan-head">
        <div className="scan-id">
          <span className="scan-mark">SAFEROUTE</span>
          <span className="label">Scan pickup</span>
        </div>
        <button className="btn" type="button" onClick={onClose}>
          Close
        </button>
      </header>

      <div className="scan-stage">
        <video className="scan-video" ref={videoRef} muted playsInline />

        {phase === 'idle' && (
          <p className="scan-overlay-note">Starting camera…</p>
        )}

        {phase === 'scanning' && (
          <p className="scan-overlay-note">
            {rejected
              ? 'Not a SafeRoute code — still scanning.'
              : "Point at the civilian's screen."}
          </p>
        )}
      </div>

      {phase === 'review' && target && (
        <section className="scan-panel" role="alert">
          <span className="label">Confirm pickup</span>
          <p className="scan-place">{scannedSpot?.name ?? 'Location not in your list'}</p>
          {!scannedSpot && (
            <p className="scan-hint">
              This code isn't for a hotspot you have open. It may already be
              cleared, or claimed by another dispatcher — dispatch decides either
              way.
            </p>
          )}
          <p className="scan-ref">
            <span className="label">Reference</span>
            <code>{target.id}</code>
          </p>
          <p className="scan-hint">
            Confirming clears this location for dispatch and cannot be undone.
          </p>
          <div className="scan-actions">
            <button
              className="btn btn-primary scan-confirm"
              type="button"
              onClick={handleConfirm}
            >
              Confirm pickup
            </button>
            <button className="btn" type="button" onClick={resumeScanning}>
              Cancel
            </button>
          </div>
        </section>
      )}

      {phase === 'sending' && (
        <section className="scan-panel" role="status">
          <span className="pill is-dim">
            <span className="dot" />
            Sending
          </span>
          <p className="scan-hint">Clearing this pickup…</p>
        </section>
      )}

      {phase === 'done' && (
        <section className="scan-panel is-done" role="status">
          <span className="pill is-ok">
            <span className="dot" />
            Cleared
          </span>
          <p className="scan-hint">Pickup confirmed.</p>
        </section>
      )}

      {phase === 'error' && failure && (
        <section className="scan-panel is-error" role="alert">
          <span className="pill is-warn">
            <span className="dot" />
            Couldn't complete
          </span>
          <p className="scan-panel-text">{failure}</p>
          <div className="scan-actions">
            {target ? (
              <>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={handleConfirm}
                >
                  Try again
                </button>
                <button className="btn" type="button" onClick={resumeScanning}>
                  Back to scanning
                </button>
              </>
            ) : (
              <button className="btn" type="button" onClick={onClose}>
                Back to dispatch
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

export default ScanPickup
