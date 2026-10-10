import dns from 'node:dns';
import mongoose from 'mongoose';
import { logger } from '../lib/logger.js';

// Configure DNS fallback if Windows defaults to loopback 127.0.0.1 (prevents querySrv ECONNREFUSED)
try {
  const currentServers = dns.getServers();
  if (!currentServers || currentServers.length === 0 || (currentServers.length === 1 && currentServers[0] === '127.0.0.1')) {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
} catch {
  // Non-fatal DNS fallback error
}

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    logger.warn('[MongoDB] MONGODB_URI not set — ATS placement features will be unavailable.');
    return;
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(`[MongoDB] Connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error(`[MongoDB] Connection failed: ${err.message} — ATS features disabled.`);
    // Non-fatal: rest of app continues with JSON-based storage
  }
};
