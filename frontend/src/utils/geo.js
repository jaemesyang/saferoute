/**

 * @returns {Promise<{ lat: number, lng: number }>}
 */
export function requestLocation() {
    if (!navigator.geolocation) {
        return Promise.reject(new Error('Geolocation not supported'))
    }
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
            (error) => reject(error),
            { timeout: 10000, maximumAge: 15000, enableHighAccuracy: true }
        )
    })
}

/**

 *
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} 
 */

export function haversineMeters(lat1, lng1, lat2, lng2) {
    const R = 6371.0;

    const toRadians = (degree) => (degree * Math.PI) / 180;

    const rLat1 = toRadians(lat1);
    const rLat2 = toRadians(lat2);
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rLat1) * Math.cos(rLat2) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c * 1000;
}

/**
 *
 * @template {{ lat: number, lng: number }} T
 * @param {{ lat: number, lng: number }} coords
 * @param {T[]} spots
 * @returns {{ spot: T, meters: number } | null}
 */
export function pickClosest(coords, spots) {
    if (!coords || !Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) return null
    if (!Array.isArray(spots) || spots.length === 0) return null

    let best = null
    for (const spot of spots) {
        const meters = haversineMeters(coords.lat, coords.lng, spot.lat, spot.lng)
        if (!Number.isFinite(meters)) continue
        if (best === null || meters < best.meters) best = { spot, meters }
    }
    return best
}
