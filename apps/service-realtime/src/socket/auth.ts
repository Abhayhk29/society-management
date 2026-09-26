import { createHmac } from 'crypto';
import type { Socket } from 'socket.io';
import { config } from '../config';

/**
 * Lightweight JWT HS256 verify (header.payload.sig) without adding jsonwebtoken.
 */
export function verifyJwt(token: string): {
  sub: string;
  email?: string;
} | null {
  try {
    const [headerB64, payloadB64, sigB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !sigB64) return null;

    const data = `${headerB64}.${payloadB64}`;
    const expected = createHmac('sha256', config.jwtSecret)
      .update(data)
      .digest('base64url');
    if (expected !== sigB64) return null;

    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8'),
    ) as { sub?: string; email?: string; exp?: number };
    if (!payload.sub) return null;
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return { sub: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void,
) {
  const token =
    (socket.handshake.auth?.token as string | undefined) ||
    (typeof socket.handshake.query.token === 'string'
      ? socket.handshake.query.token
      : undefined);

  if (!token) {
    next(new Error('Unauthorized'));
    return;
  }
  const user = verifyJwt(token);
  if (!user) {
    next(new Error('Unauthorized'));
    return;
  }
  socket.data.userId = user.sub;
  next();
}
