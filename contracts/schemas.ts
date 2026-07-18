/**
 * Contract definitions for the two main business processes.
 *
 * These schemas are deliberately kept independent of the TypeScript domain
 * types in src/types.ts - a contract describes the AGREED wire format
 * between a consumer and this provider, and should not silently drift just
 * because someone renames an internal field. If a schema and the domain type
 * diverge, that's a signal to update the contract deliberately (and version
 * it), not a bug to "fix" by re-deriving one from the other.
 *
 * In a real multi-team setup these would typically live in a shared
 * contracts repository (or a Pact broker) that both the consumer and the
 * provider teams pull from. Here, since there is only one team/service, they
 * live alongside the provider.
 */

const locationSchema = {
  type: 'object',
  required: ['lat', 'lng'],
  properties: {
    lat: { type: 'number' },
    lng: { type: 'number' }
  },
  additionalProperties: false
} as const;

/** Contract for business process #1: booking a ride. */
export const bookRideRequestSchema = {
  type: 'object',
  required: ['pickup', 'destination', 'vehicleClass'],
  properties: {
    pickup: locationSchema,
    destination: locationSchema,
    vehicleClass: { enum: ['economy', 'comfort', 'business'] },
    isPeakHour: { type: 'boolean' }
  },
  additionalProperties: false
};

export const bookRideResponseSchema = {
  type: 'object',
  required: [
    'id',
    'riderId',
    'driverId',
    'status',
    'vehicleClass',
    'estimatedFare',
    'distanceKm',
    'pickup',
    'destination'
  ],
  properties: {
    id: { type: 'string', minLength: 1 },
    riderId: { type: 'string', minLength: 1 },
    driverId: { type: 'string', minLength: 1 },
    status: { enum: ['assigned'] }, // a fresh booking is always "assigned" in this API version
    vehicleClass: { enum: ['economy', 'comfort', 'business'] },
    estimatedFare: { type: 'number', minimum: 0 },
    distanceKm: { type: 'number', minimum: 0 },
    pickup: locationSchema,
    destination: locationSchema
  },
  additionalProperties: true // the provider may add extra fields without breaking this consumer
};

/** Contract for business process #2: completing a ride and charging payment. */
export const completeRideResponseSchema = {
  type: 'object',
  required: ['ride', 'receiptId'],
  properties: {
    ride: {
      type: 'object',
      required: ['id', 'status', 'finalFare'],
      properties: {
        id: { type: 'string', minLength: 1 },
        status: { enum: ['completed'] },
        finalFare: { type: 'number', minimum: 0 }
      },
      additionalProperties: true
    },
    receiptId: { type: 'string', pattern: '^receipt-' }
  },
  additionalProperties: false
};