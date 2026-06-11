import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import { useChartColors } from './use-chart-colors';

interface LineChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
}

interface LineChartProps {
  data: LineChartDataPoint[];
  height?: number;
  color?: string;
  className?: string;
}

export function LineChart({
  data,
  height = 300,
  color,
  className,
}: LineChartProps) {
  const chartColors = useChartColors();
  const strokeColor = color ?? chartColors[1];

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-border"
            vertical={false}
          />
          <XAxis
            dataKey="x"
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
            labelFormatter={(label, payload) => {
              const entry = payload?.[0];
              const customLabel = entry && 'payload' in entry
                ? (entry.payload as LineChartDataPoint | undefined)?.label
                : undefined;
              return customLabel ?? String(label);
            }}
          />
          <Line
            type="monotone"
            dataKey="y"
            stroke={strokeColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: strokeColor }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
