import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import { useChartColors } from './use-chart-colors';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function Sparkline({
  data,
  width = 80,
  height = 32,
  color,
  className,
}: SparklineProps) {
  const chartColors = useChartColors();
  const strokeColor = color ?? chartColors[1];

  const chartData = data.map((value, index) => ({ value, index }));
  const gradientId = `sparkGrad-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div
      className={cn('inline-block', className)}
      style={{ width, height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.2} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
