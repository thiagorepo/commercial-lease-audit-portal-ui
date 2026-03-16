import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Download, Eye, CreditCard as Edit } from 'lucide-react';
import { PageHeader } from '@/components/custom/PageHeader';
import { QuickFilterChips } from '@/components/custom/QuickFilterChips';
import { StatusBadge } from '@/components/custom/StatusBadge';
import { Pagination } from '@/components/custom/Pagination';
import { EmptyState } from '@/components/custom/EmptyState';
import { NewReportModal } from '@/components/custom/NewReportModal';
import { reports } from '@/data/mock';
import { formatCurrency, formatDate } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

const statusChips = [
  { value: 'all', label: 'All', count: reports.length },
  { value: 'draft', label: 'Draft', count: reports.filter(r => r.status === 'draft').length },
  { value: 'reviewed', label: 'Reviewed', count: reports.filter(r => r.status === 'reviewed').length },
  { value: 'final', label: 'Final', count: reports.filter(r => r.status === 'final').length },
  { value: 'distributed', label: 'Distributed', count: reports.filter(r => r.status === 'distributed').length },
];

const typeLabels: Record<string, string> = {
  'portfolio-summary': 'Portfolio Summary',
  'lease-specific': 'Lease Specific',
  'cam-audit': 'CAM Audit',
  'annual-review': 'Annual Review',
};

export function ReportsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [newReportOpen, setNewReportOpen] = useState(false);

  const filtered = useMemo(() => {
    let data = reports;
    if (statusFilter !== 'all') data = data.filter(r => r.status === statusFilter);
    if (typeFilter !== 'all') data = data.filter(r => r.type === typeFilter);
    return data;
  }, [statusFilter, typeFilter]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <PageHeader
        title="Reports"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Reports' }]}
        actions={
          <button onClick={() => setNewReportOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> New Report
          </button>
        }
      />

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="border border-border rounded-lg px-3 py-2.5 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring">
            <option value="all">All Report Types</option>
            {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <QuickFilterChips chips={statusChips} selected={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} />

        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState icon={BarChart3} title="No reports found" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      {['Report Title', 'Type', 'Scope', 'Period', 'Discrepancies', 'Recovery', 'Status', 'Ver.', ''].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(r => (
                      <tr key={r.id} className="border-b border-border/30 hover:bg-accent transition-colors">
                        <td className="px-4 py-3 max-w-xs">
                          <Link to={`/reports/${r.id}`} className="text-sm font-medium text-primary hover:text-primary line-clamp-2">{r.title}</Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/30 whitespace-nowrap">
                            {typeLabels[r.type]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-muted-foreground whitespace-nowrap">{r.portfolioName || r.leaseName || '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">
                          {formatDate(r.periodStart)} — {formatDate(r.periodEnd)}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground/80 text-center">{r.discrepancyCount}</td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">{formatCurrency(r.recoveryAmount)}</td>
                        <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-muted-foreground">v{r.version}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => navigate(`/reports/${r.id}`)} className="p-1.5 text-muted-foreground/70 hover:text-accent-foreground hover:bg-accent rounded-md transition-colors" title="View">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => navigate(`/reports/${r.id}`)} className="p-1.5 text-muted-foreground/70 hover:text-accent-foreground hover:bg-accent rounded-md transition-colors" title="Edit">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => {
                              const content = `Report: ${r.title}\nVersion: ${r.version}\nStatus: ${r.status}\n\nRecovery Amount: $${r.recoveryAmount.toLocaleString()}\nDiscrepancies: ${r.discrepancyCount}\n\nGenerated: ${new Date().toISOString()}`;
                              const blob = new Blob([content], { type: 'text/plain' });
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${r.title.replace(/\s+/g, '-')}-v${r.version}.txt`;
                              a.click();
                              window.URL.revokeObjectURL(url);
                              toast.success('Report downloaded');
                            }} className="p-1.5 text-muted-foreground/70 hover:text-accent-foreground hover:bg-accent rounded-md transition-colors\" title="Download">
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
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
      <NewReportModal open={newReportOpen} onClose={() => setNewReportOpen(false)} />
    </div>
  );
}
