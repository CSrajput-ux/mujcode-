import winston from 'winston';
import { config } from '../config.js';

const isProduction = process.env.NODE_ENV === 'production';

// Enterprise logging configuration
export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    isProduction 
      ? winston.format.json() // Loki/ELK prefers raw JSON
      : winston.format.prettyPrint() // Local dev prefers readable format
  ),
  defaultMeta: { service: 'mujcode-backend' },
  transports: [
    new winston.transports.Console({
      format: isProduction
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
    })
  ]
});
