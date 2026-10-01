/**
 * High-precision latency and throughput collector
 */
export class MetricsCollector {
  constructor(name = 'default') {
    this.name = name;
    this.latencies = [];
    this.statusCodes = {};
    this.errors = {};
    this.startTime = null;
    this.endTime = null;
    this.totalRequests = 0;
  }

  start() {
    this.startTime = Date.now();
  }

  stop() {
    this.endTime = Date.now();
  }

  record(latencyMs, statusCode, error = null) {
    this.totalRequests++;
    this.latencies.push(latencyMs);
    this.statusCodes[statusCode] = (this.statusCodes[statusCode] || 0) + 1;
    if (error) {
      const errKey = typeof error === 'string' ? error : (error.code || error.message || 'UNKNOWN');
      this.errors[errKey] = (this.errors[errKey] || 0) + 1;
    }
  }

  getSummary() {
    const elapsedSec = Math.max(0.001, ((this.endTime || Date.now()) - this.startTime) / 1000);
    const count = this.latencies.length;

    if (count === 0) {
      return {
        name: this.name,
        totalRequests: 0,
        elapsedSec,
        rps: 0,
        min: 0,
        max: 0,
        avg: 0,
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0,
        statusCodes: this.statusCodes,
        errors: this.errors,
        errorRatePct: 0
      };
    }

    // Sort latencies for percentiles
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, v) => acc + v, 0);

    const percentile = (p) => {
      const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
      return Number(sorted[idx].toFixed(2));
    };

    let errorCount = 0;
    for (const [status, cnt] of Object.entries(this.statusCodes)) {
      const numStatus = parseInt(status, 10);
      if (numStatus >= 400 || isNaN(numStatus)) {
        errorCount += cnt;
      }
    }
    for (const cnt of Object.values(this.errors)) {
      errorCount += cnt;
    }

    const exactElapsedMs = (this.endTime || Date.now()) - this.startTime;
    const exactElapsedSec = Math.max(0.0001, exactElapsedMs / 1000);
    const actualRps = this.totalRequests / exactElapsedSec;

    return {
      name: this.name,
      test_start_timestamp: new Date(this.startTime).toISOString(),
      test_end_timestamp: new Date(this.endTime || Date.now()).toISOString(),
      exact_elapsed_ms: exactElapsedMs,
      exact_elapsed_seconds: exactElapsedSec,
      requests_completed: this.totalRequests,
      successful_requests: this.totalRequests - errorCount,
      requests_failed: errorCount,
      actual_RPS: Number(actualRps.toFixed(2)),
      totalRequests: this.totalRequests,
      successfulRequests: this.totalRequests - errorCount,
      failedRequests: errorCount,
      elapsedSec: Number(exactElapsedSec.toFixed(3)),
      rps: Number(actualRps.toFixed(2)),
      min: Number(sorted[0].toFixed(2)),
      max: Number(sorted[sorted.length - 1].toFixed(2)),
      avg: Number((sum / count).toFixed(2)),
      p50: percentile(50),
      p90: percentile(90),
      p95: percentile(95),
      p99: percentile(99),
      statusCodes: this.statusCodes,
      errors: this.errors,
      errorRatePct: Number(((errorCount / this.totalRequests) * 100).toFixed(2))
    };
  }
}
