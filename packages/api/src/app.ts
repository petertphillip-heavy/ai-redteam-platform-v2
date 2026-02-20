// AI Red Team Platform API Server - v1.0.2
// Initialize Sentry at the very top, before other imports
import { initSentry, Sentry } from './config/sentry.js';
initSentry();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { requestLogger, requestIdMiddleware } from './middleware/request-logger.js';
import { router } from './routes/index.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - restrict to specific origins in production
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (healthchecks, mobile apps, curl, server-to-server)
    // This is safe because CORS is a browser security feature - non-browser clients
    // can always make requests regardless of CORS settings
    if (!origin) {
      return callback(null, true);
    }

    // In production, require origin to be in allowed list
    if (env.CORS_ORIGIN === '*') {
      // Only allow wildcard in development
      if (env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error('CORS not configured for production'));
    }

    const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Rate limiting - general API limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: {
    success: false,
    error: { message: 'Too many requests, please try again later' },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window per IP
  message: {
    success: false,
    error: { message: 'Too many authentication attempts, please try again later' },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiters
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging with pino
app.use(requestIdMiddleware);
app.use(requestLogger);

// Disable caching for API responses to prevent stale data issues
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Routes
app.use(router);

// Error handling
app.use(notFoundHandler);
// Sentry error handler should be before the custom error handler
Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, 'Starting graceful shutdown');
  await disconnectDatabase();
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(env.PORT, () => {
      logger.info({
        environment: env.NODE_ENV,
        port: env.PORT,
        apiVersion: env.API_VERSION,
        healthEndpoint: `http://localhost:${env.PORT}/health`,
      }, 'AI Red Team Platform API started');
    });
  } catch (error) {
    logger.fatal({ err: error }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();

export { app };
