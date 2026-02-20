import { clsx } from 'clsx';
import { Skeleton, SkeletonCircle } from './Skeleton';

interface SkeletonStatsProps {
  className?: string;
}

export function SkeletonStats({ className }: SkeletonStatsProps) {
  return (
    <div
      className={clsx(
        'bg-white dark:bg-slate-800 rounded-lg shadow dark:shadow-slate-900/50 border border-gray-100 dark:border-slate-700 p-6',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <Skeleton width={20} height={20} rounded="sm" />
        <Skeleton height={20} width="50%" />
      </div>
      <Skeleton height={36} width={64} className="mt-2" />
    </div>
  );
}

interface SkeletonStatsGridProps {
  count?: number;
  className?: string;
}

export function SkeletonStatsGrid({ count = 4, className }: SkeletonStatsGridProps) {
  return (
    <div
      className={clsx(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStats key={i} />
      ))}
    </div>
  );
}

interface SkeletonStatCardWithIconProps {
  className?: string;
}

export function SkeletonStatCardWithIcon({ className }: SkeletonStatCardWithIconProps) {
  return (
    <div
      className={clsx(
        'bg-white dark:bg-slate-800 rounded-lg shadow dark:shadow-slate-900/50 border border-gray-100 dark:border-slate-700 p-6',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton height={14} width="40%" className="mb-2" />
          <Skeleton height={32} width={80} />
        </div>
        <SkeletonCircle size={48} />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Skeleton height={12} width={60} rounded="sm" />
        <Skeleton height={12} width={100} rounded="sm" />
      </div>
    </div>
  );
}
