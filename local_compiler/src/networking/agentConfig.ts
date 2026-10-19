/**
 * MUJCODE Local Compiler — Validated Agent Configuration
 * 
 * Strict configuration management with development vs. production isolation.
 * Rejects insecure protocols and invalid parameters.
 */

export interface AgentConfig {
  backendBaseUrl: string;
  agentNamespace: string;
  connectTimeoutMs: number;
  initialReconnectDelayMs: number;
  maxReconnectDelayMs: number;
  reconnectJitterFactor: number;
  heartbeatIntervalMs: number;
  heartbeatTimeoutMs: number;
  maxMessageSizeBytes: number;
  maxPendingJobs: number;
  jobMaxAgeMs: number;
  agentVersion: string;
  isProduction: boolean;
}

export const DEFAULT_DEV_CONFIG: AgentConfig = {
  backendBaseUrl: 'http://localhost:5000',
  agentNamespace: '/agent',
  connectTimeoutMs: 10000,
  initialReconnectDelayMs: 1000,
  maxReconnectDelayMs: 30000,
  reconnectJitterFactor: 0.3,
  heartbeatIntervalMs: 15000,
  heartbeatTimeoutMs: 35000,
  maxMessageSizeBytes: 256 * 1024,
  maxPendingJobs: 5,
  jobMaxAgeMs: 60000,
  agentVersion: '1.0.0',
  isProduction: false
};

export const DEFAULT_PROD_CONFIG: AgentConfig = {
  backendBaseUrl: 'https://mujcode-1.onrender.com',
  agentNamespace: '/agent',
  connectTimeoutMs: 25000,
  initialReconnectDelayMs: 1500,
  maxReconnectDelayMs: 60000,
  reconnectJitterFactor: 0.3,
  heartbeatIntervalMs: 15000,
  heartbeatTimeoutMs: 35000,
  maxMessageSizeBytes: 256 * 1024,
  maxPendingJobs: 3,
  jobMaxAgeMs: 45000,
  agentVersion: '1.0.0',
  isProduction: true
};

export function validateAgentConfig(config: AgentConfig): void {
  if (!config) {
    throw new Error('Agent configuration is required');
  }

  // 1. URL validation
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(config.backendBaseUrl);
  } catch {
    throw new Error(`Invalid backend base URL: "${config.backendBaseUrl}"`);
  }

  // 2. Protocol security check
  const allowedDevProtocols = ['http:', 'https:', 'ws:', 'wss:'];
  if (!allowedDevProtocols.includes(parsedUrl.protocol)) {
    throw new Error(`Unsupported URL protocol: "${parsedUrl.protocol}". Must be HTTP, HTTPS, WS, or WSS.`);
  }

  if (config.isProduction) {
    // Production remote connections strictly require HTTPS or WSS with valid TLS
    const isLoopback = parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1';
    if (!isLoopback && parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'wss:') {
      throw new Error(
        `Insecure protocol in production: "${parsedUrl.protocol}". Production connections strictly require HTTPS or WSS.`
      );
    }
  }

  // 3. Timeouts & bounds validation
  if (config.connectTimeoutMs < 1000 || config.connectTimeoutMs > 60000) {
    throw new Error('connectTimeoutMs must be between 1,000ms and 60,000ms');
  }
  if (config.initialReconnectDelayMs < 100 || config.initialReconnectDelayMs > config.maxReconnectDelayMs) {
    throw new Error('initialReconnectDelayMs must be between 100ms and maxReconnectDelayMs');
  }
  if (config.heartbeatIntervalMs < 1000 || config.heartbeatIntervalMs >= config.heartbeatTimeoutMs) {
    throw new Error('heartbeatIntervalMs must be less than heartbeatTimeoutMs and at least 1,000ms');
  }
  if (config.maxPendingJobs < 1 || config.maxPendingJobs > 50) {
    throw new Error('maxPendingJobs must be between 1 and 50');
  }
  if (config.maxMessageSizeBytes < 1024 || config.maxMessageSizeBytes > 5 * 1024 * 1024) {
    throw new Error('maxMessageSizeBytes must be between 1 KB and 5 MB');
  }
}
