import { cn } from '@/lib/utils';

interface ConfidenceMeterProps {
  value: number;
  label?: string;
  showLabel?: boolean;
}

export function ConfidenceMeter({ value, label, showLabel = true }: ConfidenceMeterProps) {
  const color = value >= 90 ? 'bg-success-500' : value >= 70 ? 'bg-warning-500' : 'bg-error-500';
  const textColor = value >= 90 ? 'text-success-700' : value >= 70 ? 'text-warning-700' : 'text-error-700';

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
          {showLabel && <span className={cn('text-xs font-semibold', textColor)}>{value}%</span>}
        </div>
      )}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
