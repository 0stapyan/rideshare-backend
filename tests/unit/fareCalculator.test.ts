import { calculateFare } from '../../src/services/fareCalculator';

describe('calculateFare', () => {
  it('calculates economy fare correctly', () => {
    const fare = calculateFare({ distanceKm: 5, durationMin: 10, vehicleClass: 'economy', isPeakHour: false });
    expect(fare).toBe(75); // 20 + 5*8 + 10*1.5 = 20+40+15 = 75
  });

  it('calculates comfort fare correctly', () => {
    const fare = calculateFare({ distanceKm: 5, durationMin: 10, vehicleClass: 'comfort', isPeakHour: false });
    expect(fare).toBe(110); // 35 + 5*11 + 10*2 = 35+55+20 = 110
  });

  it('calculates business fare correctly', () => {
    const fare = calculateFare({ distanceKm: 5, durationMin: 10, vehicleClass: 'business', isPeakHour: false });
    expect(fare).toBe(190); // 60 + 5*16 + 10*3 = 60+80+30 = 190
  });

  it('applies peak hour surge', () => {
    const normal = calculateFare({ distanceKm: 5, durationMin: 10, vehicleClass: 'economy', isPeakHour: false });
    const peak = calculateFare({ distanceKm: 5, durationMin: 10, vehicleClass: 'economy', isPeakHour: true });
    expect(peak).toBeGreaterThan(normal);
  });

  it('applies minimum fare for very short trips', () => {
    const fare = calculateFare({ distanceKm: 0.1, durationMin: 1, vehicleClass: 'economy', isPeakHour: false });
    expect(fare).toBe(45);
  });

  it('throws for negative distance', () => {
    expect(() => calculateFare({ distanceKm: -1, durationMin: 5, vehicleClass: 'economy', isPeakHour: false })).toThrow();
  });

  it('throws for unknown vehicle class', () => {
    expect(() =>
      calculateFare({ distanceKm: 5, durationMin: 5, vehicleClass: 'ultra' as any, isPeakHour: false })
    ).toThrow();
  });
});