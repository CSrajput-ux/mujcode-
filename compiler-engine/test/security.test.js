import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getAdapterForLanguage } from '../src/adapters/index.js';
import { config } from '../src/config.js';

test('MUJCODE Compiler Engine — DevSecOps & Security Hardening Tests', async (t) => {

  // ── 1. Workspace Cleanup Verification ───────────────────────────────────────
  await t.test('1. Ephemeral Workspaces are Deleted Post-Execution', async () => {
    const adapter = getAdapterForLanguage('python');
    const beforeDirs = fs.existsSync(config.workBaseDir) 
      ? new Set(fs.readdirSync(config.workBaseDir).filter(f => f.startsWith('job_')))
      : new Set();

    const res = await adapter.execute({
      sourceCode: 'print("Testing ephemeral cleanup")'
    });
    assert.equal(res.status, 'ACCEPTED');

    // Verify no new orphaned job directory remains
    const afterDirs = fs.existsSync(config.workBaseDir)
      ? fs.readdirSync(config.workBaseDir).filter(f => f.startsWith('job_') && !beforeDirs.has(f))
      : [];
    assert.equal(afterDirs.length, 0, 'All temporary workspaces must be cleaned up in finally block');
  });

  // ── 2. Output Flooding Protection (256 KB Truncation) ──────────────────────
  await t.test('2. Output Flooding Protection Capping at 256 KB', async () => {
    const adapter = getAdapterForLanguage('python');
    // Generate 500 KB of output
    const res = await adapter.execute({
      sourceCode: 'print("A" * (400 * 1024))'
    });
    assert.equal(res.status, 'ACCEPTED');
    assert.ok(res.stdout.includes('[Output truncated'), 'Excessive stdout must be safely capped and marked truncated');
    assert.ok(Buffer.byteLength(res.stdout, 'utf8') <= 300 * 1024, 'Stdout must not exceed output quota');
  });

  // ── 3. Parent Secrets & Environment Isolation ──────────────────────────────
  await t.test('3. Child Processes Cannot Read Application Secrets from Env', async () => {
    // Set dummy secrets in parent process
    process.env.APP_SECRET_TOKEN = 'SUPER_SECRET_KEY_12345';
    process.env.DB_PASSWORD = 'TOP_SECRET_DB_PASS';

    const adapter = getAdapterForLanguage('python');
    const res = await adapter.execute({
      sourceCode: 'import os; print("TOKEN:", os.environ.get("APP_SECRET_TOKEN", "NONE")); print("PASS:", os.environ.get("DB_PASSWORD", "NONE"))'
    });
    assert.equal(res.status, 'ACCEPTED');
    assert.ok(res.stdout.includes('TOKEN: NONE'), 'APP_SECRET_TOKEN must NOT be exposed to student process');
    assert.ok(res.stdout.includes('PASS: NONE'), 'DB_PASSWORD must NOT be exposed to student process');

    delete process.env.APP_SECRET_TOKEN;
    delete process.env.DB_PASSWORD;
  });

  // ── 4. SQL Injection & Filesystem Tampering Defense ────────────────────────
  await t.test('4. SQL Sandbox blocks Filesystem & Extension Attacks', async () => {
    const sqlAdapter = getAdapterForLanguage('sql');

    const exploits = [
      'ATTACH DATABASE "/etc/passwd" AS leaked;',
      'DETACH DATABASE stolen;',
      'PRAGMA writable_schema = 1;',
      'SELECT load_extension("exploit.so");'
    ];

    for (const exploit of exploits) {
      const res = await sqlAdapter.execute({ sourceCode: exploit });
      assert.equal(res.status, 'RUNTIME_ERROR', `Exploit '${exploit}' must be blocked`);
      assert.ok(res.stderr.includes('Security Exception'));
    }
  });
});
