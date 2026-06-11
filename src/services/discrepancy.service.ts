import { supabase } from '@/lib/supabase';
import { eventBus } from '@/lib/event-bus';
import type {
  Discrepancy,
  DiscrepancyCategory,
  DiscrepancyPriority,
  DiscrepancyStatus,
} from '@/types';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface DiscrepancyCreate {
  leaseId: string;
  category: DiscrepancyCategory;
  description: string;
  billedAmount: number;
  expectedAmount: number;
  variance: number;
  variancePercent: number;
  priority: DiscrepancyPriority;
}

export interface DiscrepancyQuery {
  status?: DiscrepancyStatus;
  category?: DiscrepancyCategory;
  priority?: DiscrepancyPriority;
  leaseId?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DiscrepancyStats {
  byStatus: Record<DiscrepancyStatus, number>;
  byCategory: Record<DiscrepancyCategory, number>;
  totalVariance: number;
  totalRecovered: number;
  count: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABLE = 'discrepancies';

const ALL_STATUSES: DiscrepancyStatus[] = [
  'open',
  'pending',
  'resolved',
  'cancelled',
];

const ALL_CATEGORIES: DiscrepancyCategory[] = [
  'rent-overcharge',
  'cam-overcharge',
  'late-fee',
  'error',
  'other',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a Supabase row (snake_case) to the application Discrepancy type. */
function toDomain(row: Record<string, unknown>): Discrepancy {
  return {
    id: row.id as string,
    leaseId: (row.lease_id ?? row.property_id) as string,
    leaseNumber: (row.lease_number ?? '') as string,
    tenantName: (row.tenant_name ?? '') as string,
    propertyName: (row.property_name ?? '') as string,
    category: (row.category ?? row.type) as DiscrepancyCategory,
    description: (row.description ?? '') as string,
    expectedAmount: (row.expected_amount ?? row.impact_amount ?? 0) as number,
    actualAmount: (row.actual_amount ?? row.impact_amount ?? 0) as number,
    variance: (row.variance ?? 0) as number,
    variancePercent: (row.variance_percent ?? 0) as number,
    priority: (row.priority ?? 'medium') as DiscrepancyPriority,
    status: (row.status ?? 'open') as DiscrepancyStatus,
    assignedTo: (row.assigned_to ?? '') as string,
    assignedToAvatar: (row.assigned_to_avatar ?? undefined) as
      | string
      | undefined,
    recoveredAmount: (row.recovered_amount ?? undefined) as number | undefined,
    recoveryDate: (row.recovery_date ?? undefined) as string | undefined,
    recoveryNotes: (row.recovery_notes ?? undefined) as string | undefined,
    notes: (row.notes ?? []) as Discrepancy['notes'],
    statusHistory: (row.status_history ?? []) as Discrepancy['statusHistory'],
    relatedDocuments: (row.related_documents ?? []) as string[],
    currency_code: (row.currency_code ?? 'USD') as string,
    version: (row.version ?? 1) as number,
    createdAt: (row.created_at ?? '') as string,
    updatedAt: (row.updated_at ?? '') as string,
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * Why: Centralizes all discrepancy CRUD + detection logic behind a single
 *      typed API so pages/hooks consume a stable contract instead of raw
 *      Supabase calls or direct mock imports.
 * What: Provides detect, list, getById, updateStatus, bulkUpdateStatus, getStats.
 * Test: Mock supabase client, call each method, assert correct table/query and
 *       event emission.
 */
export const discrepancyService = {
  // -----------------------------------------------------------------------
  // Detection
  // -----------------------------------------------------------------------

  /**
   * Why: Kicks off automated discrepancy detection for a lease by comparing
   *      lease terms against actual billing records.
   * What: Fetches lease + invoices, compares amounts, emits
   *       'discrepancy.detected' for each finding, returns the list.
   * Test: Provide a lease with known billing variance, assert correct
   *       DiscrepancyCreate objects and event emissions.
   */
  async detect(leaseId: string): Promise<DiscrepancyCreate[]> {
    const [leaseRes, invoiceRes] = await Promise.all([
      supabase.from('leases').select('*').eq('id', leaseId).single(),
      supabase.from('invoices').select('*').eq('lease_id', leaseId),
    ]);

    const lease = leaseRes.data as Record<string, unknown> | null;
    const invoices =
      (invoiceRes.data as Record<string, unknown>[]) ?? [];

    if (!lease || leaseRes.error) {
      if (leaseRes.error) {
        console.error('Failed to fetch lease for detection:', leaseRes.error.message);
      }
      return [];
    }

    const findings: DiscrepancyCreate[] = [];
    const annualRent = (lease.annual_rent ?? lease.baseRent ?? 0) as number;

    // Check rent overcharge: any invoice exceeding expected monthly rent
    const expectedMonthly = annualRent / 12;
    for (const inv of invoices) {
      const invAmount = (inv.amount ?? 0) as number;
      const invDesc = ((inv.description ?? '') as string).toLowerCase();
      // Only check rent-line invoices
      if (!invDesc.includes('rent') && !invDesc.includes('base')) continue;

      if (invAmount > expectedMonthly * 1.01) {
        const variance = Math.round(invAmount - expectedMonthly);
        const pct = expectedMonthly > 0
          ? Math.round((variance / expectedMonthly) * 1000) / 10
          : 0;

        findings.push({
          leaseId,
          category: 'rent-overcharge',
          description: `Invoice ${(inv.invoice_number ?? inv.id) as string} amount $${invAmount} exceeds expected monthly rent of $${Math.round(expectedMonthly)}.`,
          billedAmount: invAmount,
          expectedAmount: Math.round(expectedMonthly),
          variance,
          variancePercent: pct,
          priority: variance > 5000 ? 'high' : variance > 1000 ? 'medium' : 'low',
        });
      }
    }

    // Check CAM cap violation
    const camCap = (lease.cam_cap_percent ?? 0) as number;
    if (camCap > 0) {
      const camInvoices = invoices.filter((inv) => {
        const desc = ((inv.description ?? '') as string).toLowerCase();
        return desc.includes('cam') || desc.includes('common area');
      });
      const totalCam = camInvoices.reduce(
        (sum, inv) => sum + ((inv.amount ?? 0) as number),
        0,
      );
      const expectedCam = annualRent * (camCap / 100);
      if (totalCam > expectedCam * 1.02) {
        const variance = Math.round(totalCam - expectedCam);
        findings.push({
          leaseId,
          category: 'cam-overcharge',
          description: `Total CAM charges $${totalCam} exceed lease cap of ${camCap}% ($${Math.round(expectedCam)}).`,
          billedAmount: totalCam,
          expectedAmount: Math.round(expectedCam),
          variance,
          variancePercent:
            expectedCam > 0
              ? Math.round((variance / expectedCam) * 1000) / 10
              : 0,
          priority: variance > 10000 ? 'urgent' : 'high',
        });
      }
    }

    // Emit events for each finding
    for (const finding of findings) {
      eventBus.emit('discrepancy.detected', finding);
    }

    return findings;
  },

  // -----------------------------------------------------------------------
  // List / Query
  // -----------------------------------------------------------------------

  /**
   * Why: Replaces scattered mock-import filtering with a single paginated
   *      query against Supabase.
   * What: Builds a filtered, ordered, paginated query and returns a
   *       PaginatedResult<Discrepancy>.
   * Test: Insert test rows, call with various filters, assert correct
   *       pagination and filtering.
   */
  async list(
    query: DiscrepancyQuery = {},
  ): Promise<PaginatedResult<Discrepancy>> {
    const {
      status,
      category,
      priority,
      leaseId,
      page = 1,
      pageSize = 20,
    } = query;

    let qb = supabase
      .from(TABLE)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) qb = qb.eq('status', status);
    if (category) qb = qb.eq('category', category);
    if (priority) qb = qb.eq('priority', priority);
    if (leaseId) qb = qb.eq('lease_id', leaseId);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    qb = qb.range(from, to);

    const { data, count, error } = await qb;

    if (error) {
      console.error('discrepancyService.list failed:', error.message);
      return { data: [], total: 0, page, pageSize };
    }

    return {
      data: (data ?? []).map(toDomain),
      total: count ?? 0,
      page,
      pageSize,
    };
  },

  // -----------------------------------------------------------------------
  // Get by ID
  // -----------------------------------------------------------------------

  /**
   * Why: Single-record fetch used by detail pages.
   * What: Queries Supabase by id, returns Discrepancy or null.
   * Test: Insert a row, fetch by id, assert field mapping is correct.
   */
  async getById(id: string): Promise<Discrepancy | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      if (error) {
        console.error(
          'discrepancyService.getById failed:',
          error.message,
        );
      }
      return null;
    }

    return toDomain(data as Record<string, unknown>);
  },

  // -----------------------------------------------------------------------
  // Status updates
  // -----------------------------------------------------------------------

  /**
   * Why: Status transitions are the primary mutation on discrepancies and
   *      must be audited via statusHistory.
   * What: Appends to statusHistory, updates status, emits
   *       'discrepancy.status-changed'.
   * Test: Update status on a known row, re-fetch, assert status and
   *       history entry.
   */
  async updateStatus(
    id: string,
    status: DiscrepancyStatus,
    notes?: string,
  ): Promise<Discrepancy | null> {
    // Fetch current row to append to statusHistory
    const { data: current, error: fetchErr } = await supabase
      .from(TABLE)
      .select('status_history')
      .eq('id', id)
      .single();

    if (fetchErr || !current) {
      console.error(
        'discrepancyService.updateStatus fetch failed:',
        fetchErr?.message,
      );
      return null;
    }

    const history = (current.status_history ?? []) as Record<
      string,
      unknown
    >[];
    const now = new Date().toISOString();
    const newEntry = { status, changed_by: 'current-user', changed_at: now, note: notes ?? null };

    const { data, error } = await supabase
      .from(TABLE)
      .update({
        status,
        status_history: [...history, newEntry],
        updated_at: now,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      console.error(
        'discrepancyService.updateStatus failed:',
        error?.message,
      );
      return null;
    }

    const domain = toDomain(data as Record<string, unknown>);
    eventBus.emit('discrepancy.status-changed', {
      id,
      status,
      notes,
    });
    return domain;
  },

  /**
   * Why: Bulk status transitions are needed for list-level actions like
   *      resolving multiple discrepancies at once.
   * What: Updates all matching ids to the given status.
   * Test: Insert multiple rows, call bulkUpdateStatus, assert all updated.
   */
  async bulkUpdateStatus(
    ids: string[],
    status: DiscrepancyStatus,
  ): Promise<number> {
    if (ids.length === 0) return 0;

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from(TABLE)
      .update({ status, updated_at: now })
      .in('id', ids)
      .select('id');

    if (error) {
      console.error(
        'discrepancyService.bulkUpdateStatus failed:',
        error.message,
      );
      return 0;
    }

    eventBus.emit('discrepancy.bulk-status-changed', { ids, status });
    return data?.length ?? 0;
  },

  // -----------------------------------------------------------------------
  // Stats
  // -----------------------------------------------------------------------

  /**
   * Why: Dashboard and summary views need aggregated counts without
   *      fetching all rows.
   * What: Queries with count aggregation, returns typed stats object.
   * Test: Insert known rows, call getStats, assert counts and totals.
   */
  async getStats(leaseId?: string): Promise<DiscrepancyStats> {
    let qb = supabase.from(TABLE).select(
      'status, category, variance, recovered_amount',
    );

    if (leaseId) qb = qb.eq('lease_id', leaseId);

    const { data, error } = await qb;

    if (error || !data) {
      console.error('discrepancyService.getStats failed:', error?.message);
      return {
        byStatus: {} as Record<DiscrepancyStatus, number>,
        byCategory: {} as Record<DiscrepancyCategory, number>,
        totalVariance: 0,
        totalRecovered: 0,
        count: 0,
      };
    }

    const rows = data as Record<string, unknown>[];

    const byStatus = {} as Record<DiscrepancyStatus, number>;
    for (const s of ALL_STATUSES) byStatus[s] = 0;

    const byCategory = {} as Record<DiscrepancyCategory, number>;
    for (const c of ALL_CATEGORIES) byCategory[c] = 0;

    let totalVariance = 0;
    let totalRecovered = 0;

    for (const row of rows) {
      const st = row.status as DiscrepancyStatus;
      const cat = row.category as DiscrepancyCategory;
      if (st in byStatus) byStatus[st]++;
      if (cat in byCategory) byCategory[cat]++;
      totalVariance += (row.variance as number) ?? 0;
      totalRecovered += (row.recovered_amount as number) ?? 0;
    }

    return {
      byStatus,
      byCategory,
      totalVariance: Math.round(totalVariance),
      totalRecovered: Math.round(totalRecovered),
      count: rows.length,
    };
  },
};
