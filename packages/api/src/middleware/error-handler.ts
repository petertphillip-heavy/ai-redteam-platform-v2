import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { captureException } from '../config/sentry.js';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
    requestId?: string;
  };
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Use requestId from our middleware, or fallback to pino-http's id
  const requestId = req.requestId || (req.id !== undefined ? String(req.id) : 'unknown');

  const response: ErrorResponse = {
    success: false,
    error: {
      message: 'Internal server error',
      requestId,
    },
  };

  let statusCode = 500;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    response.error.message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    response.error.message = 'Validation error';
    response.error.details = err.flatten().fieldErrors;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    response.error.message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    response.error.message = 'Token expired';
  }

  // Log error with appropriate level
  const logContext = {
    requestId,
    statusCode,
    method: req.method,
    url: req.url,
    err,
  };

  if (statusCode >= 500) {
    logger.error(logContext, 'Server error');

    // Capture 5xx errors to Sentry with request context
    captureException(err, {
      requestId,
      method: req.method,
      url: req.url,
      statusCode,
      userId: (req as Request & { user?: { id: string } }).user?.id,
    });
  } else if (statusCode >= 400) {
    logger.warn(logContext, 'Client error');
  }

  if (env.NODE_ENV === 'development') {
    response.error.details = response.error.details || err.stack;
  }

  res.status(statusCode).json(response);
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      message: 'Endpoint not found',
    },
  });
}
