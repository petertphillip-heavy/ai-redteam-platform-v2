import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
  className?: string;
}

/**
 * Full-page loading component for lazy loaded pages.
 * Shows a centered spinner with loading text.
 * Supports dark mode via Tailwind CSS classes.
 */
export function PageLoader({ message = 'Loading...', className }: PageLoaderProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]',
        'bg-gray-100 dark:bg-slate-900',
        'transition-colors duration-200',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin" />
      <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-400">
        {message}
      </p>
    </div>
  );
}

export default PageLoader;
