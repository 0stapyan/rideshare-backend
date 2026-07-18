export type VehicleClass = 'economy' | 'comfort' | 'business';

export type RideStatus =
  | 'searching'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Location {
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  phone: string;
  passwordHash: string;
  createdAt: Date;
}

export interface Driver {
  id: string;
  name: string;
  vehicleClass: VehicleClass;
  location: Location;
  online: boolean;
  rating: number;
}

export interface Ride {
  id: string;
  riderId: string;
  driverId: string | null;
  pickup: Location;
  destination: Location;
  vehicleClass: VehicleClass;
  status: RideStatus;
  estimatedFare: number;
  finalFare: number | null;
  distanceKm: number;
  createdAt: Date;
  assignedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
}

export class DomainError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NoDriverAvailableError extends DomainError {
  constructor() {
    super('No available driver found nearby', 'NO_DRIVER_AVAILABLE');
  }
}

export class OutsideServiceAreaError extends DomainError {
  constructor() {
    super('Destination is outside the service area', 'OUTSIDE_SERVICE_AREA');
  }
}

export class RideNotFoundError extends DomainError {
  constructor(rideId: string) {
    super(`Ride ${rideId} not found`, 'RIDE_NOT_FOUND');
  }
}

export class InvalidRideStateError extends DomainError {
  constructor(message: string) {
    super(message, 'INVALID_RIDE_STATE');
  }
}
