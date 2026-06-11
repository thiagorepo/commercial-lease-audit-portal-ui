/**
 * Why: Centralizes report CRUD, data aggregation, and status lifecycle behind a
 *      single typed API so pages/hooks consume a stable contract instead of raw
 *      Supabase calls or direct mock imports.
 * What: Provides create, list, getById, generateData, updateStatus, delete.
 * Test: Mock supabase client, call each method, assert correct table/query and
 *       event emission.
 */

import { supabase } from '@/lib/supabase';
import { eventBus } from '@/lib/event-bus';
import type { Report, ReportStatus, ReportType } from '@/types';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ReportCreate {
  title: string;
  type: ReportType;
  portfolioId?: string;
  leaseId?: string;
  dateRange?: { start: string; end: string };
  filters?: Record<string, string>;
}

export interface ReportQuery {
  status?: ReportStatus;
  type?: ReportType;
  page?: number;
  pageSize?: number;
}

export interface ReportData {
  summary: {
    totalProperties: number;
    totalLeases: number;
    totalBaseRent: number;
    totalCAM: number;
    totalVariance: number;
    recoveryRate: number;
  };
  portfolios: Array<{
    id: string;
    name: string;
    leaseCount: number;
    totalRent: number;
    variance: number;
  }>;
  topDiscrepancies: Array<{
    id: string;
    category: string;
    variance: number;
    lease: string;
  }>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABLE = 'reports';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a Supabase row (snake_case) to the application Report type. */
function toDomain(row: Record<string, unknown>): Report {
  return {
    id: row.id as string,
    title: (row.title ?? '') as string,
    type: (row.type ?? 'portfolio-summary') as ReportType,
    status: (row.status ?? 'draft') as ReportStatus,
    portfolioId: (row.portfolio_id ?? undefined) as string | undefined,
    portfolioName: (row.portfolio_name ?? undefined) as string | undefined,
    leaseId: (row.lease_id ?? undefined) as string | undefined,
    leaseName: (row.lease_name ?? undefined) as string | undefined,
    periodStart: (row.period_start ?? '') as string,
    periodEnd: (row.period_end ?? '') as string,
    discrepancyCount: (row.discrepancy_count ?? 0) as number,
    recoveryAmount: (row.recovery_amount ?? 0) as number,
    version: (row.version ?? 1) as number,
    createdBy: (row.created_by ?? '') as string,
    createdAt: (row.created_at ?? '') as string,
    executiveSummary: (row.executive_summary ?? '') as string,
    findings: (row.findings ?? []) as string[],
    recommendations: (row.recommendations ?? []) as string[],
    methodology: (row.methodology ?? '') as string,
    appendix: (row.appendix ?? []) as string[],
    comments: (row.comments ?? []) as Report['comments'],
    statusHistory: (row.status_history ?? []) as Report['statusHistory'],
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const reportService = {
  // -----------------------------------------------------------------------
  // Create
  // -----------------------------------------------------------------------

  /**
   * Why: Creates a new report record with initial draft status so the UI can
   *      track it through the report lifecycle.
   * What: Inserts a row into Supabase, emits 'report.created', returns Report.
   * Test: Insert a report, re-fetch by id, assert fields match input and status is 'draft'.
   */
  async create(data: ReportCreate): Promise<Report | null> {
    const now = new Date().toISOString();
    const row = {
      title: data.title,
      type: data.type,
      status: 'draft' as ReportStatus,
      portfolio_id: data.portfolioId ?? null,
      lease_id: data.leaseId ?? null,
      period_start: data.dateRange?.start ?? '',
      period_end: data.dateRange?.end ?? '',
      filters: data.filters ?? null,
      discrepancy_count: 0,
      recovery_amount: 0,
      version: 1,
      created_by: 'current-user',
      executive_summary: '',
      findings: [],
      recommendations: [],
      methodology: '',
      appendix: [],
      comments: [],
      status_history: [{ status: 'draft', changed_by: 'current-user', changed_at: now }],
      created_at: now,
      updated_at: now,
    };

    const { data: inserted, error } = await supabase
      .from(TABLE)
      .insert(row)
      .select('*')
      .single();

    if (error || !inserted) {
      console.error('reportService.create failed:', error?.message);
      return null;
    }

    const report = toDomain(inserted as Record<string, unknown>);
    eventBus.emit('report.created', report);
    return report;
  },

  // -----------------------------------------------------------------------
  // List / Query
  // -----------------------------------------------------------------------

  /**
   * Why: Replaces scattered mock-import filtering with a single queryable API
   *      against Supabase.
   * What: Builds a filtered, ordered list query and returns matching reports.
   * Test: Insert test rows, call with various filters, assert correct filtering.
   */
  async list(query: ReportQuery = {}): Promise<Report[]> {
    const { status, type } = query;

    let qb = supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (status) qb = qb.eq('status', status);
    if (type) qb = qb.eq('type', type);

    const { data, error } = await qb;

    if (error) {
      console.error('reportService.list failed:', error.message);
      return [];
    }

    return (data ?? []).map((row) => toDomain(row as Record<string, unknown>));
  },

  // -----------------------------------------------------------------------
  // Get by ID
  // -----------------------------------------------------------------------

  /**
   * Why: Single-record fetch used by detail and edit pages.
   * What: Queries Supabase by id, returns Report or null.
   * Test: Insert a row, fetch by id, assert field mapping is correct.
   */
  async getById(id: string): Promise<Report | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      if (error) {
        console.error('reportService.getById failed:', error.message);
      }
      return null;
    }

    return toDomain(data as Record<string, unknown>);
  },

  // -----------------------------------------------------------------------
  // Generate data
  // -----------------------------------------------------------------------

  /**
   * Why: Aggregates lease, discrepancy, and CAM data into a summary structure
   *      used for report content generation and preview.
   * What: Queries leases, discrepancies, and CAM reconciliations, computes
   *       totals, returns ReportData, emits 'report.generated'.
   * Test: Seed known rows in each table, call generateData, assert computed
   *       totals match expected values.
   */
  async generateData(reportId: string): Promise<ReportData | null> {
    // Fetch the report to determine scope (portfolio vs lease vs all)
    const { data: reportRow, error: reportErr } = await supabase
      .from(TABLE)
      .select('portfolio_id, lease_id')
      .eq('id', reportId)
      .single();

    if (reportErr || !reportRow) {
      console.error('reportService.generateData: report not found:', reportErr?.message);
      return null;
    }

    const portfolioId = (reportRow as Record<string, unknown>).portfolio_id as string | null;
    const leaseId = (reportRow as Record<string, unknown>).lease_id as string | null;

    // Build queries for leases, discrepancies, and CAM reconciliations in parallel
    let leaseQuery = supabase.from('leases').select('id, portfolio_id, baseRent, cam_cap_percent, totalInvoiced, totalAudited, potentialRecovery');
    if (portfolioId) leaseQuery = leaseQuery.eq('portfolio_id', portfolioId);
    if (leaseId) leaseQuery = leaseQuery.eq('id', leaseId);

    let discQuery = supabase.from('discrepancies').select('id, category, variance, lease_id, lease_number');
    if (portfolioId) discQuery = discQuery.eq('portfolio_id', portfolioId);
    if (leaseId) discQuery = discQuery.eq('lease_id', leaseId);

    let camQuery = supabase.from('cam_reconciliations').select('total_expenses, amount_billed, variance');
    if (portfolioId) camQuery = camQuery.eq('portfolio_id', portfolioId);
    if (leaseId) camQuery = camQuery.eq('lease_id', leaseId);

    const [leaseRes, discRes, camRes] = await Promise.all([leaseQuery, discQuery, camQuery]);

    const leases = (leaseRes.data ?? []) as Record<string, unknown>[];
    const discrepancies = (discRes.data ?? []) as Record<string, unknown>[];
    const cams = (camRes.data ?? []) as Record<string, unknown>[];

    // Compute property count from leases (unique property ids)
    const propertyIds = new Set<string>();
    for (const l of leases) {
      const pid = (l.property_id ?? l.propertyId) as string | undefined;
      if (pid) propertyIds.add(pid);
    }

    const totalBaseRent = leases.reduce(
      (sum, l) => sum + ((l.base_rent ?? l.baseRent ?? 0) as number),
      0,
    );
    const totalCAM = cams.reduce(
      (sum, c) => sum + ((c.total_expenses ?? c.totalExpenses ?? 0) as number),
      0,
    );
    const totalVariance = discrepancies.reduce(
      (sum, d) => sum + ((d.variance ?? 0) as number),
      0,
    );
    const totalPotentialRecovery = leases.reduce(
      (sum, l) => sum + ((l.potential_recovery ?? l.potentialRecovery ?? 0) as number),
      0,
    );
    const totalInvoiced = leases.reduce(
      (sum, l) => sum + ((l.total_invoiced ?? l.totalInvoiced ?? 0) as number),
      0,
    );
    const recoveryRate = totalInvoiced > 0
      ? Math.round((totalPotentialRecovery / totalInvoiced) * 1000) / 10
      : 0;

    // Group by portfolio
    const portfolioMap = new Map<string, { id: string; name: string; leaseCount: number; totalRent: number; variance: number }>();
    for (const l of leases) {
      const pid = (l.portfolio_id ?? l.portfolioId ?? '') as string;
      const existing = portfolioMap.get(pid);
      if (existing) {
        existing.leaseCount += 1;
        existing.totalRent += (l.base_rent ?? l.baseRent ?? 0) as number;
      } else {
        portfolioMap.set(pid, {
          id: pid,
          name: (l.portfolio_name ?? l.portfolioName ?? pid) as string,
          leaseCount: 1,
          totalRent: (l.base_rent ?? l.baseRent ?? 0) as number,
          variance: 0,
        });
      }
    }
    // Add variance per portfolio from discrepancies
    for (const d of discrepancies) {
      const pid = (d.portfolio_id ?? '') as string;
      const entry = portfolioMap.get(pid);
      if (entry) {
        entry.variance += (d.variance ?? 0) as number;
      }
    }

    // Top discrepancies by absolute variance
    const topDiscrepancies = [...discrepancies]
      .sort((a, b) => ((b.variance ?? 0) as number) - ((a.variance ?? 0) as number))
      .slice(0, 10)
      .map((d) => ({
        id: (d.id ?? '') as string,
        category: (d.category ?? '') as string,
        variance: (d.variance ?? 0) as number,
        lease: ((d.lease_number ?? d.leaseNumber ?? '') as string),
      }));

    const result: ReportData = {
      summary: {
        totalProperties: propertyIds.size,
        totalLeases: leases.length,
        totalBaseRent: Math.round(totalBaseRent),
        totalCAM: Math.round(totalCAM),
        totalVariance: Math.round(totalVariance),
        recoveryRate,
      },
      portfolios: Array.from(portfolioMap.values()),
      topDiscrepancies,
    };

    eventBus.emit('report.generated', { reportId, data: result });
    return result;
  },

  // -----------------------------------------------------------------------
  // Status updates
  // -----------------------------------------------------------------------

  /**
   * Why: Status transitions are the primary mutation on reports and must be
   *      audited via statusHistory.
   * What: Appends to statusHistory, updates status, emits 'report.status-changed'.
   * Test: Update status on a known row, re-fetch, assert status and history entry.
   */
  async updateStatus(id: string, status: ReportStatus): Promise<Report | null> {
    const { data: current, error: fetchErr } = await supabase
      .from(TABLE)
      .select('status_history')
      .eq('id', id)
      .single();

    if (fetchErr || !current) {
      console.error('reportService.updateStatus fetch failed:', fetchErr?.message);
      return null;
    }

    const history = ((current as Record<string, unknown>).status_history ?? []) as Record<string, unknown>[];
    const now = new Date().toISOString();
    const newEntry = { status, changed_by: 'current-user', changed_at: now };

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
      console.error('reportService.updateStatus failed:', error?.message);
      return null;
    }

    const report = toDomain(data as Record<string, unknown>);
    eventBus.emit('report.status-changed', { id, status });
    return report;
  },

  // -----------------------------------------------------------------------
  // Delete
  // -----------------------------------------------------------------------

  /**
   * Why: Removes a report record; used for draft cleanup or admin corrections.
   * What: Deletes by id, emits 'report.deleted'.
   * Test: Insert a report, delete it, re-fetch, assert null returned.
   */
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('reportService.delete failed:', error.message);
      return false;
    }

    eventBus.emit('report.deleted', { id });
    return true;
  },
};
