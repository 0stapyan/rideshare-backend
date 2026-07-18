import { findNearestAvailableDriver, distanceKm } from '../../src/services/driverMatcher';
import { Driver } from '../../src/types';

const drivers: Driver[] = [
  { id: 'd1', name: 'A', vehicleClass: 'economy', location: { lat: 50.45, lng: 30.52 }, online: true, rating: 4.5 },
  { id: 'd2', name: 'B', vehicleClass: 'economy', location: { lat: 50.50, lng: 30.60 }, online: true, rating: 4.5 },
  { id: 'd3', name: 'C', vehicleClass: 'comfort', location: { lat: 50.45, lng: 30.52 }, online: true, rating: 4.5 },
  { id: 'd4', name: 'D', vehicleClass: 'economy', location: { lat: 50.45, lng: 30.53 }, online: false, rating: 4.5 }
];

describe('findNearestAvailableDriver', () => {
  it('finds the nearest driver of the requested class', () => {
    const result = findNearestAvailableDriver(drivers, { lat: 50.451, lng: 30.521 }, 'economy');
    expect(result?.id).toBe('d1');
  });

  it('returns null when no driver of that class is online', () => {
    const result = findNearestAvailableDriver(drivers, { lat: 50.45, lng: 30.52 }, 'business');
    expect(result).toBeNull();
  });

  it('ignores offline drivers', () => {
    const onlyOffline: Driver[] = [drivers[3]];
    const result = findNearestAvailableDriver(onlyOffline, { lat: 50.45, lng: 30.52 }, 'economy');
    expect(result).toBeNull();
  });
});

describe('distanceKm', () => {
  it('returns 0 for the same point', () => {
    expect(distanceKm({ lat: 50.45, lng: 30.52 }, { lat: 50.45, lng: 30.52 })).toBe(0);
  });

  it('returns a positive number for different points', () => {
    expect(distanceKm({ lat: 50.45, lng: 30.52 }, { lat: 50.50, lng: 30.60 })).toBeGreaterThan(0);
  });
});