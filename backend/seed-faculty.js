/**
 * Faculty Seeder Script
 * Reads faculty_data.json and seeds all faculty into db.json
 * - Username : email (lowercase)
 * - Password : faculty@123
 * - Skips faculty with no email
 * - Skips faculty whose email already exists in db
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DB_PATH      = resolve(__dirname, 'src/data/db.json');
const FACULTY_PATH = resolve(__dirname, '../faculty_data.json');

// ── Load files ────────────────────────────────────────────────────────────────
const db          = JSON.parse(readFileSync(DB_PATH, 'utf8'));
const facultyData = JSON.parse(readFileSync(FACULTY_PATH, 'utf8'));

// ── Build a set of existing emails (lowercase) ────────────────────────────────
const existingEmails = new Set(
  db.users.map(u => u.email.toLowerCase())
);

// ── Find highest existing numeric faculty ID ──────────────────────────────────
let maxFacNum = 0;
for (const u of db.users) {
  if (u.id && u.id.startsWith('fac_')) {
    const n = parseInt(u.id.replace('fac_', ''), 10);
    if (!isNaN(n) && n > maxFacNum) maxFacNum = n;
  }
}

// ── Process faculty ───────────────────────────────────────────────────────────
let added   = 0;
let skipped = 0;

for (const f of facultyData) {
  // Clean name (remove stray \t)
  const name  = (f.name  || '').replace(/\\t/g, '').replace(/\t/g, '').trim();
  let email = (f.email || '').trim().toLowerCase();

  // Generate email if missing
  if (!email && name) {
    const cleanName = name.replace(/^(Dr\.|Dr|Mr\.|Mr|Ms\.|Ms|Prof\.|Prof|Ar\.|Ar)\s+/gi, '').trim();
    const parts = cleanName.split(/\s+/);
    const firstName = parts[0].toLowerCase().replace(/[^a-z]/g, '');
    const lastName = parts.length > 1 ? parts[parts.length - 1].toLowerCase().replace(/[^a-z]/g, '') : '';
    
    email = lastName ? `${firstName}.${lastName}@jaipur.manipal.edu` : `${firstName}@jaipur.manipal.edu`;

    // Handle duplicates for generated emails by appending a number if needed
    let baseEmail = email.split('@')[0];
    let counter = 1;
    while (existingEmails.has(email)) {
      email = `${baseEmail}${counter}@jaipur.manipal.edu`;
      counter++;
    }
  }

  // Skip if still no email
  if (!email) {
    skipped++;
    continue;
  }

  // Skip duplicates
  if (existingEmails.has(email)) {
    skipped++;
    continue;
  }

  maxFacNum++;
  const id = `fac_${maxFacNum}`;

  // ── users entry (for login) ───────────────────────────────────────────────
  db.users.push({
    id,
    name,
    email,
    password:          'faculty@123',
    role:              'faculty',
    isPasswordChanged: false,
    isActive:          true,
    facultyId:         `FAC${String(maxFacNum).padStart(3, '0')}`,
    department:        (f.department   || '').trim(),
    designation:       (f.designation || '').trim()
  });

  // ── faculty entry (profile) ───────────────────────────────────────────────
  db.faculty.push({
    _id:              id,
    id,
    name,
    email,
    facultyId:        `FAC${String(maxFacNum).padStart(3, '0')}`,
    department:       (f.department   || '').trim(),
    designation:      (f.designation || '').trim(),
    photoUrl:         (f.photo_url    || '').trim(),
    phone:            (f.phone        || '').trim(),
    linkedin:         (f.linkedin     || '').trim(),
    teachingCourses:      [],
    teachingAssignments:  []
  });

  existingEmails.add(email);
  added++;
}

// ── Write back ────────────────────────────────────────────────────────────────
writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');

console.log(`\n✅ Faculty seeding complete!`);
console.log(`   Added   : ${added}`);
console.log(`   Skipped : ${skipped} (no email or duplicate)`);
console.log(`   DB path : ${DB_PATH}\n`);
