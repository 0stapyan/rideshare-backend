import jwt from 'jsonwebtoken';

const DEFAULT_SECRET = 'dev-secret-change-me';
const JWT_SECRET = process.env.JWT_SECRET ?? DEFAULT_SECRET;
const TOKEN_TTL = '2h';

export interface TokenPayload {
  sub: string; // user id
  phone: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string): TokenPayload {
  // jwt.verify throws TokenExpiredError / JsonWebTokenError on failure - caller handles it.
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
