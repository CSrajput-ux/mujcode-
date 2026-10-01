import { z } from 'zod';
import { logger } from '../lib/logger.js';

/**
 * Startup Environment Variable Validator
 *
 * Enforces security requirements before the server starts:
 * 1. Required secrets (TOKEN_SECRET) must be present and at least 32 bytes/characters.
 * 2. Database URIs and ports are validated.
 * 3. Insecure configurations (e.g. CORS '*' in production with credentials) are rejected.
 */

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),

  // TOKEN_SECRET: Must be at least 32 characters long to ensure HMAC-SHA256 security
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

  // Database URIs
  POSTGRES_URI: z.string().optional().default(''),
  REDIS_URI: z.string().optional().default(''),
  MONGODB_URI: z.string().optional().default(''),

  // Judge0 CE Configuration
  JUDGE0_URL: z.string().url().default('http://localhost:2358'),
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

export function validateEnvironment(rawEnv = process.env) {
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

    logger.error(errorMessage);
    console.error(errorMessage);

    if (rawEnv.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw new Error('Environment configuration validation failed');
  }

  const validated = result.data;

  // Additional security rule: In production, reject wildcard CORS with credentials
  if (validated.NODE_ENV === 'production' && validated.CORS_ORIGIN === '*') {
    const errorMsg = 'FATAL SECURITY ERROR: CORS_ORIGIN cannot be "*" in production when credentials are enabled.';
    logger.error(errorMsg);
    console.error(errorMsg);
    if (rawEnv.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw new Error(errorMsg);
  }

  return validated;
}
