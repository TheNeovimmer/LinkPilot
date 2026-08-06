import winston from 'winston';
import { env } from '../config/env.js';

const format = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  env.NODE_ENV === 'production'
    ? winston.format.json()
    : winston.format.printf(({ timestamp, level, message, stack }) => {
        const meta = stack ? `\n${stack}` : '';
        return `${String(timestamp)} [${level.toUpperCase().padEnd(5)}] ${String(message)}${meta}`;
      }),
);

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'test' ? 'silent' : env.NODE_ENV === 'production' ? 'info' : 'debug',
  format,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error', maxsize: 5_000_000, maxFiles: 3 }),
    new winston.transports.File({ filename: 'logs/combined.log', maxsize: 5_000_000, maxFiles: 3 }),
  ],
});
