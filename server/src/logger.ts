/**
 * server/src/logger.ts — P27 Monitoring & Observability
 *
 * Winston-based structured logger for the Express backend.
 *
 * Transports:
 *   Console  — always active; colorized in dev, pure JSON in production
 *   File     — active only when LOG_DIR is set or NODE_ENV === 'production'
 *              error.log  → level 'error' only
 *              combined.log → all levels
 *
 * Usage:
 *   import { logger } from './logger';
 *   logger.info({ component: 'auth', message: 'login attempt', userId });
 *   logger.warn({ component: 'keyvault', message: 'key derivation slow', ms });
 *   logger.error({ component: 'audit', message: 'DB write failed', err });
 */

import winston from 'winston';
import path    from 'path';

const isProd   = process.env.NODE_ENV === 'production';
const LOG_DIR  = process.env.LOG_DIR ?? path.join(process.cwd(), 'logs');
const LOG_LEVEL = process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug');

// ─── Formats ─────────────────────────────────────────────────────────────────

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, component, ...meta }) => {
    const comp = component ? `[${component}] ` : '';
    const metaStr = Object.keys(meta).length
      ? ' ' + JSON.stringify(meta)
      : '';
    return `${timestamp} ${level}: ${comp}${message}${metaStr}`;
  }),
);

// ─── Transports ───────────────────────────────────────────────────────────────

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: isProd ? jsonFormat : devFormat,
  }),
];

// File transports — only in production or when LOG_DIR is explicitly configured
if (isProd || process.env.LOG_DIR) {
  transports.push(
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level:    'error',
      format:   jsonFormat,
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      format:   jsonFormat,
    }),
  );
}

// ─── Logger ───────────────────────────────────────────────────────────────────

export const logger = winston.createLogger({
  level:       LOG_LEVEL,
  defaultMeta: { service: 'docentedoc-backend' },
  transports,
});

logger.debug({ message: `Logger initialised`, level_active: LOG_LEVEL, file_log: isProd || !!process.env.LOG_DIR });
