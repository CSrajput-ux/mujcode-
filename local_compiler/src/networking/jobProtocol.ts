/**
 * MUJCODE Local Compiler — Validated Job Protocol & Execution Handler
 * 
 * Strict validation of incoming job messages, replay protection, bounds enforcement,
 * and correlation of execution results.
 */

import { InboundJobMessage, OutboundJobResult, AGENT_PROTOCOL_VERSION } from '../shared/agentProtocol.js';
import { ExecutionRequest, ExecutionResult } from '../shared/executionTypes.js';
import { adapterBridge } from '../compiler/adapterBridge.js';
import { AgentConfig } from './agentConfig.js';

const APPROVED_LANGUAGE_IDS = new Set([50, 54, 62, 71, 63, 60, 82]);

export class JobProtocolHandler {
  private config: AgentConfig;
  private seenJobIds: Map<string, number> = new Map(); // jobId -> processedAt timestamp
  private activeJobs: Set<string> = new Set();
  private maxCacheEntries: number = 500;
  private cacheRetentionMs: number = 15 * 60 * 1000; // 15 minutes

  constructor(config: AgentConfig) {
    this.config = config;

    // Periodically prune old job IDs from the deduplication cache
    const cleanupInterval = setInterval(() => this.pruneSeenJobs(), 60 * 1000);
    if (cleanupInterval.unref) cleanupInterval.unref();
  }

  private pruneSeenJobs(): void {
    const now = Date.now();
    for (const [id, timestamp] of this.seenJobIds.entries()) {
      if (now - timestamp > this.cacheRetentionMs) {
        this.seenJobIds.delete(id);
      }
    }
  }

  /**
   * Validate incoming job message strictly against security bounds and protocol contracts.
   */
  validateInboundJob(job: InboundJobMessage): { valid: boolean; reason?: string } {
    if (!job || typeof job !== 'object') {
      return { valid: false, reason: 'Malformed job message: expected an object' };
    }

    // 1. Protocol version check
    if (!job.protocolVersion || typeof job.protocolVersion !== 'string') {
      return { valid: false, reason: 'Missing protocolVersion string' };
    }

    // 2. Job ID format check
    if (!job.jobId || typeof job.jobId !== 'string' || job.jobId.trim().length === 0) {
      return { valid: false, reason: 'Missing or empty jobId' };
    }
    if (!/^[a-zA-Z0-9_\-:.]{1,128}$/.test(job.jobId)) {
      return { valid: false, reason: `Invalid jobId format: "${job.jobId}". Allowed: alphanumeric, -, _, :, . (max 128 chars)` };
    }

    // 3. Language allowlist check
    if (job.languageId === null || job.languageId === undefined || !APPROVED_LANGUAGE_IDS.has(Number(job.languageId))) {
      return {
        valid: false,
        reason: `Unsupported language ID: ${job.languageId}. Allowed: [${Array.from(APPROVED_LANGUAGE_IDS).join(', ')}]`
      };
    }

    // 4. Source code check
    if (typeof job.sourceCode !== 'string') {
      return { valid: false, reason: 'sourceCode must be a string' };
    }
    if (Buffer.byteLength(job.sourceCode, 'utf8') > 100 * 1024) {
      return { valid: false, reason: 'Source code exceeds maximum allowed size of 100 KB' };
    }

    // 5. Stdin check
    if (job.stdin && Buffer.byteLength(job.stdin, 'utf8') > 1024 * 1024) {
      return { valid: false, reason: 'Standard input exceeds maximum allowed size of 1 MB' };
    }

    // 6. Timestamp & Expiry checks
    const now = Date.now();
    if (typeof job.timestamp !== 'number' || isNaN(job.timestamp)) {
      return { valid: false, reason: 'Invalid or missing job timestamp' };
    }
    if (job.expiresAt && typeof job.expiresAt === 'number' && job.expiresAt <= now) {
      return { valid: false, reason: `Job has expired: expiresAt ${job.expiresAt} <= now ${now}` };
    }
    if (now - job.timestamp > this.config.jobMaxAgeMs) {
      return { valid: false, reason: `Job is stale: age ${now - job.timestamp}ms exceeds limit of ${this.config.jobMaxAgeMs}ms` };
    }

    // 7. Replay / Duplicate check
    if (this.seenJobIds.has(job.jobId)) {
      return { valid: false, reason: `Duplicate job rejected: jobId "${job.jobId}" was already processed` };
    }

    // 8. Queue concurrency capacity check
    if (this.activeJobs.size >= this.config.maxPendingJobs) {
      return { valid: false, reason: `Execution queue saturated: ${this.activeJobs.size} active jobs (max ${this.config.maxPendingJobs})` };
    }

    return { valid: true };
  }

  /**
   * Process a validated inbound job and return the normalized outbound result.
   */
  async processJob(job: InboundJobMessage): Promise<OutboundJobResult> {
    const startTime = Date.now();

    // 1. Validation
    const validation = this.validateInboundJob(job);
    if (!validation.valid) {
      return {
        protocolVersion: AGENT_PROTOCOL_VERSION,
        jobId: job?.jobId || 'invalid_job',
        status: 'INTERNAL_ERROR',
        verdict: 'Job Validation Failed',
        stdout: '',
        stderr: validation.reason || 'Job validation error',
        exitCode: 1,
        executionTimeMs: Date.now() - startTime,
        truncated: false,
        errorCode: 'VALIDATION_FAILED',
        timestamp: Date.now()
      };
    }

    // 2. Mark active & record in seen set to prevent duplicate execution
    this.activeJobs.add(job.jobId);
    this.seenJobIds.set(job.jobId, Date.now());

    // Prune cache size if needed
    if (this.seenJobIds.size > this.maxCacheEntries) {
      const oldestKey = this.seenJobIds.keys().next().value;
      if (oldestKey) this.seenJobIds.delete(oldestKey);
    }

    try {
      const execRequest: ExecutionRequest = {
        requestId: job.jobId,
        language: job.languageId,
        sourceCode: job.sourceCode,
        stdin: job.stdin || '',
        timeLimitMs: job.timeLimitMs
      };

      const result: ExecutionResult = await adapterBridge.executeCode(execRequest);

      return {
        protocolVersion: AGENT_PROTOCOL_VERSION,
        jobId: job.jobId,
        status: result.status,
        verdict: result.verdict,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        executionTimeMs: result.executionTimeMs,
        compileError: result.compileError,
        truncated: result.truncated,
        errorCode: result.errorCode,
        timestamp: Date.now()
      };
    } catch (err: any) {
      return {
        protocolVersion: AGENT_PROTOCOL_VERSION,
        jobId: job.jobId,
        status: 'INTERNAL_ERROR',
        verdict: 'Execution Exception',
        stdout: '',
        stderr: `Unexpected error during job execution: ${err.message}`,
        exitCode: 1,
        executionTimeMs: Date.now() - startTime,
        truncated: false,
        errorCode: 'INTERNAL_ERROR',
        timestamp: Date.now()
      };
    } finally {
      this.activeJobs.delete(job.jobId);
    }
  }

  getActiveJobCount(): number {
    return this.activeJobs.size;
  }

  clearJobHistory(): void {
    this.seenJobIds.clear();
    this.activeJobs.clear();
  }
}
