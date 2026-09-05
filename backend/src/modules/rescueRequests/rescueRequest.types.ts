export type Point = {
  x: number,
  y: number
}

export type ClosestHotspot = {
  id: number
  name: string,
  lat: number,
  lng: number
  distanceMeters: number
}

export type ReportAssignment = {
  id: string
  name: string
  lat: number
  lng: number
  distanceMeters: number
}
