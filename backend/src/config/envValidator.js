import { z } from 'zod';
import { logger } from '../lib/logger.js';

/**
 * Startup Environment Variable Validator
 *
 * Enforces production security requirements before the server starts:
 * 1. Required secrets (TOKEN_SECRET) must be present, at least 32 bytes/characters, and not a known placeholder.
 * 2. In production, wildcard CORS ('*') is strictly forbidden.
 * 3. In production, localhost database connections are rejected unless explicitly overridden.
 * 4. Never exposes or logs secret contents in error logs.
 */

const BANNED_TOKEN_SUBSTRINGS = [
  'change-me',
  'generate-a-strong',
  'development-secret',
  'default-secret',
  'changeme',
  'chhotu.2427030521'
];

const BANNED_EXACT_SECRETS = new Set([
  'secret',
  'password',
  'postgres',
  'admin@123',
  'admin123',
  'password123'
]);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),

  // TOKEN_SECRET: Must be at least 32 characters long
  TOKEN_SECRET: z.string().min(32, {
    message: 'TOKEN_SECRET must be at least 32 characters (256 bits) long for secure HMAC signing'
  }),

  // Allowed CORS origins: Comma-separated list or single origin (no wildcard in production)
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Storage files
  DB_FILE: z.string().default('src/data/db.json'),
  FACULTY_FILE: z.string().default('src/data/faculty.json'),
  STUDENTS_FILE: z.string().default('src/data/students.json'),
  UPLOAD_DIR: z.string().default('uploads'),

  // Database URIs and Connection Limits
  POSTGRES_URI: z.string().optional().default(''),
  POSTGRES_POOL_MAX: z.coerce.number().int().min(1).max(100).default(5),
  POSTGRES_POOL_MIN: z.coerce.number().int().min(0).max(20).default(1),
  POSTGRES_IDLE_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(30000),
  POSTGRES_CONNECTION_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(10000),
  POSTGRES_STATEMENT_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(10000),
  SAVE_DEBOUNCE_MS: z.coerce.number().int().min(10).max(10000).default(100),
  REDIS_URI: z.string().optional().default(''),
  MONGODB_URI: z.string().optional().default(''),

  // Judge0 CE Configuration (optional — leave empty to disable code execution)
  JUDGE0_URL: z.string().optional().default(''),
  JUDGE0_AUTH_TOKEN: z.string().optional().default(''),
  JUDGE0_CPU_TIME_LIMIT: z.coerce.number().min(1).max(15).default(2),
  JUDGE0_MEMORY_LIMIT: z.coerce.number().min(16000).max(512000).default(128000),
  JUDGE0_WALL_TIME_LIMIT: z.coerce.number().min(1).max(30).default(5),

  // Cloudinary
  CLOUDINARY_URL: z.string().optional().default(''),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default('')
});

export function validateEnvironment(rawEnv = process.env, { allowThrow = false } = {}) {
  const isTestMode = process.env.NODE_ENV === 'test' || rawEnv.NODE_ENV === 'test' || allowThrow;
  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const errorDetails = result.error.issues.map(
      issue => `  • [${issue.path.join('.')}] ${issue.message}`
    ).join('\n');

    const errorMessage = `\n══════════════════════════════════════════════════════════════════════\n` +
      `❌ FATAL: ENVIRONMENT CONFIGURATION VALIDATION FAILED\n` +
      `══════════════════════════════════════════════════════════════════════\n` +
      `${errorDetails}\n\n` +
      `Please check your .env file or deployment environment variables.\n` +
      `To generate a secure TOKEN_SECRET, run:\n` +
      `  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"\n` +
      `══════════════════════════════════════════════════════════════════════\n`;

    process.stderr.write(errorMessage);
    logger.error(errorMessage);

    if (!isTestMode) {
      process.exit(1);
    }
    throw new Error('Environment configuration validation failed');
  }

  const validated = result.data;

  // 1. Check for banned placeholder TOKEN_SECRET values
  const tokenSecretLower = validated.TOKEN_SECRET.trim().toLowerCase();
  if (BANNED_EXACT_SECRETS.has(tokenSecretLower)) {
    const errorMsg = `FATAL SECURITY ERROR: TOKEN_SECRET contains insecure placeholder value ("${tokenSecretLower}"). Generate a random 256-bit secret.\n`;
    process.stderr.write(errorMsg);
    logger.error(errorMsg);
    if (!isTestMode) {
      process.exit(1);
    }
    throw new Error(errorMsg);
  }

  for (const pattern of BANNED_TOKEN_SUBSTRINGS) {
    if (tokenSecretLower.includes(pattern)) {
      const errorMsg = `FATAL SECURITY ERROR: TOKEN_SECRET contains insecure placeholder value ("${pattern}"). Generate a random 256-bit secret.\n`;
      process.stderr.write(errorMsg);
      logger.error(errorMsg);
      if (!isTestMode) {
        process.exit(1);
      }
      throw new Error(errorMsg);
    }
  }

  // 2. In production, reject wildcard CORS
  const origins = validated.CORS_ORIGIN.split(',').map(s => s.trim());
  if (validated.NODE_ENV === 'production' && (origins.includes('*') || validated.CORS_ORIGIN === '*')) {
    const errorMsg = 'FATAL SECURITY ERROR: CORS_ORIGIN cannot be "*" in production when credentials are enabled.\n';
    process.stderr.write(errorMsg);
    logger.error(errorMsg);
    if (!isTestMode) {
      process.exit(1);
    }
    throw new Error(errorMsg);
  }

  // 3. In production, reject localhost database URIs unless explicitly permitted for test harnesses
  if (validated.NODE_ENV === 'production' && !rawEnv.ALLOW_LOCAL_DB_IN_PROD) {
    if (validated.POSTGRES_URI && (validated.POSTGRES_URI.includes('localhost') || validated.POSTGRES_URI.includes('127.0.0.1'))) {
      const errorMsg = 'FATAL SECURITY ERROR: POSTGRES_URI cannot point to localhost or 127.0.0.1 in production.\n';
      process.stderr.write(errorMsg);
      logger.error(errorMsg);
      if (!isTestMode) {
        process.exit(1);
      }
      throw new Error(errorMsg);
    }

    if (validated.MONGODB_URI && (validated.MONGODB_URI.includes('localhost') || validated.MONGODB_URI.includes('127.0.0.1'))) {
      const errorMsg = 'FATAL SECURITY ERROR: MONGODB_URI cannot point to localhost or 127.0.0.1 in production.\n';
      process.stderr.write(errorMsg);
      logger.error(errorMsg);
      if (!isTestMode) {
        process.exit(1);
      }
      throw new Error(errorMsg);
    }
  }

  // 4. Feature configuration consistency (e.g. Cloudinary)
  if (validated.CLOUDINARY_CLOUD_NAME && (!validated.CLOUDINARY_API_KEY || !validated.CLOUDINARY_API_SECRET)) {
    const errorMsg = 'CONFIGURATION ERROR: CLOUDINARY_CLOUD_NAME is specified but CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET is missing.\n';
    process.stderr.write(errorMsg);
    logger.error(errorMsg);
    if (!isTestMode) {
      process.exit(1);
    }
    throw new Error(errorMsg);
  }

  return validated;
}
