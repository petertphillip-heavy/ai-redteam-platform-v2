import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { ToastType } from '../contexts/ToastContext';

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  onDismiss: (id: string) => void;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5" />,
  error: <XCircle className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
};

const variants: Record<ToastType, string> = {
  success: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
  info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
};

const iconColors: Record<ToastType, string> = {
  success: 'text-green-500 dark:text-green-400',
  error: 'text-red-500 dark:text-red-400',
  warning: 'text-yellow-500 dark:text-yellow-400',
  info: 'text-blue-500 dark:text-blue-400',
};

const dismissButtonColors: Record<ToastType, string> = {
  success: 'text-green-500 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/50',
  error: 'text-red-500 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/50',
  warning: 'text-yellow-500 hover:text-yellow-700 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:text-yellow-300 dark:hover:bg-yellow-900/50',
  info: 'text-blue-500 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/50',
};

export function Toast({ id, type, message, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const enterTimeout = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    return () => clearTimeout(enterTimeout);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    // Wait for exit animation to complete
    setTimeout(() => {
      onDismiss(id);
    }, 200);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={clsx(
        'flex items-start gap-3 w-full max-w-sm p-4 border rounded-lg shadow-lg transition-all duration-200 ease-out',
        variants[type],
        {
          'translate-x-0 opacity-100': isVisible && !isExiting,
          'translate-x-full opacity-0': !isVisible || isExiting,
        }
      )}
    >
      <span className={clsx('flex-shrink-0', iconColors[type])}>
        {icons[type]}
      </span>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={handleDismiss}
        className={clsx(
          'flex-shrink-0 p-1 rounded-lg transition-colors',
          dismissButtonColors[type]
        )}
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
