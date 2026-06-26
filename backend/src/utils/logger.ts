/**
 * Production Logging Middleware
 * Supports both local Winston logging and remote evaluation service logging
 * @module utils/logger
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import axios from 'axios';
import { config } from '../config';
import type { LogStack, LogLevel, LogPackage, ILogEntry } from '../types';

const { combine, timestamp, json, errors, printf } = winston.format;

// Valid values for validation
const VALID_STACKS: LogStack[] = ['backend', 'frontend'];
const VALID_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
const VALID_BACKEND_PACKAGES: LogPackage[] = [
  'cache', 'controller', 'cron_job', 'db', 'domain', 
  'handler', 'repository', 'route', 'service'
];
const VALID_FRONTEND_PACKAGES: LogPackage[] = [
  'api', 'component', 'hook', 'page', 'state', 'style'
];
const VALID_COMMON_PACKAGES: LogPackage[] = [
  'auth', 'config', 'middleware', 'utils'
];
const VALID_PACKAGES = [
  ...VALID_BACKEND_PACKAGES, 
  ...VALID_FRONTEND_PACKAGES, 
  ...VALID_COMMON_PACKAGES
];

// Winston transport for local logging
const fileTransport = new DailyRotateFile({
  filename: `${config.LOG_FILE_PATH}/app-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: `${config.LOG_RETENTION_DAYS}d`,
  format: combine(timestamp(), json())
});

const errorTransport = new DailyRotateFile({
  filename: `${config.LOG_FILE_PATH}/error-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: `${config.LOG_RETENTION_DAYS}d`,
  level: 'error',
  format: combine(timestamp(), json())
});

// Console format for development
const consoleFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
  if (stack) logMessage += `\n${stack}`;
  if (Object.keys(metadata).length > 0) logMessage += `\n${JSON.stringify(metadata, null, 2)}`;
  return logMessage;
});

const transports: winston.transport[] = [fileTransport, errorTransport];

if (config.NODE_ENV === 'development') {
  transports.push(
    new winston.transports.Console({
      format: combine(timestamp(), consoleFormat)
    })
  );
}

const winstonLogger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports,
  exitOnError: false
});

/**
 * Validates log entry parameters
 */
function validateLogEntry(
  stack: LogStack,
  level: LogLevel,
  pkg: LogPackage
): void {
  if (!VALID_STACKS.includes(stack)) {
    throw new Error(`Invalid stack: ${stack}. Must be one of: ${VALID_STACKS.join(', ')}`);
  }
  if (!VALID_LEVELS.includes(level)) {
    throw new Error(`Invalid level: ${level}. Must be one of: ${VALID_LEVELS.join(', ')}`);
  }
  if (!VALID_PACKAGES.includes(pkg)) {
    throw new Error(`Invalid package: ${pkg}. Must be one of: ${VALID_PACKAGES.join(', ')}`);
  }
}

/**
 * Sends log to evaluation service
 */
async function sendToEvaluationService(entry: ILogEntry): Promise<void> {
  try {
    await axios.post(
      `${config.EVALUATION_SERVICE_URL}/logs`,
      {
        stack: entry.stack,
        level: entry.level,
        package: entry.package,
        message: entry.message
      },
      {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    winstonLogger.error('Failed to send log to evaluation service', {
      error: (error as Error).message,
      entry
    });
  }
}

/**
 * Main logging function - validates, logs locally, and sends to evaluation service
 */
export async function Log(
  stack: LogStack,
  level: LogLevel,
  pkg: LogPackage,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  // Validate inputs
  validateLogEntry(stack, level, pkg);

  const entry: ILogEntry = {
    stack,
    level,
    package: pkg,
    message,
    timestamp: new Date(),
    metadata
  };

  // Log to Winston (local)
  winstonLogger.log(level, message, { stack, package: pkg, ...metadata });

  // Send to evaluation service (non-blocking)
  if (config.NODE_ENV !== 'test') {
    sendToEvaluationService(entry).catch(() => {
      // Silently fail - already logged to Winston
    });
  }
}

/**
 * Convenience methods for different log levels
 */
export const Logger = {
  debug: (pkg: LogPackage, message: string, meta?: Record<string, unknown>) => 
    Log('backend', 'debug', pkg, message, meta),
  info: (pkg: LogPackage, message: string, meta?: Record<string, unknown>) => 
    Log('backend', 'info', pkg, message, meta),
  warn: (pkg: LogPackage, message: string, meta?: Record<string, unknown>) => 
    Log('backend', 'warn', pkg, message, meta),
  error: (pkg: LogPackage, message: string, meta?: Record<string, unknown>) => 
    Log('backend', 'error', pkg, message, meta),
  fatal: (pkg: LogPackage, message: string, meta?: Record<string, unknown>) => 
    Log('backend', 'fatal', pkg, message, meta),
};

/**
 * Express middleware for automatic request/response logging
 */
export function requestLogger(req: any, res: any, next: any): void {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 400 ? 'error' : 'info';

    Log('backend', level as LogLevel, 'middleware', 
      `${req.method} ${req.path} ${res.statusCode} ${duration}ms`,
      {
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('user-agent'),
        ip: req.ip
      }
    );
  });

  next();
}

/**
 * Error logging middleware for uncaught exceptions
 */
export function errorLogger(err: Error, req?: any): void {
  Log('backend', 'error', 'middleware', err.message, {
    stack: err.stack,
    path: req?.path,
    method: req?.method,
    requestId: req?.requestId
  });
}

export default Log;
