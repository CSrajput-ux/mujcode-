/**
 * ExecutionQueue — Production-grade job queue for code compilation
 *
 * Handles 10,000+ concurrent users by:
 *  1. CONCURRENCY LIMITER   — max N Docker containers running at once (prevents OOM)
 *  2. PER-USER RATE LIMITER — prevents single user from hogging all slots
 *  3. ASYNC JOB TRACKING   — immediate job ID response; client polls for result
 *  4. CIRCUIT BREAKER      — stops accepting work if Docker is unhealthy
 *  5. QUEUE DRAIN TIMEOUT  — jobs that wait too long are rejected (no infinite queues)
 *  6. MEMORY GUARD         — rejects new jobs if queue is too large (backpressure)
 */

import { EventEmitter } from 'events';

// ─── Configuration ────────────────────────────────────────────────────────────
export const QUEUE_CONFIG = {
  /** Max Docker containers running simultaneously. Rule of thumb: (CPU_CORES * 2) - 2 */
  MAX_CONCURRENT: Number(process.env.MAX_CONCURRENT_EXECUTIONS ?? 20),

  /** Max jobs waiting in queue. Prevents unbounded memory growth. */
  MAX_QUEUE_SIZE: Number(process.env.MAX_QUEUE_SIZE ?? 500),

  /** A single job sitting in queue longer than this gets rejected (30s). */
  MAX_QUEUE_WAIT_MS: Number(process.env.MAX_QUEUE_WAIT_MS ?? 30_000),

  /** Per-user: max N jobs in-flight or queued at once. */
  MAX_JOBS_PER_USER: Number(process.env.MAX_JOBS_PER_USER ?? 3),

  /** Circuit breaker: open after this many consecutive failures. */
  CIRCUIT_BREAKER_THRESHOLD: Number(process.env.CIRCUIT_BREAKER_THRESHOLD ?? 10),

  /** Circuit breaker: wait this long before trying again (half-open). */
  CIRCUIT_BREAKER_RESET_MS: Number(process.env.CIRCUIT_BREAKER_RESET_MS ?? 15_000),

  /** Completed job results are kept for this long then GC'd. */
  JOB_TTL_MS: Number(process.env.JOB_TTL_MS ?? 5 * 60_000),    // 5 minutes
};

// ─── Types ────────────────────────────────────────────────────────────────────
export type JobStatus = 'queued' | 'running' | 'done' | 'error' | 'rejected' | 'timeout';

export interface QueuedJob {
  jobId: string;
  userId: string;
  status: JobStatus;
  queuedAt: number;
  startedAt?: number;
  finishedAt?: number;
  /** Resolved when execution completes */
  result?: any;
  error?: string;
  /** Internal: resolves/rejects the deferred promise in the queue */
  _resolve?: (value: any) => void;
  _reject?: (reason: any) => void;
}

// ─── Circuit Breaker ──────────────────────────────────────────────────────────
type BreakerState = 'closed' | 'open' | 'half-open';

class CircuitBreaker {
  private state: BreakerState = 'closed';
  private failures = 0;
  private lastOpenedAt = 0;

  constructor(
    private threshold: number,
    private resetMs: number
  ) {}

  isOpen(): boolean {
    if (this.state === 'open') {
      if (Date.now() - this.lastOpenedAt > this.resetMs) {
        this.state = 'half-open';
        return false;   // allow one probe request through
      }
      return true;
    }
    return false;
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  recordFailure(): void {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'open';
      this.lastOpenedAt = Date.now();
      console.error(`[CircuitBreaker] OPEN — ${this.failures} consecutive failures. Will retry after ${this.resetMs}ms.`);
    }
  }

  getState(): BreakerState { return this.state; }
}

// ─── ExecutionQueue ───────────────────────────────────────────────────────────
class ExecutionQueueManager extends EventEmitter {
  private jobs = new Map<string, QueuedJob>();
  private waitQueue: QueuedJob[] = [];
  private running = 0;
  private userJobCount = new Map<string, number>();
  private breaker: CircuitBreaker;
  private gcTimer: ReturnType<typeof setInterval>;

  constructor() {
    super();
    this.setMaxListeners(0);   // avoid EventEmitter warnings under high load
    this.breaker = new CircuitBreaker(
      QUEUE_CONFIG.CIRCUIT_BREAKER_THRESHOLD,
      QUEUE_CONFIG.CIRCUIT_BREAKER_RESET_MS
    );

    // Garbage-collect old finished jobs every minute
    this.gcTimer = setInterval(() => this._gc(), 60_000);
    // Unref so Node can exit cleanly in tests
    if (this.gcTimer.unref) this.gcTimer.unref();
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Enqueue a job. Returns the jobId immediately.
   * The actual execution happens asynchronously.
   */
  enqueue(userId: string, task: () => Promise<any>): string {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // ① Circuit breaker check
    if (this.breaker.isOpen()) {
      this._storeRejected(jobId, userId, 'Service temporarily unavailable. Our execution engine is recovering. Please try again in a few seconds.');
      return jobId;
    }

    // ② Memory / queue size guard
    if (this.waitQueue.length >= QUEUE_CONFIG.MAX_QUEUE_SIZE) {
      this._storeRejected(jobId, userId, `Server is at capacity (${QUEUE_CONFIG.MAX_QUEUE_SIZE} jobs queued). Please try again in a moment.`);
      return jobId;
    }

    // ③ Per-user rate limit
    const userCount = this.userJobCount.get(userId) ?? 0;
    if (userCount >= QUEUE_CONFIG.MAX_JOBS_PER_USER) {
      this._storeRejected(jobId, userId, `You already have ${userCount} submissions running. Please wait for them to finish before submitting again.`);
      return jobId;
    }

    // ④ Create the job record
    const job: QueuedJob = {
      jobId,
      userId,
      status: 'queued',
      queuedAt: Date.now(),
    };

    this.jobs.set(jobId, job);
    this._incrementUser(userId);

    // ⑤ Wrap the task in a deferred so we can resolve it from the runner
    const promise = new Promise<any>((resolve, reject) => {
      job._resolve = resolve;
      job._reject = reject;
    });

    // Attach task + deferred to the job object for the runner to call
    (job as any)._task = task;
    (job as any)._promise = promise;

    this.waitQueue.push(job);
    this._maybeRunNext();

    return jobId;
  }

  /** Poll for job status + result */
  getJob(jobId: string): QueuedJob | undefined {
    return this.jobs.get(jobId);
  }

  /** Metrics snapshot for /api/judge/health */
  getMetrics() {
    return {
      running: this.running,
      queued: this.waitQueue.length,
      totalTracked: this.jobs.size,
      circuitBreaker: this.breaker.getState(),
      config: QUEUE_CONFIG,
    };
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private _maybeRunNext() {
    while (
      this.running < QUEUE_CONFIG.MAX_CONCURRENT &&
      this.waitQueue.length > 0
    ) {
      const job = this.waitQueue.shift()!;

      // Expired while waiting in queue?
      const waitMs = Date.now() - job.queuedAt;
      if (waitMs > QUEUE_CONFIG.MAX_QUEUE_WAIT_MS) {
        job.status = 'timeout';
        job.error = `Job waited ${Math.round(waitMs / 1000)}s in queue (limit ${QUEUE_CONFIG.MAX_QUEUE_WAIT_MS / 1000}s). Server is overloaded.`;
        job.finishedAt = Date.now();
        job._reject?.(new Error(job.error));
        this._decrementUser(job.userId);
        continue;
      }

      this._run(job);
    }
  }

  private async _run(job: QueuedJob) {
    this.running++;
    job.status = 'running';
    job.startedAt = Date.now();

    const task: () => Promise<any> = (job as any)._task;

    try {
      const result = await task();
      job.status = 'done';
      job.result = result;
      job._resolve?.(result);
      this.breaker.recordSuccess();
    } catch (err: any) {
      const isDockerError = /docker|container|ENOENT|EPERM|spawn/i.test(err?.message ?? '');
      if (isDockerError) {
        this.breaker.recordFailure();
      }
      job.status = 'error';
      job.error = err?.message ?? 'Unknown execution error';
      job._reject?.(err);
    } finally {
      job.finishedAt = Date.now();
      this.running--;
      this._decrementUser(job.userId);
      // Clean up internal refs
      delete (job as any)._task;
      delete (job as any)._promise;
      delete (job as any)._resolve;
      delete (job as any)._reject;

      this._maybeRunNext();
    }
  }

  private _storeRejected(jobId: string, userId: string, reason: string) {
    const job: QueuedJob = {
      jobId,
      userId,
      status: 'rejected',
      queuedAt: Date.now(),
      finishedAt: Date.now(),
      error: reason,
    };
    this.jobs.set(jobId, job);
  }

  private _incrementUser(userId: string) {
    this.userJobCount.set(userId, (this.userJobCount.get(userId) ?? 0) + 1);
  }

  private _decrementUser(userId: string) {
    const v = (this.userJobCount.get(userId) ?? 1) - 1;
    if (v <= 0) {
      this.userJobCount.delete(userId);
    } else {
      this.userJobCount.set(userId, v);
    }
  }

  /** Remove jobs older than JOB_TTL_MS to prevent memory leaks */
  private _gc() {
    const cutoff = Date.now() - QUEUE_CONFIG.JOB_TTL_MS;
    for (const [id, job] of this.jobs.entries()) {
      if (
        (job.status === 'done' || job.status === 'error' || job.status === 'rejected' || job.status === 'timeout') &&
        (job.finishedAt ?? 0) < cutoff
      ) {
        this.jobs.delete(id);
      }
    }
  }
}

// Singleton — one queue per process
export const executionQueue = new ExecutionQueueManager();
