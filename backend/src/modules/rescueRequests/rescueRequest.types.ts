export type ClosestHotspot = {
  id: number
  name: string,
  lat: number,
  lng: number
  distanceMeters: number
}

export type ReportAssignment = {
  id: number
  hotspotId: number
  name: string
  lat: number
  lng: number
  distanceMeters: number
  qrToken: string
}

export type PickupResult =
  | {
  status: 'pickedup' | 'already_pickedup';
  pickedUp: number;
  total: number;
  remaining: number;
  allPickedUp: boolean;
}
  | {
  status: 'invalid';
};