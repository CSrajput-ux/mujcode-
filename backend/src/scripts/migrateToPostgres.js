#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Load environment variables
try {
  process.loadEnvFile(path.resolve(rootDir, '.env'));
} catch (e) {
  // Ignore if missing
}

const { Pool } = pg;
const postgresUri = process.env.POSTGRES_URI || 'postgres://postgres:postgres@localhost:5432/mujcode_db';
const dbFile = path.resolve(rootDir, process.env.DB_FILE || 'src/data/db.json');

console.log('=============================================================');
console.log('🐘 MujCode PostgreSQL Enterprise Relational & Collection Migration');
console.log('=============================================================');
console.log(`📡 Connecting to:  ${postgresUri.replace(/:[^:@]+@/, ':****@')}`);
console.log(`📂 Source File:    ${dbFile}`);
console.log('-------------------------------------------------------------');

if (!fs.existsSync(dbFile)) {
  console.error(`❌ Source database file not found at: ${dbFile}`);
  process.exit(1);
}

const raw = fs.readFileSync(dbFile, 'utf8');
let seedData;
try {
  seedData = JSON.parse(raw);
} catch (err) {
  console.error(`❌ Failed to parse JSON from ${dbFile}:`, err.message);
  process.exit(1);
}

const isSsl = postgresUri.includes('sslmode=require') || 
              postgresUri.includes('neon.tech') || 
              postgresUri.includes('supabase') || 
              postgresUri.includes('aws');

const pool = new Pool({
  connectionString: postgresUri,
  ssl: isSsl ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 45000,
});

async function connectWithRetry(retries = 3, delayMs = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      console.log(`📡 Connecting to PostgreSQL (Attempt ${i}/${retries})...`);
      const client = await pool.connect();
      return client;
    } catch (err) {
      console.warn(`⚠️ Attempt ${i} failed: ${err.message}`);
      if (i === retries) throw err;
      console.log(`⏳ Waiting ${delayMs / 1000}s for database wake-up...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

async function runMigration() {
  let client;
  try {
    client = await connectWithRetry();
    console.log('✅ Connected to PostgreSQL successfully.');

    // 1. Create Collection Table & Relational Tables
    console.log('🛠️  Ensuring relational schemas and tables exist...');
    
    // Core collection table
    await client.query(`
      CREATE TABLE IF NOT EXISTS mujcode_collections (
        collection_name VARCHAR(100) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_mujcode_collections_name ON mujcode_collections (collection_name);
    `);

    // Dedicated Relational Faculty Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS faculty (
        id VARCHAR(100) PRIMARY KEY,
        faculty_id VARCHAR(100),
        name VARCHAR(255),
        email VARCHAR(255),
        department VARCHAR(255),
        designation VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        raw_data JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_faculty_email ON faculty(email);
      CREATE INDEX IF NOT EXISTS idx_faculty_department ON faculty(department);
    `);

    // Dedicated Relational Problems / Coding Questions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS problems (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        difficulty VARCHAR(50),
        topic VARCHAR(255),
        category VARCHAR(100),
        points INT DEFAULT 10,
        number INT,
        description TEXT,
        constraints TEXT,
        input_format TEXT,
        output_format TEXT,
        sample_input TEXT,
        sample_output TEXT,
        explanation TEXT,
        test_cases JSONB,
        raw_data JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
      CREATE INDEX IF NOT EXISTS idx_problems_topic ON problems(topic);
      CREATE INDEX IF NOT EXISTS idx_problems_category ON problems(category);

      CREATE OR REPLACE VIEW coding_questions AS SELECT * FROM problems;
    `);

    // Dedicated Relational Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        role VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        raw_data JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `);

    // Dedicated Relational Students Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id VARCHAR(100) PRIMARY KEY,
        full_name VARCHAR(255),
        email VARCHAR(255),
        roll_number VARCHAR(100),
        college_id VARCHAR(100),
        branch VARCHAR(100),
        section VARCHAR(50),
        semester INT,
        year VARCHAR(50),
        raw_data JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_students_roll_number ON students(roll_number);
      CREATE INDEX IF NOT EXISTS idx_students_branch ON students(branch);
    `);

    console.log('✅ Relational schema verified: [faculty, problems, coding_questions, users, students, mujcode_collections].');

    // Batch Upsert Helper Function for high-performance remote Postgres insertion
    async function batchUpsert(tableName, columns, conflictCol, updateCols, rows, chunkSize = 50) {
      if (!rows || rows.length === 0) return;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const valueClauses = [];
        const flatParams = [];
        let pIdx = 1;

        for (const row of chunk) {
          const rowParams = [];
          for (const col of columns) {
            rowParams.push(`$${pIdx++}`);
            flatParams.push(row[col] !== undefined ? row[col] : null);
          }
          valueClauses.push(`(${rowParams.join(', ')}, NOW())`);
        }

        const setClauses = updateCols.map(c => `"${c}" = EXCLUDED."${c}"`).join(', ');
        const query = `
          INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}, "updated_at")
          VALUES ${valueClauses.join(', ')}
          ON CONFLICT ("${conflictCol}") DO UPDATE SET ${setClauses}, "updated_at" = NOW();
        `;
        await client.query(query, flatParams);
      }
    }

    console.log('🚀 Migrating complete data to PostgreSQL (Fast Batch Mode)...');

    // A) Migrate all 41 collections into mujcode_collections
    const collections = Object.keys(seedData);
    let totalItems = 0;
    await client.query('BEGIN');
    for (const name of collections) {
      const data = seedData[name];
      totalItems += Array.isArray(data) ? data.length : 1;

      await client.query(`
        INSERT INTO mujcode_collections (collection_name, data, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (collection_name)
        DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();
      `, [name, JSON.stringify(data)]);
    }
    await client.query('COMMIT');
    // Helper to deduplicate rows by ID so ON CONFLICT DO UPDATE doesn't error within the same batch
    function deduplicateById(rows) {
      const map = new Map();
      for (const row of rows) {
        if (row && row.id) {
          map.set(String(row.id), row);
        }
      }
      return Array.from(map.values());
    }

    // B) Migrate all Faculty members into relational `faculty` table
    const facultyList = seedData.faculty || [];
    const facultyRows = deduplicateById(facultyList.map(f => ({
      id: String(f.id || f._id || f.facultyId),
      faculty_id: f.facultyId || f.id || null,
      name: f.name || f.fullName || '',
      email: f.email || '',
      department: f.department || '',
      designation: f.designation || '',
      is_active: f.isActive !== false,
      raw_data: JSON.stringify(f)
    })));

    await client.query('BEGIN');
    await batchUpsert(
      'faculty',
      ['id', 'faculty_id', 'name', 'email', 'department', 'designation', 'is_active', 'raw_data'],
      'id',
      ['faculty_id', 'name', 'email', 'department', 'designation', 'is_active', 'raw_data'],
      facultyRows,
      50
    );
    await client.query('COMMIT');
    console.log(`   👨‍🏫 Migrated and committed ${facultyRows.length} faculty members into relational 'faculty' table.`);

    // C) Migrate all Coding Questions / Problems into relational `problems` table
    const problemsList = seedData.problems || [];
    const problemsRows = deduplicateById(problemsList.map(p => ({
      id: String(p.id || p._id || p.number),
      title: p.title || '',
      difficulty: p.difficulty || 'Medium',
      topic: p.topic || '',
      category: p.category || 'DSA',
      points: p.points || 10,
      number: p.number || null,
      description: p.description || '',
      constraints: Array.isArray(p.constraints) ? p.constraints.join('\n') : (p.constraints || ''),
      input_format: p.inputFormat || '',
      output_format: p.outputFormat || '',
      sample_input: p.sampleInput || '',
      sample_output: p.sampleOutput || '',
      explanation: p.explanation || '',
      test_cases: JSON.stringify(p.testCases || []),
      raw_data: JSON.stringify(p)
    })));

    await client.query('BEGIN');
    await batchUpsert(
      'problems',
      [
        'id', 'title', 'difficulty', 'topic', 'category', 'points', 'number',
        'description', 'constraints', 'input_format', 'output_format',
        'sample_input', 'sample_output', 'explanation', 'test_cases', 'raw_data'
      ],
      'id',
      [
        'title', 'difficulty', 'topic', 'category', 'points', 'number',
        'description', 'constraints', 'input_format', 'output_format',
        'sample_input', 'sample_output', 'explanation', 'test_cases', 'raw_data'
      ],
      problemsRows,
      50
    );
    await client.query('COMMIT');
    console.log(`   🧩 Migrated and committed ${problemsRows.length} coding questions into relational 'problems' table & 'coding_questions' view.`);

    // D) Migrate all Users into relational `users` table
    const usersList = seedData.users || [];
    const usersRows = deduplicateById(usersList.map(u => ({
      id: String(u.id || u._id),
      name: u.name || '',
      email: u.email || '',
      role: u.role || 'student',
      is_active: u.isActive !== false,
      raw_data: JSON.stringify(u)
    })));

    await client.query('BEGIN');
    await batchUpsert(
      'users',
      ['id', 'name', 'email', 'role', 'is_active', 'raw_data'],
      'id',
      ['name', 'email', 'role', 'is_active', 'raw_data'],
      usersRows,
      50
    );
    await client.query('COMMIT');
    console.log(`   👥 Migrated and committed ${usersRows.length} users into relational 'users' table.`);

    // E) Migrate all Students into relational `students` table
    const studentsList = seedData.students || [];
    const studentsRows = deduplicateById(studentsList.map(s => ({
      id: String(s.id || s._id),
      full_name: s.fullName || s.User?.name || '',
      email: s.User?.email || '',
      roll_number: s.rollNumber || '',
      college_id: s.college_id || '',
      branch: s.branch || '',
      section: s.section || '',
      semester: s.semester || null,
      year: s.year || '',
      raw_data: JSON.stringify(s)
    })));

    await client.query('BEGIN');
    await batchUpsert(
      'students',
      ['id', 'full_name', 'email', 'roll_number', 'college_id', 'branch', 'section', 'semester', 'year', 'raw_data'],
      'id',
      ['full_name', 'email', 'roll_number', 'college_id', 'branch', 'section', 'semester', 'year', 'raw_data'],
      studentsRows,
      50
    );
    await client.query('COMMIT');
    console.log(`   🎓 Migrated and committed ${studentsRows.length} students into relational 'students' table.`);

    console.log('-------------------------------------------------------------');
    console.log(`🎉 Complete Relational + Collection Migration Successful!`);
    console.log(`📊 Faculty Table:          ${facultyRows.length} rows`);
    console.log(`📊 Problems / Questions:   ${problemsRows.length} rows`);
    console.log(`📊 Users Table:            ${usersRows.length} rows`);
    console.log(`📊 Students Table:         ${studentsRows.length} rows`);
    console.log(`📊 Collections Table:      ${collections.length} collections (${totalItems} total records)`);
    console.log('=============================================================');
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

runMigration();
