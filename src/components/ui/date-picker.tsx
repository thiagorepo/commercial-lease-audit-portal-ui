import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDate } from '@/lib/utils';

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date>(value || new Date());

  const handleSelectDate = (day: number) => {
    const newDate = new Date(month.getFullYear(), month.getMonth(), day);
    onChange?.(newDate);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setMonth(new Date(month.getFullYear(), month.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + 1));
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const days = Array.from({ length: getDaysInMonth(month) }, (_, i) => i + 1);
  const firstDay = getFirstDayOfMonth(month);
  const paddedDays = Array(firstDay).fill(null).concat(days);

  const monthName = month.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          disabled={disabled}
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? formatDate(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-accent rounded-md"
            >
              ←
            </button>
            <div className="font-medium text-sm">{monthName}</div>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-accent rounded-md"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="w-8 h-8 flex items-center justify-center text-xs font-semibold text-muted-foreground">
                {day[0]}
              </div>
            ))}
            {paddedDays.map((day, idx) => (
              <button
                key={idx}
                disabled={!day}
                onClick={() => day && handleSelectDate(day)}
                className={cn(
                  'w-8 h-8 rounded-md text-sm transition-colors',
                  !day && 'invisible',
                  day && value && value.getDate() === day && value.getMonth() === month.getMonth()
                    ? 'bg-primary text-white'
                    : day && 'hover:bg-accent'
                )}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
