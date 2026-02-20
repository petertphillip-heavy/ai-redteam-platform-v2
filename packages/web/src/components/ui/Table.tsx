import { clsx } from 'clsx';
import { useId } from 'react';

type SortDirection = 'ascending' | 'descending' | 'none';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
  sortDirection?: SortDirection;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  onSort?: (columnKey: string) => void;
  emptyMessage?: string;
  loading?: boolean;
  caption?: string;
  captionHidden?: boolean;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  onSort,
  emptyMessage = 'No data available',
  loading,
  caption,
  captionHidden = false,
}: TableProps<T>) {
  const captionId = useId();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-label="Loading data">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400" aria-hidden="true" />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400" role="status">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table
        className="min-w-full divide-y divide-gray-200 dark:divide-slate-700"
        aria-labelledby={caption ? captionId : undefined}
      >
        {caption && (
          <caption
            id={captionId}
            className={clsx(
              'text-left text-sm text-gray-500 dark:text-gray-400 pb-2',
              captionHidden && 'sr-only'
            )}
          >
            {caption}
          </caption>
        )}
        <thead className="bg-gray-50 dark:bg-slate-800">
          <tr>
            {columns.map((col) => {
              const isSortable = col.sortable && onSort;
              const sortDirection = col.sortDirection;

              return (
                <th
                  key={col.key}
                  scope="col"
                  className={clsx(
                    'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                    isSortable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 select-none',
                    col.className
                  )}
                  aria-sort={sortDirection === 'ascending' ? 'ascending' : sortDirection === 'descending' ? 'descending' : undefined}
                  onClick={isSortable ? () => onSort(col.key) : undefined}
                  onKeyDown={
                    isSortable
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSort(col.key);
                          }
                        }
                      : undefined
                  }
                  tabIndex={isSortable ? 0 : undefined}
                  role={isSortable ? 'button' : undefined}
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {isSortable && (
                      <span aria-hidden="true" className="text-gray-400">
                        {sortDirection === 'ascending' && ' ^'}
                        {sortDirection === 'descending' && ' v'}
                        {sortDirection === 'none' && ' -'}
                      </span>
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
          {data.map((item) => {
            const rowKey = keyExtractor(item);
            const isClickable = Boolean(onRowClick);

            return (
              <tr
                key={rowKey}
                onClick={isClickable ? () => onRowClick!(item) : undefined}
                onKeyDown={
                  isClickable
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick!(item);
                        }
                      }
                    : undefined
                }
                tabIndex={isClickable ? 0 : undefined}
                role={isClickable ? 'button' : undefined}
                className={clsx(
                  'transition-colors',
                  isClickable && 'hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer focus:outline-none focus:bg-gray-50 dark:focus:bg-slate-700/50'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={clsx('px-4 py-3 text-sm text-gray-900 dark:text-gray-200', col.className)}
                  >
                    {col.render
                      ? col.render(item)
                      : (item as Record<string, unknown>)[col.key] as React.ReactNode}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <nav
      aria-label="Pagination navigation"
      className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-slate-700"
    >
      <div className="text-sm text-gray-500 dark:text-gray-400" aria-live="polite">
        Showing {start} to {end} of {total} results
      </div>
      <div className="flex gap-1" role="group" aria-label="Pagination controls">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Go to previous page"
          className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
        >
          Previous
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (page <= 3) {
            pageNum = i + 1;
          } else if (page >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = page - 2 + i;
          }
          const isCurrentPage = page === pageNum;
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              aria-label={`Go to page ${pageNum}`}
              aria-current={isCurrentPage ? 'page' : undefined}
              className={clsx(
                'px-3 py-1 text-sm rounded border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800',
                isCurrentPage
                  ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
                  : 'border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
              )}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Go to next page"
          className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
