import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'src/data/db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const fixes = {
  3015: 'Three lines: years count, weeks count, days count.',
  3056: 'A single float: the average of all entered integers (excluding 0), to 2 decimal places.',
  3078: 'Print values before and after the attempted swap to demonstrate pass-by-value.',
  3092: 'Two lines: total sum on first line, average (2 decimal places) on second line.',
  3093: 'Two lines: maximum element on first line, minimum element on second line.',
  3097: 'Two lines: even count on first line, odd count on second line.',
  3104: 'Two lines: even numbers space-separated, then odd numbers space-separated.',
  3127: 'Two lines: vowel count on first line, consonant count on second line.',
  3136: 'Two lines: variable address, then value accessed via pointer.',
  3139: 'Print all student records, one per line: id name marks.',
};

let count = 0;
for (const p of db.problems) {
  if (fixes[p.number] && !p.outputFormat) {
    p.outputFormat = fixes[p.number];
    count++;
  }
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('Fixed', count, 'outputFormat fields');
