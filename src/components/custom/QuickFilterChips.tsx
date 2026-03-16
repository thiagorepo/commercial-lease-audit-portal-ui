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
  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1', className)}>
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
  );
}
