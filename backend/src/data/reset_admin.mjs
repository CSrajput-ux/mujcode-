// Reset admin password to 'Admin@123' and test login flow
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dirname, 'db.json');

const db = JSON.parse(readFileSync(dbPath, 'utf8'));

// Test existing hash
const existing = db.users.find(u => u.role === 'admin');
console.log('Admin user:', existing?.email, existing?.isActive);

const passwords = ['Admin@123', 'admin123', 'password123', 'Admin123', 'changeme'];
for (const p of passwords) {
  try {
    const match = await bcrypt.compare(p, existing.password);
    console.log(p + ':', match);
  } catch(e) {
    console.log(p + ': ERROR -', e.message);
  }
}

// Reset to known password
const newHash = await bcrypt.hash('Admin@123', 10);
existing.password = newHash;
existing.isActive = true;
existing.isPasswordChanged = true;

writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('\n✅ Admin password reset to: Admin@123');
console.log('Email:', existing.email);
