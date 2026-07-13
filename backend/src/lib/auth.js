import crypto from 'node:crypto';
import { config } from '../config.js';

function base64Url(input) {
  return Buffer.from(input).toString('base64url');
}

export function signToken(user) {
  const payload = {
    id: user.id || user._id,
    email: user.email,
    role: user.role,
    issuedAt: Date.now()
  };
  const encoded = base64Url(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', config.tokenSecret)
    .update(encoded)
    .digest('base64url');

  return `${encoded}.${signature}`;
}

export function verifyToken(authorization, xAuthToken) {
  const raw = authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : xAuthToken;

  if (!raw || !raw.includes('.')) return null;

  const [encoded, signature] = raw.split('.');
  const expected = crypto
    .createHmac('sha256', config.tokenSecret)
    .update(encoded)
    .digest('base64url');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

export function publicUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}
