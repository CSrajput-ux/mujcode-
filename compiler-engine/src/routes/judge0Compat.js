import { Router } from 'express';
import { submissionQueue } from '../queue/SubmissionQueue.js';
import { LANGUAGES, resolveLanguage } from '../registry/languages.js';

export const judge0CompatRouter = Router();

function fromBase64(str) {
  if (!str) return '';
  try {
    return Buffer.from(str, 'base64').toString('utf8');
  } catch {
    return String(str);
  }
}

function toBase64(str) {
  if (str === null || str === undefined) return null;
  return Buffer.from(String(str), 'utf8').toString('base64');
}

// ── GET /about ──────────────────────────────────────────────────────────────
judge0CompatRouter.get('/about', (req, res) => {
  res.json({
    version: '1.13.1-mujcode',
    homepage: 'https://mujcode.in',
    maintainer: 'MUJCODE Compiler Infrastructure Team',
    engine: 'MUJCODE Lightweight Compiler Engine (7 Languages)'
  });
});

// ── GET /system_info ────────────────────────────────────────────────────────
judge0CompatRouter.get('/system_info', (req, res) => {
  res.json({
    version: '1.13.1-mujcode',
    arch: process.arch,
    platform: process.platform,
    languages: LANGUAGES.length,
    concurrency: submissionQueue.getMetrics().concurrencyLimit
  });
});

// ── GET /languages ──────────────────────────────────────────────────────────
judge0CompatRouter.get('/languages', (req, res) => {
  res.json(
    LANGUAGES.map(l => ({
      id: l.id,
      name: l.name,
      is_archived: false,
      source_file: `source${l.extension}`
    }))
  );
});

// ── POST /submissions ───────────────────────────────────────────────────────
judge0CompatRouter.post('/submissions', async (req, res) => {
  try {
    const isBase64 = String(req.query.base64_encoded || req.body?.base64_encoded || 'false').toLowerCase() === 'true';
    const isWait = String(req.query.wait || req.body?.wait || 'false').toLowerCase() === 'true';

    const rawSource = req.body.source_code || '';
    const rawStdin = req.body.stdin || '';
    const rawExpected = req.body.expected_output || null;
    const rawSchema = req.body.schema_sql || req.body.schemaSql || '';
    const rawSeed = req.body.seed_sql || req.body.seedSql || '';

    const sourceCode = isBase64 && rawSource ? fromBase64(rawSource) : rawSource;
    const stdin = isBase64 && rawStdin ? fromBase64(rawStdin) : rawStdin;
    const expectedOutput = isBase64 && rawExpected ? fromBase64(rawExpected) : rawExpected;
    const schemaSql = isBase64 && rawSchema ? fromBase64(rawSchema) : rawSchema;
    const seedSql = isBase64 && rawSeed ? fromBase64(rawSeed) : rawSeed;
    const languageId = req.body.language_id;
    const cpuTimeLimit = req.body.cpu_time_limit;
    const memoryLimit = req.body.memory_limit;

    const job = submissionQueue.enqueue({
      sourceCode,
      languageId,
      stdin,
      expectedOutput,
      cpuTimeLimit,
      memoryLimit,
      schemaSql,
      seedSql
    });

    if (isWait) {
      // Poll internally until finished or 15s timeout
      const maxWaitMs = 15000;
      const startWait = Date.now();
      while (job.statusId === 1 || job.statusId === 2) {
        if (Date.now() - startWait > maxWaitMs) break;
        await new Promise(r => setTimeout(r, 100));
      }
      return res.status(201).json(formatSubmissionResponse(job, isBase64));
    }

    return res.status(201).json({ token: job.token });
  } catch (err) {
    const status = err.statusCode || 400;
    return res.status(status).json({ error: err.message });
  }
});

// ── GET /submissions/:token ─────────────────────────────────────────────────
judge0CompatRouter.get('/submissions/:token', (req, res) => {
  const isBase64 = String(req.query.base64_encoded || 'false').toLowerCase() === 'true';
  const job = submissionQueue.getJob(req.params.token);

  if (!job) {
    return res.status(404).json({ error: 'Submission not found or expired' });
  }

  res.json(formatSubmissionResponse(job, isBase64));
});

function formatSubmissionResponse(job, isBase64) {
  return {
    token: job.token,
    status_id: job.statusId,
    status: {
      id: job.statusId,
      description: job.statusDescription
    },
    stdout: isBase64 ? toBase64(job.stdout) : job.stdout,
    stderr: isBase64 ? toBase64(job.stderr) : job.stderr,
    compile_output: isBase64 ? toBase64(job.compileOutput) : job.compileOutput,
    message: job.message,
    exit_code: job.exitCode,
    time: job.time,
    memory: job.memory,
    created_at: job.createdAt,
    finished_at: job.finishedAt
  };
}
