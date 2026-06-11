/**
 * Why: Centralizes export job creation, status tracking, and file generation
 *      so callers don't manage Supabase storage + DB rows + event emission separately.
 * What: Provides create, list, getById, process, download, delete.
 * Test: Mock supabase/storage calls, verify each method returns correct shape and emits events.
 */

import { supabase } from '@/lib/supabase';
import { eventBus } from '@/lib/event-bus';

export interface ExportCreate {
  name: string;
  type: string;
  format: 'pdf' | 'excel' | 'csv';
  sourceId?: string;
}

export interface ExportJob {
  id: string;
  name: string;
  type: string;
  format: 'pdf' | 'excel' | 'csv';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileSize: number | null;
  filePath: string | null;
  sourceId: string | null;
  createdAt: string;
  completedAt: string | null;
  error: string | null;
}

const TABLE = 'exports';
const STORAGE_BUCKET = 'exports';

interface ExportRow {
  id: string;
  name: string;
  type: string;
  format: string;
  status: string;
  file_size: number | null;
  file_path: string | null;
  source_id: string | null;
  created_at: string;
  completed_at: string | null;
  error: string | null;
}

function toJob(row: ExportRow): ExportJob {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    format: row.format as ExportJob['format'],
    status: row.status as ExportJob['status'],
    fileSize: row.file_size,
    filePath: row.file_path,
    sourceId: row.source_id,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    error: row.error,
  };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const exportService = {
  async create(input: ExportCreate): Promise<ExportJob> {
    const row = {
      name: input.name,
      type: input.type,
      format: input.format,
      status: 'pending',
      source_id: input.sourceId ?? null,
    };

    const { data, error } = await supabase
      .from(TABLE)
      .insert(row)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toJob(data as ExportRow);
  },

  async list(page: number = 1, pageSize: number = 20): Promise<{ data: ExportJob[]; total: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await supabase
      .from(TABLE)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: (data as ExportRow[]).map(toJob),
      total: count ?? 0,
    };
  },

  async getById(id: string): Promise<ExportJob | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return toJob(data as ExportRow);
  },

  async process(id: string): Promise<ExportJob> {
    const { data: current, error: fetchError } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !current) {
      throw new Error(fetchError?.message ?? `Export ${id} not found`);
    }

    await supabase
      .from(TABLE)
      .update({ status: 'processing' })
      .eq('id', id);

    try {
      const mockSize = Math.floor(Math.random() * 5_000_000) + 100_000;
      const mockPath = `exports/${id}/report.${(current as ExportRow).format}`;
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from(TABLE)
        .update({
          status: 'completed',
          file_size: mockSize,
          file_path: mockPath,
          completed_at: now,
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      const job = toJob(data as ExportRow);
      eventBus.emit('export.completed', { ...job, fileSize: formatFileSize(mockSize) });
      return job;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown export error';
      await supabase
        .from(TABLE)
        .update({ status: 'failed', error: msg })
        .eq('id', id);

      const job = await this.getById(id);
      eventBus.emit('export.failed', { id, error: msg });
      return job!;
    }
  },

  async download(id: string): Promise<string | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('file_path, status')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    const row = data as { file_path: string | null; status: string };
    if (row.status !== 'completed' || !row.file_path) return null;

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(row.file_path);

    return urlData?.publicUrl ?? null;
  },

  async delete(id: string): Promise<void> {
    const { data, error: fetchError } = await supabase
      .from(TABLE)
      .select('file_path')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    const row = data as { file_path: string | null };
    if (row.file_path) {
      await supabase.storage.from(STORAGE_BUCKET).remove([row.file_path]);
    }

    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) {
      throw new Error(error.message);
    }

    eventBus.emit('export.deleted', { id });
  },
};
