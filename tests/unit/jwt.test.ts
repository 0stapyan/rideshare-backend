import { signToken, verifyToken } from '../../src/utils/jwt';
import jwt from 'jsonwebtoken';

describe('jwt: signToken / verifyToken', () => {
  it('round-trips a payload correctly', () => {
    // Arrange
    const payload = { sub: 'user-1', phone: '+380501234567' };

    // Act
    const token = signToken(payload);
    const decoded = verifyToken(token);

    // Assert
    expect(decoded.sub).toBe('user-1');
    expect(decoded.phone).toBe('+380501234567');
  });

  it('throws for a tampered token', () => {
    const token = signToken({ sub: 'user-1', phone: '+380501234567' });
    const tampered = token.slice(0, -2) + 'xx';
    expect(() => verifyToken(tampered)).toThrow();
  });

  it('throws for a malformed token string', () => {
    expect(() => verifyToken('not-a-real-token')).toThrow();
  });

  it('throws for an expired token (deterministic, no real waiting)', () => {
    // Arrange: fabricate a token whose `exp` claim is already in the past,
    // instead of signing a short-lived token and waiting for real time to pass.
    const nowSeconds = Math.floor(Date.now() / 1000);
    const alreadyExpiredToken = jwt.sign(
      { sub: 'user-1', phone: '+380501234567', exp: nowSeconds - 10 },
      'dev-secret-change-me'
    );

    // Act / Assert
    expect(() => verifyToken(alreadyExpiredToken)).toThrow(/expired|jwt/i);
  });
});