import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  disabled,
  'aria-label': ariaLabel,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-lg transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'dark:focus:ring-offset-slate-800 dark:focus-visible:ring-offset-slate-800',
        {
          'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 focus-visible:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600': variant === 'primary',
          'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 focus-visible:ring-gray-500 dark:bg-slate-700 dark:text-gray-100 dark:hover:bg-slate-600': variant === 'secondary',
          'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 focus-visible:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600': variant === 'danger',
          'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 focus-visible:ring-gray-500 dark:text-gray-300 dark:hover:bg-slate-700': variant === 'ghost',
          'px-2.5 py-1.5 text-sm gap-1.5': size === 'sm',
          'px-4 py-2 text-sm gap-2': size === 'md',
          'px-6 py-3 text-base gap-2': size === 'lg',
        },
        className
      )}
      disabled={isDisabled}
      aria-busy={loading}
      aria-disabled={isDisabled}
      aria-label={loading && ariaLabel ? `${ariaLabel}, loading` : ariaLabel}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      ) : icon ? (
        <span aria-hidden="true">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
