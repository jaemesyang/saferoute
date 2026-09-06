import { useCallback, useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'
import { resolveHotspot, type Hotspot } from './api/hotspots'
import './ScanPickup.css'

/* ------------------------------------------------------------------------ *
 * PICKUP CONTRACT
 *
 * The only place in the frontend that knows what a civilian's pickup QR
 * contains and which call clears it. The backend is mid-change, so when the
 * shape moves, everything that has to move lives between these two rules —
 * the component below only ever sees a PickupTarget and a boolean.
 * ------------------------------------------------------------------------ */

/** Query params the civilian's ReportStatus screen encodes into its QR. */
const PICKUP_ID_PARAM = 'resolve'
const PICKUP_TOKEN_PARAM = 'token'

export interface PickupTarget {
  id: number
  token: string
}

/**
 * Read a scanned string as a SafeRoute pickup link.
 *
 * Parsed with the URL API rather than split on '?' and '&' because the value
 * comes off a camera pointed at the world: it can be any string at all, and a
 * hand-rolled parser turns malformed input into a plausible-looking id instead
 * of a clean rejection. `new URL` throws on anything that isn't an absolute
 * URL, which is exactly the answer we want.
 *
 * Hotspot ids are numbers, but a URL only ever yields strings, so the id is
 * converted here and rejected unless it survives the round trip. Number('')
 * is 0 and Number('12abc') is NaN, so both the emptiness and the integer-ness
 * are checked rather than trusting the cast.
 *
 * Deliberately not origin-checked. The demo is reached over a LAN https URL, an
 * ngrok host, and localhost, so pinning an origin would reject our own codes;
 * the token is verified server-side, so a QR pointing somewhere else still
 * can't clear a hotspot it doesn't already hold a valid token for.
 *
 * @returns the target, or null if this isn't a SafeRoute pickup link.
 */
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

/** Clear the scanned pickup. The one call to swap when the endpoint moves. */
function confirmPickup(target: PickupTarget): Promise<boolean> {
  return resolveHotspot(target.id, target.token)
}

/* --------------------------- end pickup contract -------------------------- */

type Phase = 'idle' | 'scanning' | 'review' | 'sending' | 'done' | 'error'

interface Failure {
  kind: 'permission' | 'camera' | 'resolve'
  text: string
}

function describeCameraFailure(error: unknown): Failure {
  if (!window.isSecureContext) {
    return {
      kind: 'camera',
      text: 'This page is not on a secure connection, so the browser will not release the camera. Open the https:// address from the dev server instead of the http:// one.',
    }
  }

  const name = error instanceof DOMException ? error.name : ''

  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return {
      kind: 'permission',
      text: 'Camera access is blocked for this site. Tap the lock or camera icon in the address bar, allow the camera, then reload this page.',
    }
  }

  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return { kind: 'camera', text: 'No camera was found on this device.' }
  }

  if (name === 'NotReadableError') {
    return {
      kind: 'camera',
      text: 'The camera is already in use by another app. Close it and try again.',
    }
  }

  return {
    kind: 'camera',
    text: 'The camera could not be started on this device.',
  }
}

interface ScanPickupProps {
  hotspots: Hotspot[]
  onClose: () => void
  onResolved: (id: number) => void
}

function ScanPickup({ hotspots, onClose, onResolved }: ScanPickupProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [target, setTarget] = useState<PickupTarget | null>(null)
  const [failure, setFailure] = useState<Failure | null>(null)
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
      .catch((error: unknown) => {
        if (cancelled) return
        setFailure(describeCameraFailure(error))
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
    setFailure(null)
    setRejected(false)
    enterPhase('scanning')
    void scannerRef.current?.start()
  }

  async function handleConfirm(): Promise<void> {
    if (!target) return

    enterPhase('sending')

    const resolved = await confirmPickup(target)

    if (!resolved) {
      setFailure({
        kind: 'resolve',
        text: 'Nothing was cleared. The code may be out of date, this pickup may already be done, or the connection dropped. Try again, or ask the civilian to reload their status screen for a fresh code.',
      })
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
            {failure.kind === 'permission' ? 'Camera blocked' : 'Not cleared'}
          </span>
          <p className="scan-panel-text">{failure.text}</p>
          <div className="scan-actions">
            {failure.kind === 'resolve' ? (
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