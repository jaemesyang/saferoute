import { useEffect, useRef } from 'react'
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const FALLBACK_CENTER = [41.2565, -95.9345]
const FALLBACK_ZOOM = 12

const SEVERITY_COLOR = {
  high: '#f0603c',
  med: '#f0a92e',
  low: '#4aa8ff',
}

function radiusFor(headcount, maxHeadcount) {
  const share = maxHeadcount > 0 ? headcount / maxHeadcount : 0
  return 7 + 15 * Math.sqrt(share)
}

function FitToHotspots({ hotspots }) {
  const map = useMap()
  const hasFit = useRef(false)

  useEffect(() => {
    if (hasFit.current || hotspots.length === 0) return
    hasFit.current = true
    map.fitBounds(
      hotspots.map((spot) => [spot.lat, spot.lng]),
      { padding: [48, 48], maxZoom: 14 },
    )
  }, [hotspots, map])

  return null
}

/**
 *
 * @param {Object} props
 * @param {import('./api/hotspots.js').Hotspot[]} props.hotspots
 * @param {string} props.dispatcherName
 * @param {(id: string) => void} props.onClaim
 */
function HotspotMap({ hotspots, dispatcherName, onClaim }) {
  const maxHeadcount = hotspots.reduce(
    (max, spot) => Math.max(max, spot.headcount),
    0,
  )

  return (
    <MapContainer
      className="map-canvas"
      center={FALLBACK_CENTER}
      zoom={FALLBACK_ZOOM}
      scrollWheelZoom
      zoomControl
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />

      <FitToHotspots hotspots={hotspots} />

      {hotspots.map((spot) => {
        const color =
          SEVERITY_COLOR[
          spot.headcount >= 40 ? 'high' : spot.headcount >= 20 ? 'med' : 'low'
          ]
        const isMine = spot.claimedBy === dispatcherName

        return (
          <CircleMarker
            key={spot.id}
            center={[spot.lat, spot.lng]}
            radius={radiusFor(spot.headcount, maxHeadcount)}
            pathOptions={{
              color,
              weight: 2,
              opacity: 0.9,
              fillColor: color,
              fillOpacity: 0.15 + 0.4 * (spot.headcount / (maxHeadcount || 1)),
            }}
          >
            <Popup>
              <div className="map-popup">
                <p className="map-popup-name">{spot.name}</p>
                <p className="map-popup-count">
                  <span className="label">Waiting</span>
                  <strong>{spot.headcount}</strong>
                </p>
                {spot.claimedBy ? (
                  <span className={isMine ? 'pill is-ok' : 'pill is-dim'}>
                    Claimed by {spot.claimedBy}
                  </span>
                ) : (
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => onClaim(spot.id)}
                  >
                    Claim
                  </button>
                )}
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}

export default HotspotMap
