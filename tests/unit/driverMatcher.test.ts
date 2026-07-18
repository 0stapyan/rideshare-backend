import { findNearestAvailableDriver, distanceKm } from '../../src/services/driverMatcher';
import { Driver } from '../../src/types';

function makeDriver(overrides: Partial<Driver>): Driver {
  return {
    id: 'd0',
    name: 'Test driver',
    vehicleClass: 'economy',
    location: { lat: 50.45, lng: 30.52 },
    online: true,
    rating: 4.5,
    ...overrides
  };
}

describe('driverMatcher: findNearestAvailableDriver', () => {
  describe('selecting the closest online driver', () => {
    it('returns the driver with the smallest distance to the rider', () => {
      // Arrange
      const rider = { lat: 50.451, lng: 30.521 };
      const drivers = [
        makeDriver({ id: 'near', location: { lat: 50.4511, lng: 30.5211 } }),
        makeDriver({ id: 'far', location: { lat: 50.50, lng: 30.60 } })
      ];

      // Act
      const result = findNearestAvailableDriver(drivers, rider, 'economy');

      // Assert
      expect(result?.id).toBe('near');
    });

    it('ignores drivers of a different vehicle class even if closer', () => {
      const rider = { lat: 50.45, lng: 30.52 };
      const drivers = [
        makeDriver({ id: 'wrong-class', vehicleClass: 'business', location: { lat: 50.45, lng: 30.52 } }),
        makeDriver({ id: 'right-class', vehicleClass: 'economy', location: { lat: 50.46, lng: 30.55 } })
      ];

      const result = findNearestAvailableDriver(drivers, rider, 'economy');

      expect(result?.id).toBe('right-class');
    });

    it('ignores offline drivers even when they are geographically closest', () => {
      const rider = { lat: 50.45, lng: 30.52 };
      const drivers = [
        makeDriver({ id: 'offline-but-closest', online: false, location: { lat: 50.45, lng: 30.52 } }),
        makeDriver({ id: 'online-further', online: true, location: { lat: 50.46, lng: 30.55 } })
      ];

      const result = findNearestAvailableDriver(drivers, rider, 'economy');

      expect(result?.id).toBe('online-further');
    });
  });

  describe('no driver available', () => {
    it('returns null when the list is empty', () => {
      expect(findNearestAvailableDriver([], { lat: 50.45, lng: 30.52 }, 'economy')).toBeNull();
    });

    it('returns null when every candidate of that class is offline', () => {
      const drivers = [makeDriver({ online: false }), makeDriver({ id: 'd2', online: false })];
      expect(findNearestAvailableDriver(drivers, { lat: 50.45, lng: 30.52 }, 'economy')).toBeNull();
    });
  });

  describe('tie-break behaviour', () => {
    it('deterministically picks one driver when two are equidistant', () => {
      // Arrange: 'first' and 'second' are placed at the exact same distance from the rider
      const rider = { lat: 50.45, lng: 30.52 };
      const drivers = [
        makeDriver({ id: 'first', location: { lat: 50.46, lng: 30.52 } }),
        makeDriver({ id: 'second', location: { lat: 50.44, lng: 30.52 } })
      ];

      // Act
      const result = findNearestAvailableDriver(drivers, rider, 'economy');

      // Assert: current implementation keeps the first strictly-smaller distance found,
      // so on an exact tie the earlier candidate in the array wins. This test documents
      // that behaviour explicitly instead of leaving it undefined.
      expect(result?.id).toBe('first');
    });
  });
});

describe('driverMatcher: distanceKm', () => {
  it('returns 0 for two identical points', () => {
    expect(distanceKm({ lat: 50.45, lng: 30.52 }, { lat: 50.45, lng: 30.52 })).toBe(0);
  });

  it('returns a larger value for a further point', () => {
    const origin = { lat: 50.45, lng: 30.52 };
    const near = distanceKm(origin, { lat: 50.451, lng: 30.521 });
    const far = distanceKm(origin, { lat: 50.55, lng: 30.70 });
    expect(far).toBeGreaterThan(near);
  });

  it('is symmetric: distance(a,b) equals distance(b,a)', () => {
    const a = { lat: 50.45, lng: 30.52 };
    const b = { lat: 50.50, lng: 30.60 };
    expect(distanceKm(a, b)).toBeCloseTo(distanceKm(b, a), 10);
  });
});