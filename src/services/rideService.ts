import { RideRepository } from '../repositories/RideRepository';
import { DriverRepository } from '../repositories/DriverRepository';
import { calculateFare } from './fareCalculator';
import { findNearestAvailableDriver, distanceKm } from './driverMatcher';
import { isWithinServiceArea } from './serviceArea';
import {
  Location,
  Ride,
  VehicleClass,
  NoDriverAvailableError,
  OutsideServiceAreaError,
  RideNotFoundError,
  InvalidRideStateError
} from '../types';

const CANCELLATION_GRACE_MINUTES = 2;
const CANCELLATION_FEE = 30;

export interface BookRideInput {
  riderId: string;
  pickup: Location;
  destination: Location;
  vehicleClass: VehicleClass;
  isPeakHour?: boolean;
  now?: Date;
}

export interface CompleteRideResult {
  ride: Ride;
  receiptId: string;
}

export class RideService {
  constructor(
    private rideRepo: RideRepository,
    private driverRepo: DriverRepository
  ) {}

  /** Business process #1: booking a ride. */
  bookRide(input: BookRideInput): Ride {
    const { riderId, pickup, destination, vehicleClass, isPeakHour = false } = input;
    const now = input.now ?? new Date();

    if (!isWithinServiceArea(destination)) {
      throw new OutsideServiceAreaError();
    }

    const driver = findNearestAvailableDriver(
      this.driverRepo.all(),
      pickup,
      vehicleClass
    );

    const distance = distanceKm(pickup, destination);
    const durationMin = Math.max(1, Math.round(distance * 2.2)); // rough demo heuristic
    const estimatedFare = calculateFare({
      distanceKm: distance,
      durationMin,
      vehicleClass,
      isPeakHour
    });

    if (!driver) {
      throw new NoDriverAvailableError();
    }

    const ride = this.rideRepo.create({
      riderId,
      driverId: driver.id,
      pickup,
      destination,
      vehicleClass,
      status: 'assigned',
      estimatedFare,
      finalFare: null,
      distanceKm: distance,
      createdAt: now,
      assignedAt: now,
      completedAt: null,
      cancelledAt: null
    });

    return ride;
  }

  /** Cancellation flow (also exercised by unit tests, not one of the two "main" processes). */
  cancelRide(rideId: string, now: Date = new Date()): Ride {
    const ride = this.rideRepo.findById(rideId);
    if (!ride) throw new RideNotFoundError(rideId);
    if (ride.status === 'completed' || ride.status === 'cancelled') {
      throw new InvalidRideStateError(`Cannot cancel a ride in status "${ride.status}"`);
    }

    const minutesSinceAssigned = ride.assignedAt
      ? (now.getTime() - ride.assignedAt.getTime()) / 60000
      : 0;

    const feeApplies = ride.status === 'assigned' && minutesSinceAssigned > CANCELLATION_GRACE_MINUTES;

    return this.rideRepo.update(rideId, {
      status: 'cancelled',
      cancelledAt: now,
      finalFare: feeApplies ? CANCELLATION_FEE : null
    }) as Ride;
  }

  /** Business process #2: completing a ride and charging the final fare. */
  completeRide(rideId: string, actualDistanceKm?: number, now: Date = new Date()): CompleteRideResult {
    const ride = this.rideRepo.findById(rideId);
    if (!ride) throw new RideNotFoundError(rideId);
    if (ride.status !== 'assigned' && ride.status !== 'in_progress') {
      throw new InvalidRideStateError(`Cannot complete a ride in status "${ride.status}"`);
    }

    const distance = actualDistanceKm ?? ride.distanceKm;
    const durationMin = Math.max(1, Math.round(distance * 2.2));
    const finalFare = calculateFare({
      distanceKm: distance,
      durationMin,
      vehicleClass: ride.vehicleClass,
      isPeakHour: false
    });

    const updated = this.rideRepo.update(rideId, {
      status: 'completed',
      finalFare,
      completedAt: now
    }) as Ride;

    const receiptId = `receipt-${rideId}-${now.getTime()}`;
    return { ride: updated, receiptId };
  }
}
