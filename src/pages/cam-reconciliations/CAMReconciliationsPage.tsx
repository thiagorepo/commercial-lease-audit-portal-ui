import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calculator } from 'lucide-react';
import { PageHeader } from '@/components/custom/PageHeader';
import { QuickFilterChips } from '@/components/custom/QuickFilterChips';
import { StatCard } from '@/components/custom/StatCard';
import { StatCardSkeleton } from '@/components/custom/TableSkeleton';
import { StatusBadge } from '@/components/custom/StatusBadge';
import { VarianceIndicator } from '@/components/custom/VarianceIndicator';
import { Pagination } from '@/components/custom/Pagination';
import { EmptyState } from '@/components/custom/EmptyState';
import { NewCAMModal } from '@/components/custom/NewCAMModal';
import { TableSkeleton } from '@/components/custom/TableSkeleton';
import { camReconciliations as mockData } from '@/data/mock';
import { formatCurrency, formatPercent } from '@/lib/utils';
import type { CAMReconciliation, CAMStatus } from '@/types';

export function CAMReconciliationsPage() {
  const [data, setData] = useState<CAMReconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [newCAMOpen, setNewCAMOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Simulates a service call: replace mockData with camReconciliationService.list()
    // when the service is implemented.
    const t = setTimeout(() => {
      if (!cancelled) {
        setData(mockData);
        setLoading(false);
      }
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  const statusChips = useMemo(() => {
    const statuses: CAMStatus[] = ['draft', 'submitted', 'approved', 'finalized', 'rejected'];
    return [
      { value: 'all', label: 'All', count: data.length },
      ...statuses.map(s => ({
        value: s,
        label: s.charAt(0).toUpperCase() + s.slice(1),
        count: data.filter(c => c.status === s).length,
      })),
    ];
  }, [data]);

  const years = useMemo(() => {
    const unique = [...new Set(data.map(c => String(c.fiscalYear)))].sort((a, b) => b.localeCompare(a));
    return ['all', ...unique];
  }, [data]);

  const filtered = useMemo(() => {
    let result = data;
    if (statusFilter !== 'all') result = result.filter(c => c.status === statusFilter);
    if (yearFilter !== 'all') result = result.filter(c => String(c.fiscalYear) === yearFilter);
    return result;
  }, [data, statusFilter, yearFilter]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalVariance = filtered.reduce((a, c) => a + Math.abs(c.variance), 0);
  const avgProRata = filtered.length > 0 ? filtered.reduce((a, c) => a + c.proRataSharePercent, 0) / filtered.length : 0;

  return (
    <div>
      <PageHeader
        title="CAM Audit"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/overview' }, { label: 'CAM Audit' }]}
        actions={
          <button onClick={() => setNewCAMOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> New Reconciliation
          </button>
        }
      />

      {loading ? (
        <StatCardSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard label="Total Reconciliations" value={String(data.length)} />
          <StatCard label="Total Variance" value={formatCurrency(totalVariance)} />
          <StatCard label="Avg. Pro-Rata Share" value={formatPercent(avgProRata)} />
        </div>
      )}

      <div className="space-y-4">
        {!loading && (
          <div className="flex items-center gap-3">
            <select value={yearFilter} onChange={e => { setYearFilter(e.target.value); setPage(1); }}
              className="border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring">
              {years.map(y => <option key={y} value={y}>{y === 'all' ? 'All Years' : `FY ${y}`}</option>)}
            </select>
          </div>
        )}

        {!loading && (
          <QuickFilterChips chips={statusChips} selected={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} />
        )}

        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          {loading ? (
            <TableSkeleton rows={6} cols={8} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={Calculator} title="No reconciliations found" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      {['Fiscal Year', 'Lease / Tenant', 'Total CAM Expenses', 'Pro-Rata %', 'Amount Billed', 'Variance', 'Status', ''].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(c => (
                      <tr key={c.id} className="border-b border-border/30 hover:bg-accent transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-foreground">FY {c.fiscalYear}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Link to={`/leases/${c.leaseId}`} className="text-sm font-medium text-primary hover:text-primary">{c.leaseNumber}</Link>
                          <p className="text-xs text-muted-foreground">{c.tenantName}</p>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{formatCurrency(c.totalExpenses)}</td>
                        <td className="px-4 py-3 text-sm text-foreground/80">{formatPercent(c.proRataSharePercent)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{formatCurrency(c.amountBilled)}</td>
                        <td className="px-4 py-3"><VarianceIndicator amount={c.variance} size="sm" /></td>
                        <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                        <td className="px-4 py-3 text-right">
                          <Link to={`/cam-reconciliations/${c.id}`} className="text-sm text-primary hover:text-primary font-medium">View</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 border-t border-border/50">
                <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
              </div>
            </>
          )}
        </div>
      </div>
      <NewCAMModal open={newCAMOpen} onClose={() => setNewCAMOpen(false)} />
    </div>
  );
}
