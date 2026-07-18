import { Driver, Location, VehicleClass } from '../types';

/** Simple planar approximation, good enough for a same-city ride-hailing demo. */
export function distanceKm(a: Location, b: Location): number {
  const KM_PER_DEGREE_LAT = 111.32;
  const dLat = (a.lat - b.lat) * KM_PER_DEGREE_LAT;
  const dLng = (a.lng - b.lng) * KM_PER_DEGREE_LAT * Math.cos((a.lat * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/**
 * Finds the nearest available (online) driver of the requested vehicle class.
 * Returns null when no driver is available - caller decides how to handle that.
 */
export function findNearestAvailableDriver(
  drivers: Driver[],
  riderLocation: Location,
  vehicleClass: VehicleClass
): Driver | null {
  const candidates = drivers.filter((d) => d.online && d.vehicleClass === vehicleClass);
  if (candidates.length === 0) return null;

  let nearest = candidates[0];
  let nearestDistance = distanceKm(nearest.location, riderLocation);

  for (const candidate of candidates.slice(1)) {
    const d = distanceKm(candidate.location, riderLocation);
    if (d < nearestDistance) {
      nearest = candidate;
      nearestDistance = d;
    }
  }
  return nearest;
}
