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
  supabase: {
    from: vi.fn().mockReturnValue(mockQuery),
    storage: {
      from: vi.fn().mockReturnValue({
        remove: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://mock.url/file' } }),
      }),
    },
  },
}));

import { exportService } from '@/services/export.service';

describe('exportService', () => {
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

  describe('create', () => {
    it('creates an export job', async () => {
      const mockRow = {
        id: 'ex1', name: 'Report.pdf', type: 'report', format: 'pdf',
        status: 'pending', file_size: null, file_path: null,
        source_id: null, created_at: '2024-01-01', completed_at: null, error: null,
      };

      mockQuery.single.mockResolvedValueOnce({ data: mockRow, error: null });

      const job = await exportService.create({
        name: 'Report.pdf',
        type: 'report',
        format: 'pdf',
      });

      expect(job.id).toBe('ex1');
      expect(job.status).toBe('pending');
    });
  });

  describe('list', () => {
    it('returns paginated jobs', async () => {
      const mockRows = [
        { id: 'ex1', name: 'R1.pdf', type: 'report', format: 'pdf', status: 'completed', file_size: 1000, file_path: '/f.pdf', source_id: null, created_at: '2024-01-01', completed_at: '2024-01-02', error: null },
      ];

      mockQuery.range.mockResolvedValueOnce({ data: mockRows, error: null, count: 1 });

      const result = await exportService.list(1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('process', () => {
    it('processes export and emits completed event', async () => {
      const listener = vi.fn();
      eventBus.on('export.completed', listener);

      const currentRow = {
        id: 'ex1', name: 'R1.pdf', type: 'report', format: 'pdf',
        status: 'pending', file_size: null, file_path: null,
        source_id: null, created_at: '2024-01-01', completed_at: null, error: null,
      };

      mockQuery.single.mockResolvedValueOnce({ data: currentRow, error: null });

      mockQuery.single.mockResolvedValueOnce({
        data: { ...currentRow, status: 'completed', file_size: 500000, file_path: 'exports/ex1/report.pdf', completed_at: '2024-01-02' },
        error: null,
      });

      const job = await exportService.process('ex1');

      expect(job.status).toBe('completed');
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('deletes job and emits event', async () => {
      const listener = vi.fn();
      eventBus.on('export.deleted', listener);

      // First query: .select().eq().single()
      // eq must return this (default from beforeEach), single returns data
      mockQuery.single.mockResolvedValueOnce({
        data: { file_path: 'exports/ex1/report.pdf' },
        error: null,
      });

      // Second query: .delete().eq() — make eq thenable for the second call
      // First eq call: returns this (default mockReturnThis)
      // Second eq call: returns thenable
      mockQuery.eq.mockImplementationOnce(() => mockQuery); // first eq: select chain
      mockQuery.eq.mockImplementationOnce(() => {           // second eq: delete chain
        const result = { error: null };
        return {
          then: (resolve: (v: unknown) => unknown) => Promise.resolve(resolve(result)),
        };
      });

      await exportService.delete('ex1');

      expect(listener).toHaveBeenCalledWith({ id: 'ex1' });
    });
  });
});
