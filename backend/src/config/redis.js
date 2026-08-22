import { Redis } from 'ioredis';

const redisUri = process.env.REDIS_URI || 'redis://localhost:6379';

export const redis = new Redis(redisUri, {
  maxRetriesPerRequest: 3,
});

import { logger } from '../lib/logger.js';

redis.on('connect', () => {
  logger.info('[Redis] Connected successfully');
});

redis.on('error', (err) => {
  logger.error(`[Redis] Connection error: ${err.message}`);
});
