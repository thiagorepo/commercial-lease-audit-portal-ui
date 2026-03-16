import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/utils';
import type { ActivityLogEntry, StatusHistoryEntry } from '@/types';

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  actor?: string;
  actorAvatar?: string;
  icon?: React.ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn('space-y-0', className)}>
      {items.map((item, i) => (
        <div key={item.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
              {item.icon || (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </div>
            {i < items.length - 1 && (
              <div className="w-0.5 flex-1 bg-muted my-1" />
            )}
          </div>
          <div className={cn('pb-4 flex-1 min-w-0', i % 2 === 0 ? '' : '')}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                )}
                {item.actor && (
                  <p className="text-xs text-muted-foreground/70 mt-0.5">{item.actor}</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground/70 whitespace-nowrap shrink-0">{formatDateTime(item.timestamp)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function activityToTimelineItems(entries: ActivityLogEntry[]): TimelineItem[] {
  return entries.map(e => ({
    id: e.id,
    title: `${e.entityType}: ${e.entityName}`,
    description: e.description,
    timestamp: e.createdAt,
    actor: e.userName,
  }));
}

export function statusHistoryToTimelineItems(entries: StatusHistoryEntry[]): TimelineItem[] {
  return entries.map((e, i) => ({
    id: `${e.changedAt}-${e.changedBy}-${i}`,
    title: `Status: ${e.status.charAt(0).toUpperCase() + e.status.slice(1).replace(/-/g, ' ')}`,
    description: e.note,
    timestamp: e.changedAt,
    actor: e.changedBy,
  }));
}
