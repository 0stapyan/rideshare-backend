import { RideService } from '../../src/services/rideService';
import { RideRepository } from '../../src/repositories/RideRepository';
import { DriverRepository } from '../../src/repositories/DriverRepository';

describe('RideService', () => {
  it('books a ride successfully', () => {
    const service = new RideService(new RideRepository(), new DriverRepository());
    const ride = service.bookRide({
      riderId: 'rider-1',
      pickup: { lat: 50.45, lng: 30.52 },
      destination: { lat: 50.46, lng: 30.55 },
      vehicleClass: 'economy'
    });
    expect(ride.status).toBe('assigned');
    expect(ride.driverId).toBe('drv-1');
  });

  it('throws when destination is outside the service area', () => {
    const service = new RideService(new RideRepository(), new DriverRepository());
    expect(() =>
      service.bookRide({
        riderId: 'rider-1',
        pickup: { lat: 50.45, lng: 30.52 },
        destination: { lat: 10, lng: 10 },
        vehicleClass: 'economy'
      })
    ).toThrow();
  });

  it('throws when no driver is available', () => {
    const driverRepo = new DriverRepository();
    // business class driver 'drv-3' is offline in the seed data
    const service = new RideService(new RideRepository(), driverRepo);
    expect(() =>
      service.bookRide({
        riderId: 'rider-1',
        pickup: { lat: 50.45, lng: 30.52 },
        destination: { lat: 50.46, lng: 30.55 },
        vehicleClass: 'business'
      })
    ).toThrow();
  });

  it('completes a ride and returns a receipt', () => {
    const service = new RideService(new RideRepository(), new DriverRepository());
    const ride = service.bookRide({
      riderId: 'rider-1',
      pickup: { lat: 50.45, lng: 30.52 },
      destination: { lat: 50.46, lng: 30.55 },
      vehicleClass: 'economy'
    });
    const result = service.completeRide(ride.id);
    expect(result.ride.status).toBe('completed');
    expect(result.receiptId).toBeDefined();
  });
});