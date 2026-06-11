import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventBus } from '@/lib/event-bus';

const { mockQuery } = vi.hoisted(() => {
  const mq: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
  };
  return { mockQuery: mq };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn().mockReturnValue(mockQuery) },
}));

import { calendarService } from '@/services/calendar.service';

describe('calendarService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eventBus.clear();
    for (const key of Object.keys(mockQuery)) {
      if (key === 'single') {
        mockQuery[key].mockImplementation(() => Promise.resolve({ data: null, error: null }));
      } else {
        mockQuery[key].mockReturnThis();
      }
    }
  });

  describe('getUpcoming', () => {
    it('returns ordered events', async () => {
      const mockEvents = [
        { id: 'e1', title: 'Lease Renewal', event_type: 'renewal', event_date: '2024-06-01', lease_id: 'l1', lease_number: 'L-001', days_until: 30, notify_days_before: 90, description: '', status: 'upcoming', created_at: '2024-01-01' },
      ];

      mockQuery.order.mockResolvedValueOnce({ data: mockEvents, error: null });

      const events = await calendarService.getUpcoming(30);
      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('Lease Renewal');
    });

    it('throws on error', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: null, error: { message: 'fail' } });

      await expect(calendarService.getUpcoming()).rejects.toThrow('fail');
    });
  });

  describe('create', () => {
    it('creates event and emits calendar.created', async () => {
      const listener = vi.fn();
      eventBus.on('calendar.created', listener);

      const mockRow = {
        id: 'e1', title: 'Test Event', event_type: 'deadline', event_date: '2024-07-01',
        lease_id: null, lease_number: null, days_until: 60, notify_days_before: 14,
        description: '', status: 'upcoming', created_at: '2024-01-01',
      };

      mockQuery.single.mockResolvedValueOnce({ data: mockRow, error: null });

      const event = await calendarService.create({
        title: 'Test Event',
        eventType: 'deadline',
        eventDate: '2024-07-01',
        notifyDaysBefore: 14,
      });

      expect(event).not.toBeNull();
      expect(event!.title).toBe('Test Event');
      expect(listener).toHaveBeenCalled();
    });
  });
});
