import { clsx } from 'clsx';
import { Skeleton, SkeletonText } from './Skeleton';

interface SkeletonCardProps {
  lines?: number;
  showTitle?: boolean;
  showSubtitle?: boolean;
  className?: string;
}

export function SkeletonCard({
  lines = 3,
  showTitle = true,
  showSubtitle = true,
  className,
}: SkeletonCardProps) {
  return (
    <div
      className={clsx(
        'bg-white dark:bg-slate-800 rounded-lg shadow dark:shadow-slate-900/50 border border-gray-100 dark:border-slate-700 p-6',
        className
      )}
    >
      {showTitle && (
        <Skeleton height={24} width="60%" className="mb-2" />
      )}
      {showSubtitle && (
        <Skeleton height={16} width="40%" className="mb-4" />
      )}
      <SkeletonText lines={lines} />
    </div>
  );
}

interface SkeletonCardListProps {
  count?: number;
  lines?: number;
  className?: string;
}

export function SkeletonCardList({
  count = 3,
  lines = 2,
  className,
}: SkeletonCardListProps) {
  return (
    <div className={clsx('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={lines} />
      ))}
    </div>
  );
}
