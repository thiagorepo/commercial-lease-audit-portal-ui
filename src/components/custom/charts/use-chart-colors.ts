import { useLayoutEffect, useState } from 'react';

const CHART_VARS = [
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
] as const;

export type ChartColorIndex = 1 | 2 | 3 | 4 | 5;

/**
 * Reads --chart-1 through --chart-5 CSS custom properties from the document
 * and returns them as resolved color strings. Re-renders on theme change.
 */
export function useChartColors(): Record<ChartColorIndex, string> {
  const [colors, setColors] = useState<Record<ChartColorIndex, string>>(() =>
    resolveChartColors()
  );

  useLayoutEffect(() => {
    setColors(resolveChartColors());

    const observer = new MutationObserver(() => {
      setColors(resolveChartColors());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return colors;
}

function resolveChartColors(): Record<ChartColorIndex, string> {
  const style = getComputedStyle(document.documentElement);

  return {
    1: style.getPropertyValue(CHART_VARS[0]).trim() || '#1d4ed8',
    2: style.getPropertyValue(CHART_VARS[1]).trim() || '#3b82f6',
    3: style.getPropertyValue(CHART_VARS[2]).trim() || '#0e6fa5',
    4: style.getPropertyValue(CHART_VARS[3]).trim() || '#d97706',
    5: style.getPropertyValue(CHART_VARS[4]).trim() || '#16a34a',
  };
}
