import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateEnvironment } from './config/envValidator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from backend/.env or workspace root .env
try {
  process.loadEnvFile(path.resolve(rootDir, '.env'));
} catch (e) {
  // If backend/.env doesn't exist, try root .env
  try {
    process.loadEnvFile(path.resolve(rootDir, '..', '.env'));
  } catch (e2) {
    // Handled by validateEnvironment below
  }
}

// Validate environment variables strictly with Zod schema
const validatedEnv = validateEnvironment(process.env);

export const config = {
  host: validatedEnv.HOST,
  port: validatedEnv.PORT,
  nodeEnv: validatedEnv.NODE_ENV,
  tokenSecret: validatedEnv.TOKEN_SECRET,
  corsOrigin: validatedEnv.CORS_ORIGIN,
  rootDir,
  dbFile: path.resolve(rootDir, validatedEnv.DB_FILE),
  facultyFile: path.resolve(rootDir, validatedEnv.FACULTY_FILE),
  studentsFile: path.resolve(rootDir, validatedEnv.STUDENTS_FILE),
  uploadDir: path.resolve(rootDir, validatedEnv.UPLOAD_DIR),
  // PostgreSQL Database Configuration (Enabled when POSTGRES_URI is provided)
  postgresUri: validatedEnv.POSTGRES_URI,
  // Judge0 CE Configuration
  judge0Url: validatedEnv.JUDGE0_URL,
  judge0AuthToken: validatedEnv.JUDGE0_AUTH_TOKEN,
  judge0CpuTimeLimit: validatedEnv.JUDGE0_CPU_TIME_LIMIT,
  judge0MemoryLimit: validatedEnv.JUDGE0_MEMORY_LIMIT,
  judge0WallTimeLimit: validatedEnv.JUDGE0_WALL_TIME_LIMIT,
  // Cloudinary Storage Configuration (for PPT, PDF, Images, Documents)
  cloudinaryUrl: validatedEnv.CLOUDINARY_URL,
  cloudinaryCloudName: validatedEnv.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: validatedEnv.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: validatedEnv.CLOUDINARY_API_SECRET
};

