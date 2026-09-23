import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env file
try {
  process.loadEnvFile(path.resolve(rootDir, '.env'));
} catch (e) {
  // Ignore if .env file is missing
}

export const config = {
  host: process.env.HOST || '0.0.0.0',
  port: Number(process.env.PORT || 5000),
  tokenSecret: process.env.TOKEN_SECRET || 'mujcode-local-development-secret',
  rootDir,
  dbFile: path.resolve(rootDir, process.env.DB_FILE || 'src/data/db.json'),
  facultyFile: path.resolve(rootDir, process.env.FACULTY_FILE || 'src/data/faculty.json'),
  studentsFile: path.resolve(rootDir, process.env.STUDENTS_FILE || 'src/data/students.json'),
  uploadDir: path.resolve(rootDir, process.env.UPLOAD_DIR || 'uploads'),
  // PostgreSQL Database Configuration (Enabled when POSTGRES_URI is provided)
  postgresUri: process.env.POSTGRES_URI || '',
  // Judge0 CE Configuration
  judge0Url: process.env.JUDGE0_URL || 'http://localhost:2358',
  judge0AuthToken: process.env.JUDGE0_AUTH_TOKEN || '',
  judge0CpuTimeLimit: Number(process.env.JUDGE0_CPU_TIME_LIMIT || 2),
  judge0MemoryLimit: Number(process.env.JUDGE0_MEMORY_LIMIT || 128000),
  judge0WallTimeLimit: Number(process.env.JUDGE0_WALL_TIME_LIMIT || 5)
};
