import { calculateFare, getRate } from '../../src/services/fareCalculator';

describe('fareCalculator: calculateFare', () => {
  describe('per-class base pricing', () => {
    it.each(['economy', 'comfort', 'business'] as const)(
      'computes %s fare as base + distance*perKm + duration*perMin (rounded)',
      (vehicleClass) => {
        // Arrange
        const distanceKm = 6;
        const durationMin = 12;
        const rate = getRate(vehicleClass);
        const expected = Math.round(rate.base + distanceKm * rate.perKm + durationMin * rate.perMin);

        // Act
        const fare = calculateFare({ distanceKm, durationMin, vehicleClass, isPeakHour: false });

        // Assert
        expect(fare).toBe(expected);
      }
    );
  });

  describe('peak hour surge', () => {
    it('increases the fare compared to the same trip off-peak', () => {
      // Arrange
      const input = { distanceKm: 8, durationMin: 15, vehicleClass: 'comfort' as const };

      // Act
      const offPeak = calculateFare({ ...input, isPeakHour: false });
      const peak = calculateFare({ ...input, isPeakHour: true });

      // Assert
      expect(peak).toBeGreaterThan(offPeak);
    });

    it('applies exactly the 1.4x surge multiplier before rounding', () => {
      // Arrange
      const input = { distanceKm: 8, durationMin: 15, vehicleClass: 'comfort' as const, isPeakHour: false };
      const rate = getRate('comfort');
      const rawOffPeak = rate.base + 8 * rate.perKm + 15 * rate.perMin;
      const expectedPeak = Math.round(rawOffPeak * 1.4);

      // Act
      const peakFare = calculateFare({ ...input, isPeakHour: true });

      // Assert
      expect(peakFare).toBe(expectedPeak);
    });
  });

  describe('minimum fare floor', () => {
    it('charges the class minimum for a very short, cheap trip', () => {
      // Arrange
      const rate = getRate('economy');

      // Act
      const fare = calculateFare({ distanceKm: 0.1, durationMin: 1, vehicleClass: 'economy', isPeakHour: false });

      // Assert
      expect(fare).toBe(rate.minimumFare);
    });

    it('does not apply the floor once the computed fare exceeds it', () => {
      // Arrange
      const rate = getRate('economy');

      // Act
      const fare = calculateFare({ distanceKm: 20, durationMin: 30, vehicleClass: 'economy', isPeakHour: false });

      // Assert
      expect(fare).toBeGreaterThan(rate.minimumFare);
    });
  });

  describe('input validation', () => {
    it('throws a RangeError for a negative distance', () => {
      // Arrange / Act
      const act = () => calculateFare({ distanceKm: -1, durationMin: 5, vehicleClass: 'economy', isPeakHour: false });

      // Assert
      expect(act).toThrow(RangeError);
    });

    it('throws a RangeError for a negative duration', () => {
      const act = () => calculateFare({ distanceKm: 5, durationMin: -1, vehicleClass: 'economy', isPeakHour: false });
      expect(act).toThrow(RangeError);
    });

    it('throws a RangeError for an unknown vehicle class', () => {
      const act = () =>
        calculateFare({ distanceKm: 5, durationMin: 5, vehicleClass: 'ultra' as any, isPeakHour: false });
      expect(act).toThrow(RangeError);
    });
  });
});