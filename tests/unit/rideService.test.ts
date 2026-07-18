import { RideService } from '../../src/services/rideService';
import { RideRepository } from '../../src/repositories/RideRepository';
import { DriverRepository } from '../../src/repositories/DriverRepository';
import {
  NoDriverAvailableError,
  OutsideServiceAreaError,
  Ride,
  Driver
} from '../../src/types';

function makeMockDriverRepo(drivers: Driver[]): jest.Mocked<DriverRepository> {
  return {
    all: jest.fn().mockReturnValue(drivers),
    findAvailableByClass: jest.fn(),
    findById: jest.fn(),
    setOnline: jest.fn()
  } as unknown as jest.Mocked<DriverRepository>;
}

function makeMockRideRepo(): jest.Mocked<RideRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    clear: jest.fn()
  } as unknown as jest.Mocked<RideRepository>;
}

const KYIV_PICKUP = { lat: 50.45, lng: 30.52 };
const KYIV_DESTINATION = { lat: 50.46, lng: 30.55 };
const OUTSIDE_DESTINATION = { lat: 10, lng: 10 };

describe('RideService: bookRide', () => {
  describe('happy path', () => {
    it('assigns the ride to the nearest available driver and persists it via the repository', () => {
      // Arrange
      const onlineDriver: Driver = {
        id: 'drv-mock-1',
        name: 'Mock driver',
        vehicleClass: 'economy',
        location: KYIV_PICKUP,
        online: true,
        rating: 5
      };
      const driverRepo = makeMockDriverRepo([onlineDriver]);
      const rideRepo = makeMockRideRepo();
      rideRepo.create.mockImplementation((ride) => ({ ...ride, id: 'ride-mock-1' } as Ride));
      const service = new RideService(rideRepo, driverRepo);

      // Act
      const ride = service.bookRide({
        riderId: 'rider-42',
        pickup: KYIV_PICKUP,
        destination: KYIV_DESTINATION,
        vehicleClass: 'economy'
      });

      // Assert
      expect(ride.status).toBe('assigned');
      expect(ride.driverId).toBe('drv-mock-1');
      expect(rideRepo.create).toHaveBeenCalledTimes(1);
      expect(rideRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ riderId: 'rider-42', driverId: 'drv-mock-1', status: 'assigned' })
      );
    });
  });

  describe('no driver available', () => {
    it('throws NoDriverAvailableError and does not persist any ride', () => {
      // Arrange: mock repo simulates zero online drivers of the requested class
      const driverRepo = makeMockDriverRepo([]);
      const rideRepo = makeMockRideRepo();
      const service = new RideService(rideRepo, driverRepo);

      // Act
      const act = () =>
        service.bookRide({
          riderId: 'rider-42',
          pickup: KYIV_PICKUP,
          destination: KYIV_DESTINATION,
          vehicleClass: 'economy'
        });

      // Assert
      expect(act).toThrow(NoDriverAvailableError);
      expect(rideRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('destination outside the service area', () => {
    it('throws OutsideServiceAreaError before even looking for a driver', () => {
      // Arrange
      const driverRepo = makeMockDriverRepo([
        { id: 'drv-x', name: 'X', vehicleClass: 'economy', location: KYIV_PICKUP, online: true, rating: 5 }
      ]);
      const rideRepo = makeMockRideRepo();
      const service = new RideService(rideRepo, driverRepo);

      // Act
      const act = () =>
        service.bookRide({
          riderId: 'rider-42',
          pickup: KYIV_PICKUP,
          destination: OUTSIDE_DESTINATION,
          vehicleClass: 'economy'
        });

      // Assert
      expect(act).toThrow(OutsideServiceAreaError);
      // Validating the service area first means the driver search is never even attempted.
      expect(driverRepo.all).not.toHaveBeenCalled();
      expect(rideRepo.create).not.toHaveBeenCalled();
    });
  });
});

describe('RideService: cancelRide', () => {
  it('cancels with no fee when cancelled within the grace period', () => {
    // Arrange
    const now = new Date('2026-01-01T12:05:00Z');
    const assignedAt = new Date('2026-01-01T12:04:00Z'); // 1 minute ago, within the 2-minute grace period
    const existingRide: Ride = {
      id: 'ride-1',
      riderId: 'rider-1',
      driverId: 'drv-1',
      pickup: KYIV_PICKUP,
      destination: KYIV_DESTINATION,
      vehicleClass: 'economy',
      status: 'assigned',
      estimatedFare: 100,
      finalFare: null,
      distanceKm: 3,
      createdAt: assignedAt,
      assignedAt,
      completedAt: null,
      cancelledAt: null
    };
    const rideRepo = makeMockRideRepo();
    rideRepo.findById.mockReturnValue(existingRide);
    rideRepo.update.mockImplementation((_id, patch) => ({ ...existingRide, ...patch } as Ride));
    const service = new RideService(rideRepo, makeMockDriverRepo([]));

    // Act
    const cancelled = service.cancelRide('ride-1', now);

    // Assert
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.finalFare).toBeNull();
    expect(rideRepo.update).toHaveBeenCalledWith('ride-1', expect.objectContaining({ finalFare: null }));
  });

  it('applies a cancellation fee when cancelled after the grace period', () => {
    // Arrange
    const now = new Date('2026-01-01T12:10:00Z');
    const assignedAt = new Date('2026-01-01T12:04:00Z'); // 6 minutes ago, past the 2-minute grace period
    const existingRide: Ride = {
      id: 'ride-2',
      riderId: 'rider-1',
      driverId: 'drv-1',
      pickup: KYIV_PICKUP,
      destination: KYIV_DESTINATION,
      vehicleClass: 'economy',
      status: 'assigned',
      estimatedFare: 100,
      finalFare: null,
      distanceKm: 3,
      createdAt: assignedAt,
      assignedAt,
      completedAt: null,
      cancelledAt: null
    };
    const rideRepo = makeMockRideRepo();
    rideRepo.findById.mockReturnValue(existingRide);
    rideRepo.update.mockImplementation((_id, patch) => ({ ...existingRide, ...patch } as Ride));
    const service = new RideService(rideRepo, makeMockDriverRepo([]));

    // Act
    const cancelled = service.cancelRide('ride-2', now);

    // Assert
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.finalFare).toBe(30); // CANCELLATION_FEE
  });

  it('throws when trying to cancel a ride that does not exist', () => {
    const rideRepo = makeMockRideRepo();
    rideRepo.findById.mockReturnValue(null);
    const service = new RideService(rideRepo, makeMockDriverRepo([]));

    expect(() => service.cancelRide('missing-ride')).toThrow(/not found/i);
  });
});