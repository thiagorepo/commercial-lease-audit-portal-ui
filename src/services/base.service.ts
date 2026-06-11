/**
 * Why: Provides shared CRUD primitives so individual services don't duplicate
 *      pagination, list, getById, create, update, delete boilerplate.
 * What: Generic base service factory over Supabase tables.
 * Test: Instantiate with a mock table name, call each method, assert correct query chain.
 */

import { supabase } from '@/lib/supabase';
import { eventBus } from '@/lib/event-bus';

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BaseServiceOptions<TDomain, TRow> {
  table: string;
  toDomain: (row: TRow) => TDomain;
  toRow: (domain: Partial<TDomain>) => Partial<TRow>;
  eventPrefix?: string;
}

export function createBaseService<TDomain extends { id: string }, TRow extends Record<string, unknown>>(
  options: BaseServiceOptions<TDomain, TRow>,
) {
  const { table, toDomain, toRow, eventPrefix } = options;

  return {
    async list(
      params: PaginationParams = {},
      filters?: Record<string, unknown>,
    ): Promise<PaginatedResult<TDomain>> {
      const { page = 1, pageSize = 20 } = params;

      let query = supabase
        .from(table)
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        }
      }

      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);

      const { data, count, error } = await query;

      if (error) {
        console.error(`${table}.list failed:`, error.message);
        return { data: [], total: 0, page, pageSize };
      }

      return {
        data: (data as TRow[]).map(toDomain),
        total: count ?? 0,
        page,
        pageSize,
      };
    },

    async getById(id: string): Promise<TDomain | null> {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error(`${table}.getById failed:`, error?.message);
        return null;
      }

      return toDomain(data as TRow);
    },

    async create(input: Omit<TDomain, 'id'>): Promise<TDomain | null> {
      const row = toRow(input as Partial<TDomain>);
      const { data, error } = await supabase
        .from(table)
        .insert(row)
        .select('*')
        .single();

      if (error || !data) {
        console.error(`${table}.create failed:`, error?.message);
        return null;
      }

      const domain = toDomain(data as TRow);
      if (eventPrefix) {
        eventBus.emit(`${eventPrefix}.created`, domain);
      }
      return domain;
    },

    async update(id: string, input: Partial<TDomain>): Promise<TDomain | null> {
      const row = toRow(input);
      const { data, error } = await supabase
        .from(table)
        .update({ ...row, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single();

      if (error || !data) {
        console.error(`${table}.update failed:`, error?.message);
        return null;
      }

      const domain = toDomain(data as TRow);
      if (eventPrefix) {
        eventBus.emit(`${eventPrefix}.updated`, domain);
      }
      return domain;
    },

    async delete(id: string): Promise<boolean> {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`${table}.delete failed:`, error.message);
        return false;
      }

      if (eventPrefix) {
        eventBus.emit(`${eventPrefix}.deleted`, { id });
      }
      return true;
    },
  };
}
