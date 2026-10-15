/**
 * Development Database Seed Script
 * 
 * Creates isolated development/testing accounts for local simulation.
 * STRICTLY FAILS if executed when NODE_ENV === 'production'.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DB_PATH = path.resolve(__dirname, '../data/db.json');

export const BANNED_PRODUCTION_PASSWORDS = [
  'chhotu.2427030521',
  'Admin@123',
  'admin123',
  'password123',
  'changeme',
  'secret'
];

export async function seedDevelopmentAccounts({
  nodeEnv = process.env.NODE_ENV || 'development',
  dbPath = DEFAULT_DB_PATH,
  dryRun = false
} = {}) {
  if (nodeEnv === 'production') {
    throw new Error('FATAL SECURITY ERROR: Seeding demo accounts is prohibited in production mode.');
  }

  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ users: [], students: [], faculty: [] }, null, 2), 'utf8');
  }

  const raw = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(raw);
  if (!db.users) db.users = [];
  if (!db.students) db.students = [];
  if (!db.faculty) db.faculty = [];

  const devSalt = await bcrypt.genSalt(10);
  const devPasswordHash = await bcrypt.hash('DevDemo@2026!', devSalt);

  const demoAccounts = [
    {
      id: 'usr_dev_student',
      name: 'Dev Student',
      email: 'student.dev@muj.manipal.edu',
      role: 'student',
      college_id: 'DEV2427001',
      collegeId: 'DEV2427001',
      password: devPasswordHash,
      isActive: true,
      isPasswordChanged: true
    },
    {
      id: 'usr_dev_faculty',
      name: 'Dev Faculty',
      email: 'faculty.dev@jaipur.manipal.edu',
      role: 'faculty',
      facultyId: 'FAC_DEV001',
      password: devPasswordHash,
      isActive: true,
      isPasswordChanged: true
    },
    {
      id: 'usr_dev_admin',
      name: 'Dev Administrator',
      email: 'admin.dev@jaipur.manipal.edu',
      role: 'admin',
      password: devPasswordHash,
      isActive: true,
      isPasswordChanged: true
    },
    {
      id: 'usr_dev_company',
      name: 'Dev Recruiter',
      email: 'recruiter.dev@partner.com',
      role: 'company',
      companyId: 'comp_dev_01',
      password: devPasswordHash,
      isActive: true,
      isPasswordChanged: true
    }
  ];

  let createdCount = 0;
  for (const acc of demoAccounts) {
    const existingIndex = db.users.findIndex(u => u.email === acc.email);
    if (existingIndex >= 0) {
      db.users[existingIndex] = { ...db.users[existingIndex], ...acc };
    } else {
      db.users.push(acc);
      createdCount++;
    }
  }

  if (!dryRun) {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  }

  return { success: true, createdCount, accounts: demoAccounts.map(a => ({ email: a.email, role: a.role })) };
}

// CLI entrypoint
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDevelopmentAccounts()
    .then((res) => {
      console.log(`[Seed] Success! Configured ${res.accounts.length} development accounts.`);
      console.log('Credentials password: DevDemo@2026!');
      process.exit(0);
    })
    .catch((err) => {
      console.error(`[Seed] Error: ${err.message}`);
      process.exit(1);
    });
}
