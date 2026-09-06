export type ClosestHotspot = {
  id: number
  name: string,
  lat: number,
  lng: number
  distanceMeters: number
}

export type ReportAssignment = {
  id: string
  hotspotId: number
  name: string
  lat: number
  lng: number
  distanceMeters: number
}
