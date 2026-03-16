import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface VarianceIndicatorProps {
  amount: number;
  percent?: number;
  showPercent?: boolean;
  size?: 'sm' | 'md';
}

export function VarianceIndicator({ amount, percent, showPercent = true, size = 'md' }: VarianceIndicatorProps) {
  const isNeutral = Math.abs(amount) < 100;
  const isFavorable = amount < 0;

  let className: string;
  let Icon: typeof TrendingUp;

  if (isNeutral) {
    className = 'bg-muted text-muted-foreground border-border';
    Icon = Minus;
  } else if (isFavorable) {
    className = 'bg-success-50 text-success-700 border-success-200';
    Icon = TrendingDown;
  } else {
    className = 'bg-error-50 text-error-700 border-error-200';
    Icon = TrendingUp;
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-medium whitespace-nowrap',
      size === 'sm' ? 'text-xs' : 'text-sm',
      className
    )}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{formatCurrency(Math.abs(amount))}</span>
      {showPercent && percent !== undefined && (
        <span className="opacity-75">({formatPercent(percent)})</span>
      )}
    </span>
  );
}
