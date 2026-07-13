import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export const config = {
  host: process.env.HOST || '0.0.0.0',
  port: Number(process.env.PORT || 5000),
  tokenSecret: process.env.TOKEN_SECRET || 'mujcode-local-development-secret',
  rootDir,
  dbFile: path.resolve(rootDir, process.env.DB_FILE || 'src/data/db.json'),
  uploadDir: path.resolve(rootDir, process.env.UPLOAD_DIR || 'uploads')
};
