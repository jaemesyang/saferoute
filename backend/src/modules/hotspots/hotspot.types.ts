export type Hotspot = {
  id: number
  name: string,
  address: string,
  lat: number,
  lng: number,
  assigned: number
  arrived: number
  claimedBy: string | null
}
