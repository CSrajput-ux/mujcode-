import crypto from 'node:crypto';
import { getAdapterForLanguage } from '../adapters/index.js';
import { resolveLanguage } from '../registry/languages.js';
import { config } from '../config.js';

export class SubmissionQueue {
  constructor() {
    this.jobs = new Map(); // token -> JobRecord
    this.queue = [];       // array of tokens waiting
    this.activeCount = 0;
    this.metrics = {
      totalSubmitted: 0,
      totalCompleted: 0,
      totalFailed: 0,
      totalTimedOut: 0
    };

    // Garbage collector for finished jobs older than retention window
    const cleanupTimer = setInterval(() => this.cleanupExpiredJobs(), 60 * 1000);
    if (cleanupTimer.unref) cleanupTimer.unref();
  }

  enqueue({
    sourceCode,
    languageId,
    stdin = '',
    expectedOutput = null,
    cpuTimeLimit = null,
    memoryLimit = null,
    schemaSql = '',
    seedSql = '',
    rowLimit = 100
  }) {
    if (this.queue.length >= config.maxQueueCapacity) {
      const err = new Error('Execution queue capacity saturated. Please retry shortly.');
      err.statusCode = 429;
      throw err;
    }

    const lang = resolveLanguage(languageId);
    const token = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const job = {
      token,
      language: lang,
      sourceCode,
      stdin,
      expectedOutput,
      cpuTimeLimit,
      memoryLimit,
      schemaSql,
      seedSql,
      rowLimit,
      statusId: 1, // 1 = In Queue (Judge0 standard)
      status: 'QUEUED',
      statusDescription: 'In Queue',
      stdout: null,
      stderr: null,
      compileOutput: null,
      message: null,
      exitCode: null,
      time: null,
      memory: null,
      createdAt,
      finishedAt: null
    };

    this.jobs.set(token, job);
    this.queue.push(token);
    this.metrics.totalSubmitted++;

    this.processNext();
    return job;
  }

  async processNext() {
    if (this.activeCount >= config.workerConcurrency || this.queue.length === 0) {
      return;
    }

    const token = this.queue.shift();
    const job = this.jobs.get(token);
    if (!job) return this.processNext();

    this.activeCount++;
    job.statusId = 2; // 2 = Processing
    job.status = 'PROCESSING';
    job.statusDescription = 'Processing';

    try {
      const adapter = getAdapterForLanguage(job.language.key);
      const res = await adapter.execute({
        sourceCode: job.sourceCode,
        stdin: job.stdin,
        timeLimit: job.cpuTimeLimit,
        memoryLimit: job.memoryLimit,
        schemaSql: job.schemaSql,
        seedSql: job.seedSql,
        rowLimit: job.rowLimit
      });

      job.statusId = res.statusId;
      job.status = res.status;
      job.statusDescription = res.verdict;
      job.stdout = res.stdout;
      job.stderr = res.stderr;
      job.compileOutput = res.compileOutput;
      job.exitCode = res.exitCode;
      job.time = res.timeMs ? res.timeMs / 1000 : null; // in seconds
      job.memory = res.memoryKb || 0;
      job.finishedAt = new Date().toISOString();

      if (res.status === 'ACCEPTED') {
        this.metrics.totalCompleted++;
      } else if (res.status === 'TIME_LIMIT_EXCEEDED') {
        this.metrics.totalTimedOut++;
      } else {
        this.metrics.totalFailed++;
      }
    } catch (err) {
      job.statusId = 13; // Internal Error
      job.status = 'INTERNAL_ERROR';
      job.statusDescription = 'Internal Error';
      job.stderr = `Execution Engine Error: ${err.message}`;
      job.finishedAt = new Date().toISOString();
      this.metrics.totalFailed++;
    } finally {
      this.activeCount--;
      this.processNext();
    }
  }

  getJob(token) {
    return this.jobs.get(token) || null;
  }

  cleanupExpiredJobs() {
    const now = Date.now();
    for (const [token, job] of this.jobs.entries()) {
      if (job.finishedAt) {
        const finishedTime = new Date(job.finishedAt).getTime();
        if (now - finishedTime > config.jobRetentionMs) {
          this.jobs.delete(token);
        }
      }
    }
  }

  getMetrics() {
    return {
      activeWorkers: this.activeCount,
      queuedJobs: this.queue.length,
      storedJobs: this.jobs.size,
      concurrencyLimit: config.workerConcurrency,
      ...this.metrics
    };
  }
}

export const submissionQueue = new SubmissionQueue();
