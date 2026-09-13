import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';

/**
 * FastStore
 * High-performance, low-latency access layer for Faculty and Student records.
 * Provides direct dedicated JSON file persistence and O(1) in-memory hash maps.
 */

// In-memory O(1) indices
const facultyById = new Map();
const facultyByEmail = new Map();
const facultyByFacultyId = new Map();

const studentById = new Map();
const studentByCollegeId = new Map();
const studentByRollNumber = new Map();
const studentByEmail = new Map();

let cachedFaculty = null;
let cachedStudents = null;

/**
 * Direct file readers: Bypasses monolithic db.json for lightning-fast reads.
 */
export function readFacultyFile() {
  try {
    if (!fs.existsSync(config.facultyFile)) {
      return null;
    }
    const raw = fs.readFileSync(config.facultyFile, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[FastStore] Error reading faculty.json:', err.message);
    return null;
  }
}

export function writeFacultyFileSync(facultyList) {
  try {
    const dir = path.dirname(config.facultyFile);
    fs.mkdirSync(dir, { recursive: true });
    const tmpFile = path.join(dir, `faculty.tmp.${Date.now()}`);
    fs.writeFileSync(tmpFile, `${JSON.stringify(facultyList, null, 2)}\n`, 'utf8');
    fs.renameSync(tmpFile, config.facultyFile);
  } catch (err) {
    console.error('[FastStore] Error writing faculty.json:', err.message);
  }
}

export function readStudentsFile() {
  try {
    if (!fs.existsSync(config.studentsFile)) {
      return null;
    }
    const raw = fs.readFileSync(config.studentsFile, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[FastStore] Error reading students.json:', err.message);
    return null;
  }
}

export function writeStudentsFileSync(studentsList) {
  try {
    const dir = path.dirname(config.studentsFile);
    fs.mkdirSync(dir, { recursive: true });
    const tmpFile = path.join(dir, `students.tmp.${Date.now()}`);
    fs.writeFileSync(tmpFile, `${JSON.stringify(studentsList, null, 2)}\n`, 'utf8');
    fs.renameSync(tmpFile, config.studentsFile);
  } catch (err) {
    console.error('[FastStore] Error writing students.json:', err.message);
  }
}

/**
 * Rebuild O(1) in-memory indices for ultra-fast queries
 */
export function rebuildFastIndices(facultyList = [], studentsList = []) {
  cachedFaculty = facultyList;
  cachedStudents = studentsList;

  // Clear existing indices
  facultyById.clear();
  facultyByEmail.clear();
  facultyByFacultyId.clear();

  studentById.clear();
  studentByCollegeId.clear();
  studentByRollNumber.clear();
  studentByEmail.clear();

  // Index faculty
  for (const f of facultyList) {
    if (f.id) facultyById.set(String(f.id), f);
    if (f._id) facultyById.set(String(f._id), f);
    if (f.email) facultyByEmail.set(String(f.email).toLowerCase(), f);
    if (f.facultyId) facultyByFacultyId.set(String(f.facultyId).toLowerCase(), f);
  }

  // Index students
  for (const s of studentsList) {
    if (s.id) studentById.set(String(s.id), s);
    if (s._id) studentById.set(String(s._id), s);
    if (s.college_id) studentByCollegeId.set(String(s.college_id), s);
    if (s.rollNumber) studentByRollNumber.set(String(s.rollNumber), s);
    const email = s.User?.email || s.email;
    if (email) studentByEmail.set(String(email).toLowerCase(), s);
  }
}

// --- Fast Access Query Functions (O(1) lookups) ---

export function getAllFacultyFast() {
  return cachedFaculty || [];
}

export function findFacultyById(id) {
  if (!id) return null;
  return facultyById.get(String(id)) || null;
}

export function findFacultyByEmail(email) {
  if (!email) return null;
  return facultyByEmail.get(String(email).toLowerCase()) || null;
}

export function findFacultyByFacultyId(facultyId) {
  if (!facultyId) return null;
  return facultyByFacultyId.get(String(facultyId).toLowerCase()) || null;
}

export function getAllStudentsFast() {
  return cachedStudents || [];
}

export function findStudentById(id) {
  if (!id) return null;
  return studentById.get(String(id)) || null;
}

export function findStudentByCollegeId(collegeId) {
  if (!collegeId) return null;
  return studentByCollegeId.get(String(collegeId)) || null;
}

export function findStudentByRollNumber(rollNumber) {
  if (!rollNumber) return null;
  return studentByRollNumber.get(String(rollNumber)) || null;
}

export function findStudentByEmail(email) {
  if (!email) return null;
  return studentByEmail.get(String(email).toLowerCase()) || null;
}
