import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import { useChartColors, type ChartColorIndex } from './use-chart-colors';

interface PieChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieChartDataPoint[];
  height?: number;
  className?: string;
}

export function PieChart({
  data,
  height = 300,
  className,
}: PieChartProps) {
  const chartColors = useChartColors();

  const getColor = (index: number, customColor?: string): string => {
    if (customColor) return customColor;
    const key = ((index % 5) + 1) as ChartColorIndex;
    return chartColors[key];
  };

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="45%"
            outerRadius="75%"
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={getColor(index, entry.color)} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--popover)',
              borderColor: 'var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--popover-foreground)',
              fontSize: 12,
            }}
          />
          <Legend
            formatter={(value: string) => (
              <span style={{ color: 'var(--foreground)', fontSize: 12 }}>
                {value}
              </span>
            )}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
