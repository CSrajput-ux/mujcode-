import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const distRenderer = path.join(root, 'dist', 'renderer');
fs.mkdirSync(distRenderer, { recursive: true });

fs.copyFileSync(
  path.join(root, 'src', 'renderer', 'index.html'),
  path.join(distRenderer, 'index.html')
);
fs.copyFileSync(
  path.join(root, 'src', 'renderer', 'styles.css'),
  path.join(distRenderer, 'styles.css')
);

const distPreload = path.join(root, 'dist', 'preload');
fs.mkdirSync(distPreload, { recursive: true });

fs.copyFileSync(
  path.join(root, 'src', 'preload', 'index.cjs'),
  path.join(distPreload, 'index.cjs')
);

console.log('[Build] Static assets (index.html, styles.css, index.cjs) copied to dist/');
