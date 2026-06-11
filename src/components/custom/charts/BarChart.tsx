import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';
import { useChartColors, type ChartColorIndex } from './use-chart-colors';

interface BarChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartDataPoint[];
  height?: number;
  stacked?: boolean;
  className?: string;
}

export function BarChart({
  data,
  height = 300,
  stacked = false,
  className,
}: BarChartProps) {
  const chartColors = useChartColors();

  const getColor = (index: number, customColor?: string): string => {
    if (customColor) return customColor;
    const key = ((index % 5) + 1) as ChartColorIndex;
    return chartColors[key];
  };

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-border"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--popover)',
              borderColor: 'var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--popover-foreground)',
              fontSize: 12,
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} stackId={stacked ? 'stack' : undefined}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={getColor(index, entry.color)} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
