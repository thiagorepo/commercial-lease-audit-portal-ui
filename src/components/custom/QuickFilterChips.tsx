import { useState } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterChip {
  value: string;
  label: string;
  count?: number;
}

interface QuickFilterChipsProps {
  chips: FilterChip[];
  selected: string;
  onChange: (value: string) => void;
  className?: string;
}

export function QuickFilterChips({ chips, selected, onChange, className }: QuickFilterChipsProps) {
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const activeCount = selected ? chips.filter(c => c.value === selected).length : 0;

  return (
    <div>
      {/* Mobile filter toggle - visible only on small screens */}
      <button
        onClick={() => setFiltersExpanded(!filtersExpanded)}
        className="md:hidden flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-muted rounded-lg w-full"
      >
        <Filter className="w-4 h-4" />
        <span>Filters{activeCount > 0 ? ` (${activeCount})` : ''}</span>
        <ChevronDown className={cn('w-4 h-4 ml-auto transition-transform', filtersExpanded && 'rotate-180')} />
      </button>

      {/* Chips - always visible on md+, toggleable on mobile */}
      <div className={cn('flex flex-wrap gap-2', !filtersExpanded && 'hidden md:flex')}>
        {chips.map((chip) => (
          <button
            key={chip.value}
            onClick={() => onChange(chip.value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border',
              selected === chip.value
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-primary'
            )}
          >
            <span>{chip.label}</span>
            {chip.count !== undefined && (
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full font-semibold',
                selected === chip.value
                  ? 'bg-card/20 text-white'
                  : 'bg-muted text-muted-foreground'
              )}>
                {chip.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
