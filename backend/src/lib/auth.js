import crypto from 'node:crypto';
import { config } from '../config.js';

function base64Url(input) {
  return Buffer.from(input).toString('base64url');
}

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export function signToken(user) {
  const payload = {
    id: user.id || user._id,
    email: user.email,
    role: user.role,
    issuedAt: Date.now(),
    expiresAt: Date.now() + TOKEN_EXPIRY_MS
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
  if (!encoded || !signature) return null;

  const expected = crypto
    .createHmac('sha256', config.tokenSecret)
    .update(encoded)
    .digest('base64url');

  // timingSafeEqual throws if buffers have different lengths
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    // Check token expiry
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function publicUser(user) {
  if (!user) return null;
  const raw = typeof user.toObject === 'function' ? user.toObject() : (user._doc ? { ...user._doc } : { ...user });
  const { password, ...safeUser } = raw;
  return safeUser;
}
