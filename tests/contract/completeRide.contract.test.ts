import request from 'supertest';
import { createApp } from '../../src/app';
import { signToken } from '../../src/utils/jwt';
import { completeRideResponseSchema } from '../../contracts/schemas';
import { assertMatchesContract } from './assertMatchesContract';

/**
 * Contract test for business process #2: "complete a ride & charge payment"
 * (POST /rides/:id/complete).
 *
 * As with the booking contract test, this verifies the SHAPE of the
 * response the provider promises to consumers (mobile app, future partner
 * integrations, etc.), not the specific fare numbers - that business logic
 * is already unit-tested in rideService.test.ts.
 */
describe('Contract: POST /rides/:id/complete (complete a ride & payment)', () => {
  async function bookAFreshRide(app: ReturnType<typeof createApp>, token: string) {
    const bookRes = await request(app)
      .post('/rides')
      .set('Authorization', `Bearer ${token}`)
      .send({
        pickup: { lat: 50.45, lng: 30.52 },
        destination: { lat: 50.46, lng: 30.55 },
        vehicleClass: 'economy'
      });
    return bookRes.body.id as string;
  }

  it('returns a response matching the agreed response contract on a successful completion', async () => {
    // Arrange
    const app = createApp();
    const token = signToken({ sub: 'rider-contract-3', phone: '+380500000003' });
    const rideId = await bookAFreshRide(app, token);

    // Act
    const res = await request(app)
      .post(`/rides/${rideId}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    // Assert
    expect(res.status).toBe(200);
    expect(() => assertMatchesContract(completeRideResponseSchema, res.body)).not.toThrow();
  });

  it('rejects completion of a ride that does not exist, without violating the contract shape for errors', async () => {
    const app = createApp();
    const token = signToken({ sub: 'rider-contract-4', phone: '+380500000004' });

    const res = await request(app)
      .post('/rides/does-not-exist/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(404);
    // Error responses are outside today's formal contract (no schema for
    // them yet) - documenting that gap here rather than silently ignoring it.
  });

  it('requires authentication, consistent with the security contract enforced by authMiddleware', async () => {
    const app = createApp();

    const res = await request(app).post('/rides/some-id/complete').send({});

    expect(res.status).toBe(401);
  });
});