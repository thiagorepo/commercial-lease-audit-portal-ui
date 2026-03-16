import { cn } from '@/lib/utils';
import type { LeaseStatus, DiscrepancyStatus, CAMStatus, ReportStatus, DiscrepancyPriority } from '@/types';

type AnyStatus = LeaseStatus | DiscrepancyStatus | CAMStatus | ReportStatus | string;

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-success-50 text-success-700 border-success-200' },
  expired: { label: 'Expired', className: 'bg-secondary-100 text-secondary-600 border-secondary-200' },
  pending: { label: 'Pending', className: 'bg-warning-50 text-warning-700 border-warning-100' },
  terminated: { label: 'Terminated', className: 'bg-error-50 text-error-700 border-error-200' },
  open: { label: 'Open', className: 'bg-primary/10 text-primary border-primary/30' },
  'in-review': { label: 'In Review', className: 'bg-warning-50 text-warning-700 border-warning-100' },
  resolved: { label: 'Resolved', className: 'bg-success-50 text-success-700 border-success-200' },
  recovered: { label: 'Recovered', className: 'bg-success-50 text-success-700 border-success-200' },
  dismissed: { label: 'Dismissed', className: 'bg-secondary-100 text-secondary-500 border-secondary-200' },
  'false-positive': { label: 'False Positive', className: 'bg-secondary-100 text-secondary-500 border-secondary-200' },
  draft: { label: 'Draft', className: 'bg-secondary-100 text-secondary-600 border-secondary-200' },
  submitted: { label: 'Submitted', className: 'bg-primary/10 text-primary border-primary/30' },
  approved: { label: 'Approved', className: 'bg-success-50 text-success-700 border-success-200' },
  finalized: { label: 'Finalized', className: 'bg-success-50 text-success-700 border-success-200' },
  rejected: { label: 'Rejected', className: 'bg-error-50 text-error-700 border-error-200' },
  reviewed: { label: 'Reviewed', className: 'bg-primary/10 text-primary border-primary/30' },
  final: { label: 'Final', className: 'bg-success-50 text-success-700 border-success-200' },
  distributed: { label: 'Distributed', className: 'bg-success-50 text-success-700 border-success-200' },
  archived: { label: 'Archived', className: 'bg-secondary-100 text-secondary-500 border-secondary-200' },
  paid: { label: 'Paid', className: 'bg-success-50 text-success-700 border-success-200' },
  overdue: { label: 'Overdue', className: 'bg-error-50 text-error-700 border-error-200' },
  disputed: { label: 'Disputed', className: 'bg-warning-50 text-warning-700 border-warning-100' },
  completed: { label: 'Completed', className: 'bg-success-50 text-success-700 border-success-200' },
  processing: { label: 'Processing', className: 'bg-primary/10 text-primary border-primary/30' },
  failed: { label: 'Failed', className: 'bg-error-50 text-error-700 border-error-200' },
};

interface StatusBadgeProps {
  status: AnyStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    className: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}

const priorityConfig: Record<DiscrepancyPriority, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-secondary-100 text-secondary-600 border-secondary-200' },
  medium: { label: 'Medium', className: 'bg-warning-50 text-warning-700 border-warning-100' },
  high: { label: 'High', className: 'bg-warning-50 text-warning-700 border-warning-100' },
  urgent: { label: 'Urgent', className: 'bg-error-50 text-error-700 border-error-200' },
};

interface PriorityBadgeProps {
  priority: DiscrepancyPriority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}

interface CAMTypeBadgeProps {
  type: string;
  className?: string;
}

const camTypeLabels: Record<string, string> = {
  'gross': 'Gross',
  'net': 'Net',
  'modified-gross': 'Modified Gross',
  'triple-net': 'Triple Net',
  'base-year': 'Base Year',
};

export function CAMTypeBadge({ type, className }: CAMTypeBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/30',
      className
    )}>
      {camTypeLabels[type] || type}
    </span>
  );
}
