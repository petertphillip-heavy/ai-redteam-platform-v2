import { clsx } from 'clsx';
import { AlertOctagon, RefreshCw, MessageSquare } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ErrorFallbackProps {
  error: string;
  resetError: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const { isDark } = useTheme();

  return (
    <div
      className={clsx(
        'min-h-screen flex items-center justify-center p-4 transition-colors duration-200',
        isDark ? 'bg-slate-900' : 'bg-gray-100'
      )}
    >
      <div
        className={clsx(
          'max-w-md w-full rounded-lg shadow-lg border p-8 text-center',
          isDark
            ? 'bg-slate-800 border-slate-700 shadow-slate-900/50'
            : 'bg-white border-gray-100'
        )}
      >
        {/* Error Icon */}
        <div
          className={clsx(
            'mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6',
            isDark ? 'bg-red-500/10' : 'bg-red-50'
          )}
        >
          <AlertOctagon
            className={clsx(
              'w-8 h-8',
              isDark ? 'text-red-400' : 'text-red-500'
            )}
          />
        </div>

        {/* Title */}
        <h1
          className={clsx(
            'text-xl font-semibold mb-2',
            isDark ? 'text-white' : 'text-gray-900'
          )}
        >
          Something went wrong
        </h1>

        {/* Error Message */}
        <p
          className={clsx(
            'text-sm mb-6',
            isDark ? 'text-gray-400' : 'text-gray-500'
          )}
        >
          {error || 'An unexpected error occurred. Please try again.'}
        </p>

        {/* Error Details (collapsible for debugging) */}
        <details
          className={clsx(
            'text-left mb-6 rounded-lg overflow-hidden',
            isDark ? 'bg-slate-900' : 'bg-gray-50'
          )}
        >
          <summary
            className={clsx(
              'px-4 py-2 cursor-pointer text-sm font-medium',
              isDark
                ? 'text-gray-300 hover:bg-slate-800'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            Technical details
          </summary>
          <pre
            className={clsx(
              'px-4 py-3 text-xs overflow-auto max-h-32',
              isDark ? 'text-gray-400' : 'text-gray-600'
            )}
          >
            {error}
          </pre>
        </details>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetError}
            className={clsx(
              'inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
              'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
              isDark && 'bg-indigo-500 hover:bg-indigo-600 focus:ring-offset-slate-800'
            )}
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>

          <a
            href="https://github.com/trilogyworks/ai-redteam-platform/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(
              'inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
              isDark
                ? 'bg-slate-700 text-gray-100 hover:bg-slate-600 focus:ring-gray-500 focus:ring-offset-slate-800'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500'
            )}
          >
            <MessageSquare className="w-4 h-4" />
            Report Issue
          </a>
        </div>
      </div>
    </div>
  );
}
