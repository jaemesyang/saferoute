// Where the API lives. VITE_API_URL has three meaningful states:
//
//   unset            no backend configured — callers fall back to demo stubs
//   ''               same origin: requests go to /api/... and whatever serves
//                    the page forwards them (the Vite dev proxy in dev)
//   'http://host…'   an explicit absolute backend origin
//
// The empty case is the one that matters in dev. An absolute
// http://localhost:3000 is wrong the moment the page is opened from anything
// but the dev machine: on a phone hitting the LAN URL, localhost is the phone
// itself. Same-origin relative URLs sidestep that — the browser only ever
// talks to the frontend origin, and Vite forwards from the node process.
//
// Note the distinction between unset and empty is load-bearing: `!baseUrl` was
// true for both, so an empty value used to drop the whole app into stub mode.
const API_BASE: string | undefined = import.meta.env?.VITE_API_URL;

// Returns the URL to call, or null when no backend is configured at all.
// Never returns an empty string, so callers can keep testing it for falsiness.
export function apiUrl(path: string): string | null {
  return API_BASE === undefined ? null : `${API_BASE}${path}`;
}
