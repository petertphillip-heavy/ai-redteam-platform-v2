import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

/**
 * Initialize Sentry for error tracking in the browser
 * Only initializes if VITE_SENTRY_DSN environment variable is set
 */
export function initSentry(): void {
  if (!SENTRY_DSN) {
    console.log('Sentry DSN not configured, skipping Sentry initialization');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: `@trilogyworks/web@1.0.0`,

    // Enable browser tracing for performance monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Mask all text and block all media for privacy
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Set sample rate for transactions (performance monitoring)
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

    // Set sample rate for session replays
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Only send errors in production by default
    enabled: import.meta.env.PROD || !!SENTRY_DSN,
  });

  console.log(`Sentry initialized for environment: ${import.meta.env.MODE}`);
}

/**
 * Capture an exception to Sentry with additional context
 */
export function captureException(
  error: Error,
  context?: {
    componentStack?: string;
    extra?: Record<string, unknown>;
  }
): void {
  if (!SENTRY_DSN) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.componentStack) {
      scope.setExtra('componentStack', context.componentStack);
    }
    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    Sentry.captureException(error);
  });
}

export { Sentry };
