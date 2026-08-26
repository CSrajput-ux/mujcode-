import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import bcrypt from 'bcrypt';

const dbPath = resolve('./src/data/db.json');
const db = JSON.parse(readFileSync(dbPath, 'utf8'));

const admin = db.users.find(u => u.role === 'admin');
console.log('Admin email:', admin?.email);

const testPwds = ['Admin@123', 'admin123', 'password123', 'Admin123', 'changeme', 'admin@123'];
for (const p of testPwds) {
  const match = await bcrypt.compare(p, admin.password);
  if (match) console.log('✅ Correct password:', p);
}

// Reset to Admin@123
admin.password = await bcrypt.hash('Admin@123', 10);
admin.isActive = true;
admin.isPasswordChanged = true;
writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('✅ Admin password reset to: Admin@123');
