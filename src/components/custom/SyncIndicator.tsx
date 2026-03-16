import { useEffect, useState } from 'react';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

interface SyncIndicatorProps {
  status?: SyncStatus;
  lastSyncTime?: Date;
}

export function SyncIndicator({ status = 'idle', lastSyncTime }: SyncIndicatorProps) {
  const [displayStatus, setDisplayStatus] = useState<SyncStatus>(status);

  useEffect(() => {
    setDisplayStatus(status);
    if (status === 'success') {
      const timer = setTimeout(() => setDisplayStatus('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (displayStatus === 'idle') {
    return lastSyncTime ? (
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-1 rounded-full bg-accent/50">
        <Check className="w-3 h-3 text-success-600" />
        Synced {getRelativeTime(lastSyncTime)}
      </div>
    ) : null;
  }

  if (displayStatus === 'syncing') {
    return (
      <div className="flex items-center gap-2 text-xs text-foreground px-3 py-1 rounded-full bg-accent">
        <Loader2 className="w-3 h-3 animate-spin text-primary" />
        Syncing...
      </div>
    );
  }

  if (displayStatus === 'error') {
    return (
      <div className="flex items-center gap-2 text-xs text-error-600 px-3 py-1 rounded-full bg-error-50">
        <AlertCircle className="w-3 h-3" />
        Sync failed
      </div>
    );
  }

  if (displayStatus === 'success') {
    return (
      <div className="flex items-center gap-2 text-xs text-success-600 px-3 py-1 rounded-full bg-success-50">
        <Check className="w-3 h-3" />
        Synced
      </div>
    );
  }

  return null;
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
