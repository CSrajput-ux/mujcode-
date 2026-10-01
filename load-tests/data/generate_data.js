import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSyntheticUsers } from '../lib/generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const users = generateSyntheticUsers(550);
const outPath = path.join(__dirname, 'synthetic_users.json');
fs.writeFileSync(outPath, JSON.stringify(users, null, 2), 'utf8');

console.log(`Generated ${users.length} synthetic users with HMAC-signed tokens in ${outPath}`);
