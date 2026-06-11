/**
 * Why: Centralizes calendar event CRUD and auto-generation from lease data
 *      so callers don't duplicate date-arithmetic or event-emission logic.
 * What: Provides getUpcoming, getByLease, create, generateLeaseEvents, checkReminders.
 * Test: Mock supabase.from, verify each method returns CalendarEvent[] and emits events.
 */

import { supabase } from '@/lib/supabase';
import { eventBus } from '@/lib/event-bus';
import type { CalendarEvent, EventType } from '@/types';

const EVENTS_TABLE = 'calendar_events';
const LEASES_TABLE = 'leases';

const DEFAULT_NOTIFY_DAYS: Record<EventType, number> = {
  renewal: 90,
  escalation: 30,
  expiration: 180,
  deadline: 14,
  audit: 30,
};

interface CalendarEventRow {
  id: string;
  type: EventType;
  title: string;
  date: string;
  lease_id: string;
  lease_number: string;
  tenant_name: string;
  description: string;
  notify_days_before: number | null;
  created_at: string;
}

function toEvent(row: CalendarEventRow): CalendarEvent {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    date: row.date,
    leaseId: row.lease_id,
    leaseNumber: row.lease_number,
    tenantName: row.tenant_name,
    description: row.description,
    notifyDaysBefore: row.notify_days_before ?? undefined,
  };
}

function toRow(
  event: Omit<CalendarEvent, 'id'>,
): Omit<CalendarEventRow, 'id' | 'created_at'> {
  return {
    type: event.type,
    title: event.title,
    date: event.date,
    lease_id: event.leaseId,
    lease_number: event.leaseNumber,
    tenant_name: event.tenantName,
    description: event.description,
    notify_days_before: event.notifyDaysBefore ?? null,
  };
}

export const calendarService = {
  /**
   * Why: Powers the upcoming-events widget and calendar page with a date-bounded query.
   * What: Fetches events from today up to N days ahead (default 90).
   * Test: Mock supabase.from, assert returned events fall within the date range.
   */
  async getUpcoming(days: number = 90): Promise<CalendarEvent[]> {
    const from = new Date().toISOString().split('T')[0];
    const toDate = new Date();
    toDate.setDate(toDate.getDate() + days);
    const to = toDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from(EVENTS_TABLE)
      .select('*')
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data as CalendarEventRow[]).map(toEvent);
  },

  /**
   * Why: Shows lease-specific events on the lease detail page.
   * What: Fetches all events for a given lease ordered by date.
   * Test: Mock supabase.from, assert all returned events have the correct leaseId.
   */
  async getByLease(leaseId: string): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from(EVENTS_TABLE)
      .select('*')
      .eq('lease_id', leaseId)
      .order('date', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data as CalendarEventRow[]).map(toEvent);
  },

  /**
   * Why: Allows manual event creation for one-off reminders.
   * What: Inserts a new calendar_events row and returns the created event.
   * Test: Mock supabase.from, assert returned event matches input shape.
   */
  async create(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    const row = toRow(event);
    const { data, error } = await supabase
      .from(EVENTS_TABLE)
      .insert(row)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const created = toEvent(data as CalendarEventRow);
    eventBus.emit('calendar.created', created);
    return created;
  },

  /**
   * Why: Eliminates manual event entry by deriving renewal, escalation, and expiration
   *      events from lease start/end dates so the calendar stays current automatically.
   * What: Queries a lease, generates standard events, bulk-inserts them.
   * Test: Insert a lease row, call generateLeaseEvents, assert 3+ events created.
   */
  async generateLeaseEvents(leaseId: string): Promise<CalendarEvent[]> {
    const { data: lease, error: leaseError } = await supabase
      .from(LEASES_TABLE)
      .select('id, tenant_name, lease_start, lease_end')
      .eq('id', leaseId)
      .single();

    if (leaseError || !lease) {
      throw new Error(leaseError?.message ?? `Lease ${leaseId} not found`);
    }

    const l = lease as {
      id: string;
      tenant_name: string;
      lease_start: string;
      lease_end: string;
    };

    const events: Omit<CalendarEvent, 'id'>[] = [];
    const tenantName = l.tenant_name;
    const endDate = new Date(l.lease_end);
    const startDate = new Date(l.lease_start);

    events.push({
      type: 'expiration',
      title: `Lease Expiration: ${tenantName}`,
      date: l.lease_end.split('T')[0],
      leaseId,
      leaseNumber: leaseId,
      tenantName,
      description: `Lease expires on ${l.lease_end.split('T')[0]}`,
      notifyDaysBefore: DEFAULT_NOTIFY_DAYS.expiration,
    });

    events.push({
      type: 'renewal',
      title: `Renewal Deadline: ${tenantName}`,
      date: new Date(endDate.getTime() - DEFAULT_NOTIFY_DAYS.renewal * 86_400_000)
        .toISOString()
        .split('T')[0],
      leaseId,
      leaseNumber: leaseId,
      tenantName,
      description: `Renewal decision due before lease expiration`,
      notifyDaysBefore: DEFAULT_NOTIFY_DAYS.renewal,
    });

    const escalationDate = new Date(startDate);
    escalationDate.setFullYear(escalationDate.getFullYear() + 1);
    if (escalationDate < endDate) {
      events.push({
        type: 'escalation',
        title: `Rent Escalation: ${tenantName}`,
        date: escalationDate.toISOString().split('T')[0],
        leaseId,
        leaseNumber: leaseId,
        tenantName,
        description: `Annual rent escalation takes effect`,
        notifyDaysBefore: DEFAULT_NOTIFY_DAYS.escalation,
      });
    }

    const rows = events.map(toRow);
    const { data, error } = await supabase
      .from(EVENTS_TABLE)
      .insert(rows)
      .select('*');

    if (error) {
      throw new Error(error.message);
    }

    const created = (data as CalendarEventRow[]).map(toEvent);
    created.forEach((ev) => eventBus.emit('calendar.created', ev));
    return created;
  },

  /**
   * Why: Enables the notification dispatch pipeline by finding events whose
   *      notification window has opened (within notifyDaysBefore of today).
   * What: Fetches events where today is within the reminder window, emits per event.
   * Test: Insert an event with notifyDaysBefore=1 and date=tomorrow, call, assert 1 emitted.
   */
  async checkReminders(): Promise<CalendarEvent[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from(EVENTS_TABLE)
      .select('*')
      .gte('date', today)
      .order('date', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const allEvents = (data as CalendarEventRow[]).map(toEvent);
    const due = allEvents.filter((ev) => {
      const daysBefore = ev.notifyDaysBefore ?? DEFAULT_NOTIFY_DAYS[ev.type];
      const eventDate = new Date(ev.date);
      const reminderDate = new Date(eventDate.getTime() - daysBefore * 86_400_000);
      const todayDate = new Date(today);
      return reminderDate <= todayDate;
    });

    due.forEach((ev) => eventBus.emit('calendar.reminder', ev));
    return due;
  },
};
