import { Redis } from 'ioredis';
import { logger } from '../lib/logger.js';

const redisUri = process.env.REDIS_URI || 'redis://localhost:6379';

export const redis = new Redis(redisUri, {
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
  lazyConnect: true,
});

redis.on('connect', () => {
  logger.info('[Redis] Connected successfully');
});

redis.on('error', (err) => {
  // Only log, do not crash — Redis is optional for queue-based compilation
  logger.warn(`[Redis] Connection error: ${err.message}`);
});
