import os from 'node:os';
import path from 'node:path';

export const config = {
  port: parseInt(process.env.PORT || '2359', 10),
  host: process.env.HOST || '0.0.0.0',
  authToken: process.env.AUTH_TOKEN || '',
  
  // Execution constraints
  defaultTimeLimitSec: 2.0,
  maxTimeLimitSec: 10.0,
  defaultMemoryLimitMb: 256,
  maxMemoryLimitMb: 512,
  
  maxCodeBytes: 64 * 1024,      // 64 KB
  maxStdinBytes: 512 * 1024,    // 512 KB
  maxOutputBytes: 256 * 1024,   // 256 KB
  
  // Concurrency & queue capacity
  workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || '4', 10),
  maxQueueCapacity: parseInt(process.env.MAX_QUEUE_CAPACITY || '100', 10),
  jobRetentionMs: 15 * 60 * 1000, // 15 minutes in-memory retention
  
  // Sandbox paths
  workBaseDir: process.env.SANDBOX_WORK_DIR || path.join(os.tmpdir(), 'mujbox'),
  
  // Compiler paths (can be overridden by environment variables)
  gccPath: process.env.GCC_PATH || 'gcc',
  gppPath: process.env.GPP_PATH || 'g++',
  javacPath: process.env.JAVAC_PATH || 'javac',
  javaPath: process.env.JAVA_PATH || 'java',
  pythonPath: process.env.PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3'),
  nodePath: process.env.NODE_PATH || process.execPath,
  goPath: process.env.GO_PATH || 'go',
  sqlitePath: process.env.SQLITE_PATH || 'sqlite3'
};
