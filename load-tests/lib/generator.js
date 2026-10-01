import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  process.loadEnvFile(path.resolve(__dirname, '../../backend/.env'));
} catch {
  try {
    process.loadEnvFile(path.resolve(__dirname, '../../.env'));
  } catch {}
}

const TOKEN_SECRET = process.env.TOKEN_SECRET || 'mujcode-loadtest-dummy-token-secret-for-benchmarks-only-00000000000000';
const SECRET_KEY = Buffer.from(TOKEN_SECRET, 'utf8');
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

function base64Url(input) {
  return Buffer.from(input).toString('base64url');
}

export function signToken(user) {
  const payload = {
    id: user.id || user._id,
    email: user.email,
    role: user.role,
    issuedAt: Date.now(),
    expiresAt: Date.now() + TOKEN_EXPIRY_MS
  };
  const encoded = base64Url(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(encoded)
    .digest('base64url');

  return `${encoded}.${signature}`;
}

const FIRST_NAMES = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Shaurya', 'Ananya', 'Diya', 'Aadhya', 'Saanvi', 'Myra', 'Ira', 'Prisha', 'Riya', 'Aarohi', 'Kavya', 'Rohan', 'Tanvi', 'Aryan', 'Neha'];
const LAST_NAMES = ['Sharma', 'Verma', 'Gupta', 'Mehta', 'Jain', 'Singh', 'Patel', 'Kumar', 'Rathore', 'Chauhan', 'Saxena', 'Bhatia', 'Joshi', 'Aggarwal', 'Mishra', 'Reddy', 'Nair', 'Deshmukh'];
const BRANCHES = ['CSE', 'CCE', 'IT', 'ECE', 'DS', 'AIML'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function generateSyntheticUsers(count = 550) {
  const users = [];

  // Distribution:
  // 60% Normal Student (330)
  // 15% Read-heavy Student (82)
  // 10% Write-heavy Student / Faculty (55)
  // 10% Search/Filter / Heavy Student (55)
  // 5% Admin / Company (28)

  const normalCount = Math.floor(count * 0.60);
  const readCount = Math.floor(count * 0.15);
  const writeCount = Math.floor(count * 0.10);
  const searchCount = Math.floor(count * 0.10);
  const adminCount = count - (normalCount + readCount + writeCount + searchCount);

  let idCounter = 1000;

  function makeUser(role, persona) {
    idCounter++;
    const fn = FIRST_NAMES[idCounter % FIRST_NAMES.length];
    const ln = LAST_NAMES[idCounter % LAST_NAMES.length];
    const collegeId = `22930${idCounter}`;
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}.${idCounter}@mujcode.synthetic`;
    const userObj = {
      id: `usr_syn_${idCounter}`,
      name: `${fn} ${ln}`,
      email,
      role,
      persona,
      college_id: collegeId,
      branch: BRANCHES[idCounter % BRANCHES.length],
      section: SECTIONS[idCounter % SECTIONS.length],
      year: '3',
      semester: 6,
      password: 'SyntheticPassword@123',
      isActive: true
    };
    userObj.token = signToken(userObj);
    return userObj;
  }

  for (let i = 0; i < normalCount; i++) users.push(makeUser('student', 'NORMAL'));
  for (let i = 0; i < readCount; i++) users.push(makeUser('student', 'READ_HEAVY'));
  for (let i = 0; i < writeCount; i++) users.push(makeUser('student', 'WRITE_HEAVY'));
  for (let i = 0; i < searchCount; i++) users.push(makeUser('student', 'SEARCH_HEAVY'));
  for (let i = 0; i < adminCount; i++) {
    const role = (i % 3 === 0) ? 'admin' : (i % 3 === 1 ? 'faculty' : 'company');
    users.push(makeUser(role, 'ADMIN_HEAVY'));
  }

  return users;
}

export const SAMPLE_SEARCH_TERMS = [
  'Binary Search', 'Dynamic Programming', 'Graph', 'Tree', 'Array', 
  'Sorting', 'Two Pointers', 'Recursion', 'Linked List', 'Stack', 
  'Queue', 'Greedy', 'Bit Manipulation', 'Trie', 'Matrix', 'Sliding Window',
  'Divide and Conquer', 'Kadane', 'Dijkstra', 'Floyd Warshall'
];

export const SAMPLE_CODE_SNIPPETS = {
  python: `def solve():
    import sys
    input = sys.stdin.read
    data = input().split()
    if not data:
        return
    print(sum(map(int, data)))
solve()`,
  cpp: `#include <iostream>
#include <vector>
using namespace std;
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    long long a, b;
    if (cin >> a >> b) {
        cout << (a + b) << "\\n";
    }
    return 0;
}`,
  javascript: `const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length >= 2) {
  console.log(Number(input[0]) + Number(input[1]));
}`
};
