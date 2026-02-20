import { clsx } from 'clsx';
import type { Severity, FindingStatus, TestStatus, PayloadCategory } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
  /** When true, adds role="status" for screen readers */
  isStatus?: boolean;
  /** Accessible label for screen readers (overrides visible text) */
  'aria-label'?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className,
  isStatus = false,
  'aria-label': ariaLabel,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        {
          'px-2 py-0.5 text-xs': size === 'sm',
          'px-2.5 py-1 text-sm': size === 'md',
          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200': variant === 'default',
          'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300': variant === 'success',
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300': variant === 'warning',
          'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300': variant === 'danger',
          'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300': variant === 'info',
          'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300': variant === 'neutral',
        },
        className
      )}
      role={isStatus ? 'status' : undefined}
      aria-label={ariaLabel}
    >
      {children}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const variants: Record<Severity, 'danger' | 'warning' | 'info' | 'neutral' | 'default'> = {
    CRITICAL: 'danger',
    HIGH: 'danger',
    MEDIUM: 'warning',
    LOW: 'info',
    INFO: 'neutral',
  };

  const ariaLabels: Record<Severity, string> = {
    CRITICAL: 'Critical severity',
    HIGH: 'High severity',
    MEDIUM: 'Medium severity',
    LOW: 'Low severity',
    INFO: 'Informational',
  };

  return (
    <Badge
      variant={variants[severity]}
      isStatus
      aria-label={ariaLabels[severity]}
    >
      {severity}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: FindingStatus }) {
  const variants: Record<FindingStatus, 'danger' | 'warning' | 'success' | 'info' | 'neutral'> = {
    OPEN: 'danger',
    IN_PROGRESS: 'warning',
    RESOLVED: 'success',
    ACCEPTED_RISK: 'info',
    FALSE_POSITIVE: 'neutral',
  };

  const labels: Record<FindingStatus, string> = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
    ACCEPTED_RISK: 'Accepted Risk',
    FALSE_POSITIVE: 'False Positive',
  };

  const ariaLabels: Record<FindingStatus, string> = {
    OPEN: 'Status: Open',
    IN_PROGRESS: 'Status: In Progress',
    RESOLVED: 'Status: Resolved',
    ACCEPTED_RISK: 'Status: Accepted Risk',
    FALSE_POSITIVE: 'Status: False Positive',
  };

  return (
    <Badge
      variant={variants[status]}
      isStatus
      aria-label={ariaLabels[status]}
    >
      {labels[status]}
    </Badge>
  );
}

export function TestStatusBadge({ status }: { status: TestStatus }) {
  const variants: Record<TestStatus, 'neutral' | 'info' | 'success' | 'danger' | 'warning'> = {
    PENDING: 'neutral',
    RUNNING: 'info',
    COMPLETED: 'success',
    FAILED: 'danger',
    CANCELLED: 'warning',
  };

  const ariaLabels: Record<TestStatus, string> = {
    PENDING: 'Test status: Pending',
    RUNNING: 'Test status: Running',
    COMPLETED: 'Test status: Completed',
    FAILED: 'Test status: Failed',
    CANCELLED: 'Test status: Cancelled',
  };

  return (
    <Badge
      variant={variants[status]}
      isStatus
      aria-label={ariaLabels[status]}
    >
      {status}
    </Badge>
  );
}

export function CategoryBadge({ category }: { category: PayloadCategory }) {
  const labels: Record<PayloadCategory, string> = {
    PROMPT_INJECTION: 'Prompt Injection',
    DATA_EXTRACTION: 'Data Extraction',
    GUARDRAIL_BYPASS: 'Guardrail Bypass',
    INTEGRATION_VULN: 'Integration Vuln',
  };

  const ariaLabels: Record<PayloadCategory, string> = {
    PROMPT_INJECTION: 'Category: Prompt Injection',
    DATA_EXTRACTION: 'Category: Data Extraction',
    GUARDRAIL_BYPASS: 'Category: Guardrail Bypass',
    INTEGRATION_VULN: 'Category: Integration Vulnerability',
  };

  const variants: Record<PayloadCategory, 'danger' | 'warning' | 'info' | 'neutral'> = {
    PROMPT_INJECTION: 'danger',
    DATA_EXTRACTION: 'warning',
    GUARDRAIL_BYPASS: 'info',
    INTEGRATION_VULN: 'neutral',
  };

  return (
    <Badge
      variant={variants[category]}
      aria-label={ariaLabels[category]}
    >
      {labels[category]}
    </Badge>
  );
}
