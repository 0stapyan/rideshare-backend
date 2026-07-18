import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { requireAuth, AuthenticatedRequest } from '../../src/middleware/authMiddleware';
import { signToken } from '../../src/utils/jwt';
import { createApp } from '../../src/app';

/**
 * Narrow integration test target: a minimal Express app with exactly one
 * protected route wired to the REAL requireAuth middleware and the REAL jwt
 * utilities. This deliberately does NOT go through rideService/authService -
 * we only want to verify the middleware <-> routing integration itself,
 * not the rest of the business logic (that's covered by unit tests already).
 */
function buildMinimalProtectedApp() {
  const app = express();
  app.use(express.json());

  app.get('/public', (_req, res) => res.status(200).json({ ok: true }));

  app.get('/protected', requireAuth, (req: AuthenticatedRequest, res) => {
    res.status(200).json({ ok: true, user: req.user });
  });

  return app;
}

describe('authMiddleware (narrow integration with real Express routing + real JWT)', () => {
  describe('missing or malformed Authorization header', () => {
    it('rejects a request with no Authorization header at all', async () => {
      const app = buildMinimalProtectedApp();

      const res = await request(app).get('/protected');

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/missing|malformed/i);
    });

    it('rejects a request whose header does not start with "Bearer "', async () => {
      const app = buildMinimalProtectedApp();

      const res = await request(app).get('/protected').set('Authorization', 'Basic abc123');

      expect(res.status).toBe(401);
    });

    it('rejects a request with "Bearer " but no actual token', async () => {
      const app = buildMinimalProtectedApp();

      const res = await request(app).get('/protected').set('Authorization', 'Bearer ');

      expect(res.status).toBe(401);
    });
  });

  describe('invalid tokens', () => {
    it('rejects a syntactically invalid token', async () => {
      const app = buildMinimalProtectedApp();

      const res = await request(app).get('/protected').set('Authorization', 'Bearer not-a-real-jwt');

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid/i);
    });

    it('rejects a token signed with the wrong secret', async () => {
      const app = buildMinimalProtectedApp();
      const forgedToken = jwt.sign({ sub: 'attacker', phone: '+000000000' }, 'not-the-real-secret');

      const res = await request(app).get('/protected').set('Authorization', `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid/i);
    });

    it('rejects a tampered (payload-modified) token', async () => {
      const app = buildMinimalProtectedApp();
      const validToken = signToken({ sub: 'user-1', phone: '+380501234567' });
      const tampered = validToken.slice(0, -4) + 'abcd';

      const res = await request(app).get('/protected').set('Authorization', `Bearer ${tampered}`);

      expect(res.status).toBe(401);
    });

    it('rejects an expired token with a specific "expired" message (deterministic, no real waiting)', async () => {
      const app = buildMinimalProtectedApp();
      const nowSeconds = Math.floor(Date.now() / 1000);
      const expiredToken = jwt.sign(
        { sub: 'user-1', phone: '+380501234567', exp: nowSeconds - 10 },
        'dev-secret-change-me'
      );

      const res = await request(app).get('/protected').set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/expired/i);
    });
  });

  describe('valid token', () => {
    it('grants access and attaches the decoded payload as req.user', async () => {
      const app = buildMinimalProtectedApp();
      const token = signToken({ sub: 'user-42', phone: '+380509998877' });

      const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toEqual(expect.objectContaining({ sub: 'user-42', phone: '+380509998877' }));
    });
  });

  describe('unprotected routes are unaffected', () => {
    it('allows access to a public route with no Authorization header at all', async () => {
      const app = buildMinimalProtectedApp();

      const res = await request(app).get('/public');

      expect(res.status).toBe(200);
    });
  });

  describe('selective application on the real app', () => {
    it('requires auth on /rides but not on /auth/register, using the real app wiring', async () => {
      const app = createApp();

      const registerRes = await request(app)
        .post('/auth/register')
        .send({ phone: '+380501112233', password: 'pw12345' });
      expect(registerRes.status).toBe(201);

      const rideRes = await request(app)
        .post('/rides')
        .send({ pickup: { lat: 50.45, lng: 30.52 }, destination: { lat: 50.46, lng: 30.55 }, vehicleClass: 'economy' });
      expect(rideRes.status).toBe(401);
    });
  });
});