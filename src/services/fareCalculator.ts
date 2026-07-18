import { VehicleClass } from '../types';

export interface FareInput {
  distanceKm: number;
  durationMin: number;
  vehicleClass: VehicleClass;
  isPeakHour: boolean;
}

interface ClassRate {
  base: number;
  perKm: number;
  perMin: number;
  minimumFare: number;
}

const RATES: Record<VehicleClass, ClassRate> = {
  economy: { base: 20, perKm: 8, perMin: 1.5, minimumFare: 45 },
  comfort: { base: 35, perKm: 11, perMin: 2, minimumFare: 70 },
  business: { base: 60, perKm: 16, perMin: 3, minimumFare: 120 }
};

const PEAK_SURGE_MULTIPLIER = 1.4;

/**
 * Calculates the ride fare for a given input.
 * Pure function: no I/O, fully deterministic -> ideal unit-test target.
 */
export function calculateFare(input: FareInput): number {
  const { distanceKm, durationMin, vehicleClass, isPeakHour } = input;

  if (distanceKm < 0 || durationMin < 0) {
    throw new RangeError('distanceKm and durationMin must be non-negative');
  }
  if (!(vehicleClass in RATES)) {
    throw new RangeError(`Unknown vehicle class: ${vehicleClass}`);
  }

  const rate = RATES[vehicleClass];
  let fare = rate.base + distanceKm * rate.perKm + durationMin * rate.perMin;

  if (isPeakHour) {
    fare *= PEAK_SURGE_MULTIPLIER;
  }

  fare = Math.max(fare, rate.minimumFare);

  // round to nearest whole currency unit
  return Math.round(fare);
}

export function getRate(vehicleClass: VehicleClass): ClassRate {
  return RATES[vehicleClass];
}
