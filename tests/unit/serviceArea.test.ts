import { isWithinServiceArea } from '../../src/services/serviceArea';

describe('serviceArea: isWithinServiceArea', () => {
  it('returns true for a point well inside the service area', () => {
    // Arrange
    const point = { lat: 50.45, lng: 30.52 };

    // Act
    const result = isWithinServiceArea(point);

    // Assert
    expect(result).toBe(true);
  });

  it('returns true for a point exactly on the boundary', () => {
    const point = { lat: 50.30, lng: 30.30 };
    expect(isWithinServiceArea(point)).toBe(true);
  });

  it('returns false for a point just outside the northern boundary', () => {
    const point = { lat: 50.61, lng: 30.52 };
    expect(isWithinServiceArea(point)).toBe(false);
  });

  it('returns false for a point just outside the eastern boundary', () => {
    const point = { lat: 50.45, lng: 30.76 };
    expect(isWithinServiceArea(point)).toBe(false);
  });

  it('returns false for a point far outside the service area entirely', () => {
    const point = { lat: 10, lng: 10 };
    expect(isWithinServiceArea(point)).toBe(false);
  });
});