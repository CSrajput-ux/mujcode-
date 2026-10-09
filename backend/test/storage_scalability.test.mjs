import test from 'node:test';
import assert from 'node:assert/strict';
import {
  setDbCache,
  loadDb,
  saveDb,
  onWorkerCacheSync
} from '../src/lib/storage.js';
import {
  getPostgresPoolStats,
  getStudentTestSubmissionsPg,
  closePostgres
} from '../src/lib/postgres.js';
import { redis, getRedisStats, getRawRedisClient, closeRedis } from '../src/config/redis.js';
import { getClientIp } from '../src/middlewares/rateLimiter.js';
import { config } from '../src/config.js';

test('Storage, Scalability & Resource Management Test Suite', async (t) => {
  t.after(async () => {
    await closeRedis();
    await closePostgres();
    // Flush any pending save timeout
    const handles = process._getActiveHandles?.() || [];
    for (const h of handles) {
      if (typeof h.unref === 'function') h.unref();
    }
  });

  await t.test('1. Granular Cache Synchronization preserves untouched collections', () => {
    // Initial state
    setDbCache({
      students: [{ id: 'stu1', name: 'Alice' }],
      faculty: [{ id: 'fac1', name: 'Dr. Bob' }],
      assignments: [{ id: 'ass1', title: 'HW 1' }]
    });

    // Worker receives update for ONLY assignments
    onWorkerCacheSync({
      collection: 'assignments',
      data: [{ id: 'ass1', title: 'HW 1 Updated' }, { id: 'ass2', title: 'HW 2' }]
    });

    const current = loadDb();
    // Untouched collections must NOT be wiped out
    assert.equal(current.students.length, 1);
    assert.equal(current.students[0].name, 'Alice');
    assert.equal(current.faculty.length, 1);
    assert.equal(current.faculty[0].name, 'Dr. Bob');

    // Updated collection must have new data
    assert.equal(current.assignments.length, 2);
    assert.equal(current.assignments[0].title, 'HW 1 Updated');
  });

  await t.test('2. Granular saveDb accepts collection hint', () => {
    const db = loadDb();
    db.assignments.push({ id: 'ass3', title: 'HW 3' });
    
    // Save with specific collection hint
    const saved = saveDb(db, 'assignments');
    assert.equal(saved.assignments.length, 3);
  });

  await t.test('3. Configurable PostgreSQL Pool Defaults & Bounds', () => {
    assert.ok(typeof config.postgresPoolMax === 'number', 'postgresPoolMax must be number');
    assert.ok(config.postgresPoolMax >= 1 && config.postgresPoolMax <= 100, 'postgresPoolMax in safe range');
    assert.ok(typeof config.postgresPoolMin === 'number', 'postgresPoolMin must be number');
    assert.ok(typeof config.saveDebounceMs === 'number', 'saveDebounceMs must be number');
    assert.ok(config.saveDebounceMs <= 1000, 'saveDebounceMs should be responsive (<= 1000ms)');
    
    const stats = getPostgresPoolStats();
    assert.ok('isConnected' in stats);
    assert.ok('totalCount' in stats);
  });

  await t.test('4. Redis Status & Safe Fallback Operation', async () => {
    const stats = getRedisStats();
    assert.ok(['remote', 'in-memory-fallback'].includes(stats.mode));
    assert.equal(typeof stats.isRemoteConnected, 'boolean');

    // Test pipeline execution with atomic incr/expire
    const pipe = redis.pipeline();
    pipe.incr('test:rate:key');
    pipe.expire('test:rate:key', 10, 'NX');
    const results = await pipe.exec();

    assert.ok(Array.isArray(results), 'Pipeline results must be array');
    assert.equal(results.length, 2, 'Should execute both commands');
    assert.equal(results[0][0], null, 'First command error should be null');
    assert.ok(typeof results[0][1] === 'number', 'incr result should be number');
  });

  await t.test('5. Client IP Trust: X-Real-IP and X-Forwarded-For resolution', () => {
    // 1. Direct connection without proxy
    const directReq = {
      socket: { remoteAddress: '203.0.113.195' },
      headers: {}
    };
    assert.equal(getClientIp(directReq), '203.0.113.195');

    // 2. Private proxy with X-Real-IP
    const nginxReq = {
      socket: { remoteAddress: '127.0.0.1' },
      headers: {
        'x-real-ip': '198.51.100.42',
        'x-forwarded-for': '198.51.100.42, 10.0.0.1'
      }
    };
    assert.equal(getClientIp(nginxReq), '198.51.100.42');

    // 3. Docker bridge network proxy with X-Forwarded-For
    const dockerReq = {
      socket: { remoteAddress: '172.18.0.5' },
      headers: {
        'x-forwarded-for': '203.0.113.88, 172.18.0.2'
      }
    };
    assert.equal(getClientIp(dockerReq), '203.0.113.88');
  });

  await t.test('6. getStudentTestSubmissionsPg handles disconnected state gracefully', async () => {
    // When DB is disconnected or mock environment, must return null or array without throwing
    const res = await getStudentTestSubmissionsPg('non_existent_stu');
    assert.ok(res === null || Array.isArray(res));
  });
});
