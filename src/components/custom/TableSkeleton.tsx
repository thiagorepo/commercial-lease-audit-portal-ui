import { cn } from '@/lib/utils';

interface Props {
  rows?: number;
  cols?: number;
  className?: string;
}

function SkeletonCell({ width }: { width?: string }) {
  return (
    <div className={cn('h-4 rounded-md bg-muted animate-pulse', width || 'w-24')} />
  );
}

export function TableSkeleton({ rows = 8, cols = 6, className }: Props) {
  const colWidths = ['w-20', 'w-32', 'w-28', 'w-24', 'w-16', 'w-20', 'w-16', 'w-10'];

  return (
    <div className={cn('bg-card rounded-xl border border-border shadow-card overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted border-b border-border">
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className={cn('h-3 rounded-md bg-muted animate-pulse', colWidths[i % colWidths.length])} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, ri) => (
              <tr key={ri} className="border-b border-border/30">
                {Array.from({ length: cols }).map((_, ci) => (
                  <td key={ci} className="px-4 py-3.5">
                    <SkeletonCell width={colWidths[ci % colWidths.length]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-card rounded-xl border border-border shadow-card p-5 space-y-3 animate-pulse', className)}>
      <div className="h-4 w-24 bg-muted rounded-md" />
      <div className="h-8 w-32 bg-muted rounded-md" />
      <div className="h-3 w-16 bg-muted rounded-md" />
    </div>
  );
}

export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={cn('grid gap-4', count === 4 ? 'grid-cols-2 xl:grid-cols-4' : count === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2')}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
