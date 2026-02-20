import { Suspense, Component, ReactNode, ComponentType, lazy } from 'react';
import { PageLoader } from './PageLoader';
import { captureException } from '../config/sentry';

// ============================================
// Error Boundary for Lazy Loaded Components
// ============================================

interface LazyErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface LazyErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary specifically designed for lazy loaded components.
 * Provides retry functionality when a chunk fails to load.
 */
export class LazyErrorBoundary extends Component<LazyErrorBoundaryProps, LazyErrorBoundaryState> {
  constructor(props: LazyErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): LazyErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('LazyErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo.componentStack);

    // Report to Sentry
    captureException(error, {
      componentStack: errorInfo.componentStack || undefined,
      extra: { type: 'lazy-load-error' },
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      // Default error fallback for lazy load failures
      return <LazyLoadErrorFallback error={error} onRetry={this.handleRetry} />;
    }

    return children;
  }
}

// ============================================
// Error Fallback Component
// ============================================

interface LazyLoadErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
}

function LazyLoadErrorFallback({ error, onRetry }: LazyLoadErrorFallbackProps) {
  const isChunkLoadError = error?.message?.includes('Loading chunk') ||
    error?.name === 'ChunkLoadError';

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]
                 bg-gray-100 dark:bg-slate-900 p-8"
      role="alert"
    >
      <div className="max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30
                        flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {isChunkLoadError ? 'Failed to Load Page' : 'Something Went Wrong'}
        </h2>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {isChunkLoadError
            ? 'There was a problem loading this page. This might be due to a network issue or the application was recently updated.'
            : error?.message || 'An unexpected error occurred while loading this page.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium
                       hover:bg-indigo-700 transition-colors
                       dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            Try Again
          </button>

          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium
                       hover:bg-gray-300 transition-colors
                       dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// LazyLoad Wrapper Component
// ============================================

interface LazyLoadProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingMessage?: string;
}

/**
 * Wrapper component that combines Suspense with ErrorBoundary for lazy loaded components.
 * Provides loading state and error handling out of the box.
 *
 * @example
 * ```tsx
 * const MyPage = lazy(() => import('./pages/MyPage'));
 *
 * <LazyLoad loadingMessage="Loading dashboard...">
 *   <MyPage />
 * </LazyLoad>
 * ```
 */
export function LazyLoad({ children, fallback, loadingMessage }: LazyLoadProps) {
  const loadingFallback = fallback || <PageLoader message={loadingMessage} />;

  return (
    <LazyErrorBoundary>
      <Suspense fallback={loadingFallback}>
        {children}
      </Suspense>
    </LazyErrorBoundary>
  );
}

// ============================================
// Utility: Create Lazy Component with Retry
// ============================================

type ComponentImport<T> = () => Promise<{ default: ComponentType<T> }>;

/**
 * Creates a lazy-loaded component with automatic retry on chunk load failure.
 * Useful for handling network issues or stale cached bundles after deployments.
 *
 * @example
 * ```tsx
 * const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
 * ```
 */
export function lazyWithRetry<T extends object>(
  importFn: ComponentImport<T>,
  retries = 3,
  delay = 1000
): React.LazyExoticComponent<ComponentType<T>> {
  return lazy(async () => {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await importFn();
      } catch (error) {
        lastError = error as Error;

        // Only retry on chunk load errors
        const isChunkError = lastError.message?.includes('Loading chunk') ||
          lastError.name === 'ChunkLoadError';

        if (!isChunkError || attempt === retries - 1) {
          throw lastError;
        }

        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));

        // Clear module cache to force fresh fetch
        // This helps when dealing with stale cached chunks
        console.warn(`Chunk load failed, retrying... (attempt ${attempt + 1}/${retries})`);
      }
    }

    throw lastError;
  });
}

export default LazyLoad;
