import { Router } from 'express';
import { submissionQueue } from '../queue/SubmissionQueue.js';
import { LANGUAGES } from '../registry/languages.js';

export const compilerApiRouter = Router();

// ── GET /api/compiler/languages ─────────────────────────────────────────────
compilerApiRouter.get('/languages', (req, res) => {
  res.json({
    success: true,
    languages: LANGUAGES.map(l => ({
      id: l.id,
      key: l.key,
      name: l.name,
      version: l.version,
      extension: l.extension,
      isCompiled: l.isCompiled,
      defaultTimeLimitSec: l.defaultTimeLimit,
      maxTimeLimitSec: l.maxTimeLimit,
      memoryLimitMb: l.defaultMemoryLimit
    }))
  });
});

// ── GET /api/compiler/health ────────────────────────────────────────────────
compilerApiRouter.get('/health', (req, res) => {
  const metrics = submissionQueue.getMetrics();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    workers: {
      active: metrics.activeWorkers,
      limit: metrics.concurrencyLimit
    },
    queue: {
      depth: metrics.queuedJobs
    }
  });
});

// ── GET /api/compiler/metrics ───────────────────────────────────────────────
compilerApiRouter.get('/metrics', (req, res) => {
  res.json({
    metrics: submissionQueue.getMetrics(),
    process: {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptimeSec: process.uptime()
    }
  });
});

// ── POST /api/compiler/submissions ──────────────────────────────────────────
compilerApiRouter.post('/submissions', (req, res) => {
  try {
    const {
      language_id,
      source_code,
      stdin = '',
      time_limit = null,
      memory_limit_mb = null,
      schema_sql = '',
      seed_sql = ''
    } = req.body;

    if (!source_code || !String(source_code).trim()) {
      return res.status(400).json({ error: 'source_code is required and cannot be empty' });
    }

    const job = submissionQueue.enqueue({
      sourceCode: source_code,
      languageId: language_id,
      stdin,
      cpuTimeLimit: time_limit,
      memoryLimit: memory_limit_mb,
      schemaSql: schema_sql,
      seedSql: seed_sql
    });

    res.status(202).json({
      submission_id: job.token,
      status: 'queued',
      language: job.language.name,
      created_at: job.createdAt
    });
  } catch (err) {
    const status = err.statusCode || 400;
    res.status(status).json({ error: err.message });
  }
});

// ── GET /api/compiler/submissions/:id ───────────────────────────────────────
compilerApiRouter.get('/submissions/:id', (req, res) => {
  const job = submissionQueue.getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Submission not found or expired' });
  }

  res.json({
    submission_id: job.token,
    status: mapToApiStatus(job.statusId),
    verdict: job.statusDescription,
    created_at: job.createdAt,
    finished_at: job.finishedAt
  });
});

// ── GET /api/compiler/submissions/:id/result ────────────────────────────────
compilerApiRouter.get('/submissions/:id/result', (req, res) => {
  const job = submissionQueue.getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Submission not found or expired' });
  }

  if (job.statusId === 1 || job.statusId === 2) {
    return res.status(202).json({
      submission_id: job.token,
      status: job.statusId === 1 ? 'queued' : 'processing',
      message: 'Job is still in progress'
    });
  }

  res.json({
    submission_id: job.token,
    status: mapToApiStatus(job.statusId),
    verdict: job.statusDescription,
    stdout: job.stdout || '',
    stderr: job.stderr || '',
    compile_output: job.compileOutput || '',
    exit_code: job.exitCode,
    time_ms: job.time ? Math.round(job.time * 1000) : 0,
    memory_kb: job.memory || 0,
    created_at: job.createdAt,
    finished_at: job.finishedAt
  });
});

function mapToApiStatus(statusId) {
  switch (statusId) {
    case 1: return 'queued';
    case 2: return 'processing';
    case 3: return 'completed';
    case 4: return 'wrong_answer';
    case 5: return 'time_limit_exceeded';
    case 6: return 'compilation_error';
    case 11: return 'runtime_error';
    case 13: return 'failed';
    default: return 'unknown';
  }
}
