import pino from 'pino';
import { env } from './env.js';

const isDevelopment = env.NODE_ENV === 'development';
const isTest = env.NODE_ENV === 'test';

// Configure log level based on environment
const getLogLevel = (): string => {
  if (isTest) return 'silent';
  if (isDevelopment) return 'debug';
  return 'info';
};

// Sensitive fields to redact from logs
const redactPaths = [
  'password',
  'token',
  'authorization',
  'req.headers.authorization',
  'req.body.password',
  'req.body.currentPassword',
  'req.body.newPassword',
  '*.password',
  '*.token',
  '*.authorization',
];

// Base logger configuration
const baseConfig: pino.LoggerOptions = {
  level: getLogLevel(),
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]',
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
};

// Development configuration with pretty printing
const developmentConfig: pino.LoggerOptions = {
  ...baseConfig,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
};

// Production configuration - JSON output for log aggregation
const productionConfig: pino.LoggerOptions = {
  ...baseConfig,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

// Create logger instance
const createLogger = (): pino.Logger => {
  try {
    if (isDevelopment) {
      // Try to use pino-pretty in development
      return pino(developmentConfig);
    }
    return pino(productionConfig);
  } catch {
    // Fallback to basic pino if pino-pretty is not available
    return pino(baseConfig);
  }
};

export const logger = createLogger();

// Create child logger with additional context
export const createChildLogger = (bindings: pino.Bindings): pino.Logger => {
  return logger.child(bindings);
};

export type Logger = pino.Logger;
