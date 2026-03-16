import { Loader2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type SyncStatus = 'synced' | 'pending' | 'error' | 'idle';

interface SyncIndicatorProps {
  status?: SyncStatus;
  pendingCount?: number;
  lastSyncTime?: Date;
  className?: string;
}

const statusConfig: Record<SyncStatus, { icon: typeof Check; label: string; className: string; spin?: boolean }> = {
  synced: { icon: Check, label: 'Synced', className: 'text-success-600 bg-success-50' },
  pending: { icon: Loader2, label: 'Syncing', className: 'text-warning-600 bg-warning-50', spin: true },
  error: { icon: AlertCircle, label: 'Sync failed', className: 'text-error-600 bg-error-50' },
  idle: { icon: Check, label: 'No changes', className: 'text-muted-foreground bg-muted' },
};

function getRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function SyncIndicator({ status = 'idle', pendingCount = 0, lastSyncTime, className }: SyncIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      <Icon className={cn('w-3 h-3', config.spin && 'animate-spin')} />
      <span>
        {config.label}
        {status === 'synced' && lastSyncTime && ` ${getRelativeTime(lastSyncTime)}`}
      </span>
      {status === 'pending' && pendingCount > 0 && (
        <span className="px-1 bg-black/10 rounded">({pendingCount})</span>
      )}
    </div>
  );
}
