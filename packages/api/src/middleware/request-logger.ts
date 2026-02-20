import { randomUUID } from 'crypto';
import PinoHttp, { Options, HttpLogger, ReqId } from 'pino-http';
import { Request, Response, NextFunction } from 'express';
import { IncomingMessage, ServerResponse } from 'http';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

// Extend Express Request to include requestId as string
declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

// Generate unique request ID
const generateRequestId = (): string => randomUUID();

// pino-http options with proper typing
const pinoHttpOptions: Options<IncomingMessage, ServerResponse> = {
  logger,
  genReqId: (req: IncomingMessage): ReqId => {
    // Use existing request ID from header or generate new one
    const existingId = req.headers['x-request-id'];
    if (typeof existingId === 'string' && existingId) {
      return existingId;
    }
    return generateRequestId();
  },
  customProps: (req: IncomingMessage) => ({
    requestId: String(req.id),
  }),
  customLogLevel: (_req: IncomingMessage, res: ServerResponse, err?: Error) => {
    if (res.statusCode >= 500 || err) {
      return 'error';
    }
    if (res.statusCode >= 400) {
      return 'warn';
    }
    return 'info';
  },
  customSuccessMessage: (req: IncomingMessage, res: ServerResponse) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage: (req: IncomingMessage, res: ServerResponse, err: Error) => {
    return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
  },
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error',
    responseTime: 'responseTime',
  },
  serializers: {
    req: (req: IncomingMessage) => ({
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
        'x-request-id': req.headers['x-request-id'],
      },
    }),
    res: (res: ServerResponse) => ({
      statusCode: res.statusCode,
    }),
  },
  // Don't log in test environment
  autoLogging: env.NODE_ENV !== 'test',
};

// Create pino-http middleware - use default export
const pinoHttp = PinoHttp.default || PinoHttp;
export const requestLogger: HttpLogger<IncomingMessage, ServerResponse> = pinoHttp(pinoHttpOptions);

// Middleware to add request ID to response headers and Express request
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Generate request ID if not present (pino-http will set req.id later)
  const existingId = req.headers['x-request-id'];
  const requestId = typeof existingId === 'string' && existingId ? existingId : generateRequestId();

  // Store in custom property for easy access as string
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};

// Get request ID from request object (converts ReqId to string)
export const getRequestId = (req: Request): string => {
  // Prefer our string requestId, fallback to pino-http's id
  if (req.requestId) {
    return req.requestId;
  }
  if (req.id !== undefined) {
    return String(req.id);
  }
  return 'unknown';
};
