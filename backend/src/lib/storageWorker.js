import { parentPort } from 'node:worker_threads';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';

// Worker thread to offload heavy JSON.stringify operations from the main event loop
parentPort.on('message', async (message) => {
  if (message.type === 'FLUSH') {
    const { dbCache, dbFile, facultyFile, studentsFile } = message.payload;
    try {
      const dir = path.dirname(dbFile);
      // Ensure dir exists
      if (!fsSync.existsSync(dir)) {
        await fs.mkdir(dir, { recursive: true });
      }
      
      const tmpFile = path.join(dir, `db.tmp.${Date.now()}`);
      
      // Async stringification and write (the stringification happens in this worker thread)
      const data = JSON.stringify(dbCache, null, 2);
      await fs.writeFile(tmpFile, `${data}\n`, 'utf8');
      await fs.rename(tmpFile, dbFile);

      const targetFacultyFile = facultyFile || path.join(dir, 'faculty.json');
      const targetStudentsFile = studentsFile || path.join(dir, 'students.json');

      if (dbCache.faculty && Array.isArray(dbCache.faculty)) {
        const facTmp = path.join(dir, `faculty.tmp.${Date.now()}`);
        await fs.writeFile(facTmp, `${JSON.stringify(dbCache.faculty, null, 2)}\n`, 'utf8');
        await fs.rename(facTmp, targetFacultyFile);
      }

      if (dbCache.students && Array.isArray(dbCache.students)) {
        const stuTmp = path.join(dir, `students.tmp.${Date.now()}`);
        await fs.writeFile(stuTmp, `${JSON.stringify(dbCache.students, null, 2)}\n`, 'utf8');
        await fs.rename(stuTmp, targetStudentsFile);
      }
      
      parentPort.postMessage({ type: 'SUCCESS' });
    } catch (err) {
      parentPort.postMessage({ type: 'ERROR', error: err.message });
    }
  }
});
