import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { themeColors } from '@/lib/colors';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface StatCardProps {
  label: string;
  value: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    positive?: boolean;
  };
  sparkline?: number[];
  className?: string;
}

export function StatCard({ label, value, trend, sparkline, className }: StatCardProps) {
  const sparkData = sparkline?.map((v, i) => ({ v, i }));
  const isPositive = trend ? (trend.positive !== undefined ? trend.positive : trend.direction === 'up') : null;

  return (
    <div className={cn('bg-card rounded-xl border border-border p-5 shadow-card', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground font-medium truncate">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1 truncate">{value}</p>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-1.5 text-xs font-medium',
              isPositive ? 'text-success-600' : 'text-error-600'
            )}>
              {trend.direction === 'up'
                ? <TrendingUp className="w-3.5 h-3.5" />
                : <TrendingDown className="w-3.5 h-3.5" />
              }
              <span>{trend.value > 0 ? '+' : ''}{trend.value}% vs last period</span>
            </div>
          )}
        </div>
        {sparkData && sparkData.length > 0 && (
          <div className="w-20 h-12 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={themeColors.primary[500]} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={themeColors.primary[500]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={themeColors.primary[500]}
                  strokeWidth={1.5}
                  fill="url(#sparkGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
