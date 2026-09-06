import { useCallback, useEffect, useRef, useState } from 'react'
import QrScanner from 'qr-scanner'
import { pickup, type PickupResult } from './api/reports'
import './ScanPickup.css'

function parsePickupCode(scanned: string): { token: string } | null {
  try {
    const payload = JSON.parse(scanned) as { token?: unknown }
    return typeof payload.token === 'string' && payload.token
      ? { token: payload.token }
      : null
  } catch {
    return null
  }
}

type Phase = 'idle' | 'scanning' | 'review' | 'sending' | 'done' | 'error'
type PickupStats = Exclude<PickupResult, { status: 'invalid' }>

interface ScanPickupProps {
  onClose: () => void
  onResolved: () => void
}

function ScanPickup({ onClose, onResolved }: ScanPickupProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [target, setTarget] = useState<{ token: string } | null>(null)
  const [failure, setFailure] = useState('')
  const [rejected, setRejected] = useState(false)
  const [pickupStats, setPickupStats] = useState<PickupStats | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const frozenFrameRef = useRef<HTMLCanvasElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)
  const phaseRef = useRef<Phase>('idle')
  const cameraWantedRef = useRef(true)
  const ensureCameraRef = useRef<() => void>(() => {})

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
      const video = videoRef.current
      const frozenFrame = frozenFrameRef.current
      if (video && frozenFrame) {
        frozenFrame.width = video.videoWidth
        frozenFrame.height = video.videoHeight
        frozenFrame.getContext('2d')?.drawImage(video, 0, 0)
      }
      setTarget(parsed)
      enterPhase('review')
    },
    [enterPhase],
  )

  useEffect(() => {
    const video = videoRef.current
    if (!video) return


    let cancelled = false
    let starting = false
    const scanner = new QrScanner(video, (result) => handleDecode(result.data), {
      returnDetailedScanResult: true,
      preferredCamera: 'environment',
      highlightScanRegion: true,
      highlightCodeOutline: true,

      maxScansPerSecond: 5,
    })

    scannerRef.current = scanner

    async function ensureCameraStream(): Promise<void> {
      const stream = videoRef.current?.srcObject
      const hasLiveStream =
        stream instanceof MediaStream &&
        stream.getVideoTracks().some((track) => track.readyState === 'live')

      if (cancelled || !cameraWantedRef.current || starting || hasLiveStream) return

      starting = true
      try {
        await scanner.start()
        if (cancelled || !cameraWantedRef.current) return
        setFailure('')
        enterPhase('scanning')
      } catch {
        if (cancelled || !cameraWantedRef.current) return
        setFailure('Camera unavailable. Check camera permission and try again.')
        enterPhase('error')
      } finally {
        starting = false
      }
    }

    ensureCameraRef.current = () => void ensureCameraStream()
    void ensureCameraStream()
    const streamCheck = window.setInterval(() => void ensureCameraStream(), 1000)

    return () => {
      cancelled = true
      window.clearInterval(streamCheck)
      scanner.stop()
      scanner.destroy()
      scannerRef.current = null
      ensureCameraRef.current = () => {}
    }
  }, [handleDecode, enterPhase])

  function resumeScanning(): void {
    cameraWantedRef.current = true
    setTarget(null)
    setPickupStats(null)
    setFailure('')
    setRejected(false)
    enterPhase('scanning')
  }

  async function handleConfirm(): Promise<void> {
    if (!target) return

    enterPhase('sending')

    try {
      const result = await pickup(target.token)
      if (result.status === 'invalid') {
        setFailure('This pickup code is no longer valid. Ask the user to show the current code.')
        enterPhase('error')
        return
      }
      setPickupStats(result)
    } catch {
      setFailure('Pickup could not be cleared. Check the connection and try again.')
      enterPhase('error')
      return
    }

    enterPhase('done')
    onResolved()
  }

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
        <canvas
          className="scan-frozen-frame"
          ref={frozenFrameRef}
          hidden={!target}
        />

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

      {phase === 'done' && pickupStats && (
        <section className="scan-panel is-done" role="status">
          <span className="pill is-ok">
            <span className="dot" />
            {pickupStats.status === 'already_pickedup' ? 'Already cleared' : 'Cleared'}
          </span>
          <div
            className="scan-progress"
            aria-label={`${pickupStats.pickedUp} of ${pickupStats.total} pickups complete`}
          >
            <div className="scan-progress-primary">
              <strong>{pickupStats.pickedUp}</strong>
              <span>of {pickupStats.total} picked up</span>
            </div>
            <div className="scan-progress-remaining">
              <strong>{pickupStats.remaining}</strong>
              <span>Remaining</span>
            </div>
          </div>
          <p className="scan-hint">
            {pickupStats.allPickedUp
              ? 'All pickups at this location are complete.'
              : `${pickupStats.remaining} ${pickupStats.remaining === 1 ? 'pickup remains' : 'pickups remain'} at this location.`}
          </p>
          <div className="scan-actions">
            {!pickupStats.allPickedUp && (
              <button className="btn btn-primary" type="button" onClick={resumeScanning}>
                Scan another
              </button>
            )}
            <button className="btn" type="button" onClick={onClose}>
              Back to dispatch
            </button>
          </div>
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
