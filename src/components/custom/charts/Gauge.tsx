import { useChartColors } from './use-chart-colors';

interface GaugeProps {
  value: number;
  label?: string;
  maxValue?: number;
  className?: string;
}

export function Gauge({ value, label, maxValue = 100, className }: GaugeProps) {
  const chartColors = useChartColors();
  const clampedValue = Math.min(Math.max(value, 0), maxValue);
  const percent = clampedValue / maxValue;

  // Semi-circle arc: 180 degrees
  const radius = 60;
  const strokeWidth = 14;
  const cx = 80;
  const cy = 75;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = Math.PI * normalizedRadius;
  const offset = circumference * (1 - percent);

  const getColor = (): string => {
    if (percent >= 0.8) return chartColors[5]; // green
    if (percent >= 0.6) return chartColors[4]; // yellow/amber
    if (percent >= 0.4) return chartColors[3]; // teal/blue
    if (percent >= 0.2) return chartColors[2]; // blue
    return chartColors[1];
  };

  const arcPath = describeArc(cx, cy, normalizedRadius, 180, 0);

  return (
    <div className={className} style={{ width: 160 }}>
      <svg viewBox="0 0 160 90" className="w-full">
        {/* Background arc */}
        <path
          d={arcPath}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={arcPath}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
      </svg>
      <div className="text-center -mt-2">
        <span className="text-xl font-bold text-foreground">
          {Math.round(clampedValue)}
        </span>
        {maxValue !== 100 && (
          <span className="text-sm text-muted-foreground">
            /{maxValue}
          </span>
        )}
        {label && (
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Describes an SVG arc path from startAngle to endAngle (degrees, 0=right, CW).
 * For semi-circle: startAngle=180 (left) to endAngle=0 (right).
 */
function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy - r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy - r * Math.sin(endRad);

  return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
}
