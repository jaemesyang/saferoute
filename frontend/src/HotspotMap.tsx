import { useEffect, useRef } from 'react'
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import type { LatLngTuple } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Hotspot } from './api/hotspots'

const FALLBACK_CENTER: LatLngTuple = [41.2565, -95.9345]
const FALLBACK_ZOOM = 12

const SEVERITY_COLOR = {
  high: '#b00d0dff',
  med: '#f7ff09ff',
  low: '#aeafb6ff',
}

function radiusFor(total: number, maxTotal: number) {
  const share = maxTotal > 0 ? total / maxTotal : 0
  return 7 + 15 * Math.sqrt(share)
}

function FitToHotspots({ hotspots }: { hotspots: Hotspot[] }) {
  const map = useMap()
  const hasFit = useRef(false)

  useEffect(() => {
    if (hasFit.current || hotspots.length === 0) return
    hasFit.current = true
    map.fitBounds(
      hotspots.map((spot): LatLngTuple => [spot.lat, spot.lng]),
      { padding: [48, 48], maxZoom: 14 },
    )
  }, [hotspots, map])

  return null
}

interface HotspotMapProps {
  hotspots: Hotspot[]
  dispatcherName: string
  onClaim: (id: number) => void
}

function HotspotMap({ hotspots, dispatcherName, onClaim }: HotspotMapProps) {
  const maxTotal = hotspots.reduce(
    (max, spot) => Math.max(max, spot.assigned + spot.arrived),
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
        const total = spot.assigned + spot.arrived
        const color =
          SEVERITY_COLOR[
          spot.assigned >= 40 ? 'high' : spot.assigned >= 20 ? 'med' : 'low'
          ]
        const isMine = spot.claimedBy === dispatcherName

        return (
          <CircleMarker
            key={spot.id}
            center={[spot.lat, spot.lng]}
            radius={radiusFor(total, maxTotal)}
            pathOptions={{
              color,
              weight: 2,
              opacity: 0.9,
              fillColor: color,
              fillOpacity: 0.15 + 0.4 * (total / (maxTotal || 1)),
            }}
          >
            <Popup>
              <div className="map-popup">
                <p className="map-popup-name">{spot.name}</p>
                <p className="map-popup-address">{spot.address}</p>
                <p className="map-popup-count">
                  <span className="label">Assigned</span>
                  <strong>{spot.assigned}</strong>
                  <span className="label">Arrived</span>
                  <strong>{spot.arrived}</strong>
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
