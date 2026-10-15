import crypto from 'node:crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encode a buffer into standard RFC 4648 Base32 string (without padding)
 */
export function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decode standard RFC 4648 Base32 string into Buffer
 */
export function base32Decode(str) {
  if (!str || typeof str !== 'string') {
    throw new Error('Base32 string is required');
  }

  const clean = str.toUpperCase().replace(/[\s=-]/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];

  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean[i]);
    if (val === -1) {
      throw new Error(`Invalid Base32 character: ${clean[i]}`);
    }
    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generate a cryptographically random Base32 secret (default: 20 bytes = 160 bits)
 */
export function generateBase32Secret(byteLength = 20) {
  const bytes = crypto.randomBytes(byteLength);
  return base32Encode(bytes);
}

/**
 * Generate RFC 6238 TOTP passcode (default: 6 digits, 30s step, HMAC-SHA1)
 */
export function generateTOTP(secret, timeSec = Math.floor(Date.now() / 1000), step = 30, digits = 6) {
  const secretBuffer = Buffer.isBuffer(secret) ? secret : base32Decode(secret);
  const T = Math.floor(timeSec / step);

  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(T), 0);

  const hmac = crypto.createHmac('sha1', secretBuffer).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;

  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const code = binary % 10 ** digits;
  return code.toString().padStart(digits, '0');
}

/**
 * Verify RFC 6238 TOTP with clock drift window tolerance (default: ±1 step = ±30s)
 */
export function verifyTOTP(token, secret, window = 1, step = 30, timeSec = Math.floor(Date.now() / 1000)) {
  if (!token || typeof token !== 'string') return false;
  const cleanToken = token.trim();
  if (!/^\d{6}$/.test(cleanToken)) return false;

  const currentT = Math.floor(timeSec / step);
  const secretBuffer = Buffer.isBuffer(secret) ? secret : base32Decode(secret);

  for (let offset = -window; offset <= window; offset++) {
    const checkTime = (currentT + offset) * step;
    const expected = generateTOTP(secretBuffer, checkTime, step, 6);

    const tokenBuf = Buffer.from(cleanToken, 'utf8');
    const expectedBuf = Buffer.from(expected, 'utf8');

    if (tokenBuf.length === expectedBuf.length && crypto.timingSafeEqual(tokenBuf, expectedBuf)) {
      return true;
    }
  }

  return false;
}

/**
 * Generate otpauth:// URI for QR code integration in Google Authenticator / Authy / 1Password
 */
export function generateOtpAuthUri({ secret, email, issuer = 'MujCode' }) {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generate single-use alphanumeric backup recovery codes
 */
export function generateBackupCodes(count = 8, length = 10) {
  const codes = [];
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // base32 human friendly (no I/O)

  for (let i = 0; i < count; i++) {
    const bytes = crypto.randomBytes(length);
    let code = '';
    for (let j = 0; j < length; j++) {
      code += chars[bytes[j] % chars.length];
    }
    // Format as 5-5 (e.g. ABCDE-12345)
    codes.push(`${code.slice(0, 5)}-${code.slice(5)}`);
  }

  return codes;
}

/**
 * Encrypt MFA secret using AES-256-GCM
 */
export function encryptMfaSecret(secretText, masterKey) {
  if (!secretText || !masterKey) {
    throw new Error('secretText and masterKey are required');
  }
  const key = crypto.createHash('sha256').update(masterKey).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(secretText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt MFA secret using AES-256-GCM
 */
export function decryptMfaSecret(encryptedPayload, masterKey) {
  if (!encryptedPayload || !masterKey) {
    throw new Error('encryptedPayload and masterKey are required');
  }

  const parts = String(encryptedPayload).split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted secret format');
  }

  const [ivHex, authTagHex, cipherHex] = parts;
  const key = crypto.createHash('sha256').update(masterKey).digest();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
