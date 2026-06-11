import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventBus } from '@/lib/event-bus';

const { mockQuery } = vi.hoisted(() => {
  const mq: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
  };
  return { mockQuery: mq };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn().mockReturnValue(mockQuery) },
}));

import { discrepancyService } from '@/services/discrepancy.service';

describe('discrepancyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eventBus.clear();
    for (const key of Object.keys(mockQuery)) {
      if (key === 'single' || key === 'range') {
        mockQuery[key].mockImplementation(() => Promise.resolve({ data: null, error: null, count: 0 }));
      } else {
        mockQuery[key].mockReturnThis();
      }
    }
  });

  describe('list', () => {
    it('returns paginated results', async () => {
      const mockData = [
        { id: 'd1', category: 'rent_overcharge', variance: 500, status: 'open', priority: 'high', lease_id: 'l1', lease_number: 'L-001', description: '', expected_amount: 1000, actual_amount: 1500, created_at: '2024-01-01' },
      ];

      mockQuery.range.mockResolvedValueOnce({ data: mockData, error: null, count: 1 });

      const result = await discrepancyService.list({ page: 1, pageSize: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('returns empty result on error', async () => {
      mockQuery.range.mockResolvedValueOnce({ data: null, error: { message: 'fail' }, count: 0 });

      const result = await discrepancyService.list();

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('updateStatus', () => {
    it('emits discrepancy.status-changed event', async () => {
      const listener = vi.fn();
      eventBus.on('discrepancy.status-changed', listener);

      mockQuery.single.mockResolvedValueOnce({
        data: { id: 'd1', category: 'rent_overcharge', variance: 500, status: 'open', priority: 'high', lease_id: 'l1', lease_number: 'L-001', description: '', expected_amount: 1000, actual_amount: 1500, created_at: '2024-01-01' },
        error: null,
      });

      mockQuery.single.mockResolvedValueOnce({
        data: { id: 'd1', category: 'rent_overcharge', variance: 500, status: 'resolved', priority: 'high', lease_id: 'l1', lease_number: 'L-001', description: '', expected_amount: 1000, actual_amount: 1500, created_at: '2024-01-01' },
        error: null,
      });

      await discrepancyService.updateStatus('d1', 'resolved');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'd1', status: 'resolved' }),
      );
    });
  });
});
