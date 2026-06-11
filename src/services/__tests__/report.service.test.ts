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
  };
  return { mockQuery: mq };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn().mockReturnValue(mockQuery) },
}));

import { reportService } from '@/services/report.service';

// Make mock query thenable so `await qb` works for report.list()
function makeThenable(resolved: unknown) {
  mockQuery.then = vi.fn().mockImplementation(
    (onFulfilled: (v: unknown) => unknown) => Promise.resolve(onFulfilled ? onFulfilled(resolved) : resolved),
  );
}

describe('reportService', () => {
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
    delete (mockQuery as Record<string, unknown>).then;
  });

  describe('create', () => {
    it('creates a report and emits report.created', async () => {
      const listener = vi.fn();
      eventBus.on('report.created', listener);

      const mockRow = {
        id: 'r1', title: 'Test Report', type: 'portfolio-summary', status: 'draft',
        portfolio_id: null, portfolio_name: null, lease_id: null, lease_name: null,
        period_start: '', period_end: '', discrepancy_count: 0, recovery_amount: 0,
        version: 1, created_by: 'current-user', created_at: '2024-01-01',
        executive_summary: '', findings: [], recommendations: [], methodology: '',
        appendix: [], comments: [],
        status_history: [{ status: 'draft', changed_by: 'current-user', changed_at: expect.any(String) }],
      };

      mockQuery.single.mockResolvedValueOnce({ data: mockRow, error: null });

      const report = await reportService.create({
        title: 'Test Report',
        type: 'portfolio-summary',
      });

      expect(report).not.toBeNull();
      expect(report!.title).toBe('Test Report');
      expect(report!.status).toBe('draft');
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ id: 'r1' }));
    });

    it('returns null on insert error', async () => {
      mockQuery.single.mockResolvedValueOnce({ data: null, error: { message: 'insert failed' } });

      const report = await reportService.create({ title: 'Fail', type: 'portfolio-summary' });
      expect(report).toBeNull();
    });
  });

  describe('list', () => {
    it('returns reports filtered by status', async () => {
      const mockRows = [
        { id: 'r1', title: 'R1', type: 'portfolio-summary', status: 'draft', created_at: '2024-01-01', portfolio_id: null, portfolio_name: null, lease_id: null, lease_name: null, period_start: '', period_end: '', discrepancy_count: 0, recovery_amount: 0, version: 1, created_by: '', executive_summary: '', findings: [], recommendations: [], methodology: '', appendix: [], comments: [], status_history: [] },
      ];

      makeThenable({ data: mockRows, error: null });

      const reports = await reportService.list({ status: 'draft' });

      expect(reports).toHaveLength(1);
      expect(reports[0].status).toBe('draft');
    });

    it('returns empty on error', async () => {
      makeThenable({ data: null, error: { message: 'fail' } });

      const reports = await reportService.list();
      expect(reports).toEqual([]);
    });
  });

  describe('getById', () => {
    it('returns null when not found', async () => {
      mockQuery.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

      const report = await reportService.getById('nonexistent');
      expect(report).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('updates status and emits event', async () => {
      const listener = vi.fn();
      eventBus.on('report.status-changed', listener);

      mockQuery.single.mockResolvedValueOnce({
        data: { status_history: [] },
        error: null,
      });

      const updatedRow = {
        id: 'r1', title: 'R1', type: 'portfolio-summary', status: 'in_review',
        portfolio_id: null, portfolio_name: null, lease_id: null, lease_name: null,
        period_start: '', period_end: '', discrepancy_count: 0, recovery_amount: 0,
        version: 1, created_by: 'user', created_at: '2024-01-01',
        executive_summary: '', findings: [], recommendations: [], methodology: '',
        appendix: [], comments: [],
        status_history: [{ status: 'in_review', changed_by: 'current-user', changed_at: expect.any(String) }],
      };

      mockQuery.single.mockResolvedValueOnce({ data: updatedRow, error: null });

      const report = await reportService.updateStatus('r1', 'in_review');

      expect(report!.status).toBe('in_review');
      expect(listener).toHaveBeenCalledWith({ id: 'r1', status: 'in_review' });
    });
  });

  describe('delete', () => {
    it('deletes and emits event', async () => {
      const listener = vi.fn();
      eventBus.on('report.deleted', listener);

      mockQuery.eq.mockResolvedValueOnce({ error: null });

      const result = await reportService.delete('r1');

      expect(result).toBe(true);
      expect(listener).toHaveBeenCalledWith({ id: 'r1' });
    });

    it('returns false on error', async () => {
      mockQuery.eq.mockResolvedValueOnce({ error: { message: 'fail' } });

      const result = await reportService.delete('r1');
      expect(result).toBe(false);
    });
  });
});
