export type Hotspot = {
  id: number
  name: string,
  lat: number,
  lng: number,
  assigned: number
  arrived: number
  claimedBy: string | null
}

export type ClaimResult =
  | {status: 'claimed', claimedBy: string, resolveToken: string}
  | {status: 'notFound'}
  | {status: 'conflict', claimedBy: string}

export type ResolveResult =
  | {status: 'resolved'}
  | {status: 'notFound'}
  | {status: 'badToken'}
