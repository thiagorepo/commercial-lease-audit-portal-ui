import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/custom/PageHeader';
import { calendarEvents } from '@/data/mock';
import { Link } from 'react-router-dom';
import type { EventType } from '@/types';

const eventColors: Record<EventType, string> = {
  renewal: 'bg-success-500',
  escalation: 'bg-warning-500',
  expiration: 'bg-error-500',
  deadline: 'bg-primary',
  audit: 'bg-secondary-500',
};

const eventBgColors: Record<EventType, string> = {
  renewal: 'bg-success-50 text-success-700 border-success-200',
  escalation: 'bg-warning-50 text-warning-700 border-warning-100',
  expiration: 'bg-error-50 text-error-700 border-error-200',
  deadline: 'bg-primary/10 text-primary border-primary/30',
  audit: 'bg-secondary-100 text-secondary-600 border-secondary-200',
};

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [activeFilters, setActiveFilters] = useState<Set<EventType>>(new Set(['renewal', 'escalation', 'expiration', 'deadline', 'audit']));
  const [activeDate, setActiveDate] = useState<string | null>(null);

  const toggleFilter = (type: EventType) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const filteredEvents = calendarEvents.filter(e => activeFilters.has(e.type as EventType));

  const getEventsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredEvents.filter(e => e.date === dateStr);
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      <PageHeader title="Calendar" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/overview' }, { label: 'Calendar' }]} />

      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {(['renewal', 'escalation', 'expiration', 'deadline', 'audit'] as EventType[]).map(type => (
          <label key={type} className="flex items-center gap-2 cursor-pointer">
            <div className={`w-3 h-3 rounded-full ${eventColors[type]} ${!activeFilters.has(type) ? 'opacity-30' : ''}`} />
            <input type="checkbox" className="sr-only" checked={activeFilters.has(type)} onChange={() => toggleFilter(type)} />
            <span className="text-sm text-muted-foreground capitalize">{type}</span>
          </label>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-accent rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h2 className="text-base font-semibold text-foreground">{monthName}</h2>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-accent rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-border">
          {weekdays.map(d => (
            <div key={d} className="text-center py-2 text-xs font-semibold text-muted-foreground uppercase">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`empty-${i}`} className="min-h-[90px] border-b border-r border-border/50 bg-muted/50" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = getEventsForDate(day);
            const today = new Date();
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

            return (
              <div
                key={day}
                className="min-h-[90px] border-b border-r border-border/50 p-1.5 hover:bg-accent transition-colors relative group"
                onMouseEnter={() => setActiveDate(dateStr)}
                onMouseLeave={() => setActiveDate(null)}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium mb-1 ${isToday ? 'bg-primary text-white' : 'text-foreground/80'}`}>
                  {day}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 2).map(ev => (
                    <div key={ev.id} className={`w-2 h-2 rounded-full ${eventColors[ev.type as EventType]} inline-block mr-0.5`} title={ev.title} />
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-xs text-muted-foreground/70">+{dayEvents.length - 2}</span>
                  )}
                </div>

                {activeDate === dateStr && dayEvents.length > 0 && (
                  <div className="absolute z-20 left-full top-0 ml-1 w-64 bg-card border border-border rounded-xl shadow-xl p-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">{new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    <div className="space-y-2">
                      {dayEvents.map(ev => (
                        <Link key={ev.id} to={`/leases/${ev.leaseId}`} className={`block p-2 rounded-lg border text-xs hover:opacity-80 transition-opacity ${eventBgColors[ev.type as EventType]}`}>
                          <p className="font-semibold">{ev.title.split(': ')[1] || ev.title}</p>
                          <p className="opacity-75 mt-0.5">{ev.leaseNumber}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 bg-card rounded-xl border border-border shadow-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">All Upcoming Events</h3>
        <div className="space-y-2">
          {filteredEvents.sort((a, b) => a.date.localeCompare(b.date)).map(ev => (
            <div key={ev.id} className={`flex items-start gap-3 p-3 rounded-lg border ${eventBgColors[ev.type as EventType]}`}>
              <div className="text-center w-12 shrink-0">
                <p className="text-xs font-bold uppercase">{new Date(ev.date).toLocaleDateString('en-US', { month: 'short' })}</p>
                <p className="text-xl font-bold leading-none">{new Date(ev.date).getDate()}</p>
                <p className="text-xs">{new Date(ev.date).getFullYear()}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{ev.title.split(': ')[1] || ev.title}</p>
                <p className="text-xs opacity-75 mt-0.5">{ev.description}</p>
                <Link to={`/leases/${ev.leaseId}`} className="text-xs font-medium underline mt-1 inline-block">{ev.leaseNumber}</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
