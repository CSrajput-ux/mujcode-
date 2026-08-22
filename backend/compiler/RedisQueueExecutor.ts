import { redis } from '../src/config/redis.js';
import { randomUUID } from 'crypto';

/**
 * Enterprise Redis Queue Executor
 * Instead of running Docker locally and blocking the Node.js API container,
 * this pushes the compilation job to a Redis Stream ( mujcode:compiler:jobs ).
 * Dedicated Worker Nodes will pull from this stream, execute the code in Docker,
 * and push the result back to another stream or pub/sub channel.
 */
export class RedisQueueExecutor {
  language: string;
  code: string;
  testCases: any[];
  timeLimit: number;
  memoryLimit: number;
  languageConfig: any;

  constructor(language: string, code: string, testCases: any[], timeLimit = 2000, memoryLimit = 256, languageConfig: any) {
    this.language = language;
    this.code = code;
    this.testCases = testCases;
    this.timeLimit = timeLimit;
    this.memoryLimit = memoryLimit;
    this.languageConfig = languageConfig;
  }

  async executeAll() {
    const jobId = randomUUID();
    const payload = JSON.stringify({
      jobId,
      language: this.language,
      code: this.code,
      testCases: this.testCases,
      timeLimit: this.timeLimit,
      memoryLimit: this.memoryLimit,
      config: this.languageConfig
    });

    console.log(`[RedisQueueExecutor] Queueing job ${jobId} to Redis Stream 'mujcode:compiler:jobs'`);

    // XADD stream * field value
    await redis.xadd('mujcode:compiler:jobs', '*', 'payload', payload);

    // In a real enterprise system, we would either:
    // 1. Subscribe to a Redis Pub/Sub channel for the result.
    // 2. Poll a "results" hash.
    // 3. Return an immediate 202 Accepted and let the frontend poll via WebSocket.
    
    // For this migration phase PoC, we will wait for a result key to be populated by the worker.
    // Simulating a timeout wait for the worker to process it.
    
    return new Promise(async (resolve, reject) => {
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        const result = await redis.get(`mujcode:compiler:result:${jobId}`);
        if (result) {
          clearInterval(interval);
          resolve(JSON.parse(result));
        }
        
        if (attempts > 30) { // 15 seconds timeout
          clearInterval(interval);
          resolve(this.testCases.map((_, i) => ({
            testCaseIndex: i,
            status: 'Internal Error',
            output: 'Job timed out waiting for Compiler Worker Node.',
            error: true,
            executionTime: 0,
            memory: 0
          })));
        }
      }, 500);
    });
  }
}
