import * as Sentry from '@sentry/node';
import { env } from './env.js';

const SENTRY_DSN = process.env.SENTRY_DSN;

/**
 * Initialize Sentry for error tracking
 * Only initializes if SENTRY_DSN environment variable is set
 */
export function initSentry(): void {
  if (!SENTRY_DSN) {
    console.log('Sentry DSN not configured, skipping Sentry initialization');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: env.NODE_ENV,
    release: `@trilogyworks/api@1.0.0`,

    // Set sample rate for transactions (performance monitoring)
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Set sample rate for errors
    sampleRate: 1.0,

    // Only send errors in production by default
    enabled: env.NODE_ENV === 'production' || !!SENTRY_DSN,

    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });

  console.log(`Sentry initialized for environment: ${env.NODE_ENV}`);
}

/**
 * Capture an exception to Sentry with additional context
 */
export function captureException(
  error: Error,
  context?: {
    requestId?: string;
    userId?: string;
    method?: string;
    url?: string;
    statusCode?: number;
  }
): void {
  if (!SENTRY_DSN) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      if (context.requestId) {
        scope.setTag('requestId', context.requestId);
      }
      if (context.userId) {
        scope.setUser({ id: context.userId });
      }
      if (context.method) {
        scope.setTag('method', context.method);
      }
      if (context.url) {
        scope.setTag('url', context.url);
      }
      if (context.statusCode) {
        scope.setTag('statusCode', context.statusCode.toString());
      }
    }

    Sentry.captureException(error);
  });
}

export { Sentry };
