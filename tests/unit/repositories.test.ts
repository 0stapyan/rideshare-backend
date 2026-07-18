import { UserRepository } from '../../src/repositories/UserRepository';
import { DriverRepository } from '../../src/repositories/DriverRepository';
import { RideRepository } from '../../src/repositories/RideRepository';

describe('UserRepository', () => {
  it('creates a user and finds it by phone', () => {
    const repo = new UserRepository();
    const user = repo.create('+380501111111', 'hash1');
    expect(repo.findByPhone('+380501111111')).toEqual(user);
  });

  it('returns null when looking up an unknown phone', () => {
    const repo = new UserRepository();
    expect(repo.findByPhone('+380509999999')).toBeNull();
  });

  it('finds a user by id after creation', () => {
    const repo = new UserRepository();
    const user = repo.create('+380502222222', 'hash2');
    expect(repo.findById(user.id)).toEqual(user);
  });

  it('clear() removes all stored users', () => {
    const repo = new UserRepository();
    repo.create('+380503333333', 'hash3');
    repo.clear();
    expect(repo.findByPhone('+380503333333')).toBeNull();
  });
});

describe('DriverRepository', () => {
  it('seeds initial drivers by default', () => {
    const repo = new DriverRepository();
    expect(repo.all().length).toBeGreaterThan(0);
  });

  it('findAvailableByClass returns only online drivers of that class', () => {
    const repo = new DriverRepository();
    const economyDrivers = repo.findAvailableByClass('economy');
    expect(economyDrivers.every((d) => d.online && d.vehicleClass === 'economy')).toBe(true);
  });

  it('setOnline toggles a driver availability', () => {
    const repo = new DriverRepository();
    repo.setOnline('drv-1', false);
    expect(repo.findById('drv-1')?.online).toBe(false);
  });

  it('findById returns null for an unknown driver', () => {
    const repo = new DriverRepository(false);
    expect(repo.findById('nope')).toBeNull();
  });
});

describe('RideRepository', () => {
  const baseRide = {
    riderId: 'rider-1',
    driverId: 'drv-1',
    pickup: { lat: 50.45, lng: 30.52 },
    destination: { lat: 50.46, lng: 30.55 },
    vehicleClass: 'economy' as const,
    status: 'assigned' as const,
    estimatedFare: 100,
    finalFare: null,
    distanceKm: 3,
    createdAt: new Date(),
    assignedAt: new Date(),
    completedAt: null,
    cancelledAt: null
  };

  it('creates a ride and assigns it an id', () => {
    const repo = new RideRepository();
    const ride = repo.create(baseRide);
    expect(ride.id).toBeDefined();
    expect(repo.findById(ride.id)).toEqual(ride);
  });

  it('assigns incrementing ids to successive rides', () => {
    const repo = new RideRepository();
    const first = repo.create(baseRide);
    const second = repo.create(baseRide);
    expect(first.id).not.toBe(second.id);
  });

  it('update() merges a patch into an existing ride', () => {
    const repo = new RideRepository();
    const ride = repo.create(baseRide);
    const updated = repo.update(ride.id, { status: 'completed' });
    expect(updated?.status).toBe('completed');
  });

  it('update() returns null for an unknown ride id', () => {
    const repo = new RideRepository();
    expect(repo.update('missing', { status: 'completed' })).toBeNull();
  });

  it('clear() removes all rides', () => {
    const repo = new RideRepository();
    const ride = repo.create(baseRide);
    repo.clear();
    expect(repo.findById(ride.id)).toBeNull();
  });
});