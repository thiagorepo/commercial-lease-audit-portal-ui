import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, MoreHorizontal, Eye, X } from 'lucide-react';
import { PageHeader } from '@/components/custom/PageHeader';
import { QuickFilterChips } from '@/components/custom/QuickFilterChips';
import { StatusBadge, PriorityBadge } from '@/components/custom/StatusBadge';
import { VarianceIndicator } from '@/components/custom/VarianceIndicator';
import { Pagination } from '@/components/custom/Pagination';
import { EmptyState } from '@/components/custom/EmptyState';
import { NewDiscrepancyModal } from '@/components/custom/NewDiscrepancyModal';
import { discrepancies } from '@/data/mock';
import { truncate } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import type { DiscrepancyStatus, DiscrepancyPriority } from '@/types';

const statusChips = [
  { value: 'all', label: 'All', count: discrepancies.length },
  { value: 'open', label: 'Open', count: discrepancies.filter(d => d.status === 'open').length },
  { value: 'pending', label: 'Pending', count: discrepancies.filter(d => d.status === 'pending').length },
  { value: 'resolved', label: 'Resolved', count: discrepancies.filter(d => d.status === 'resolved').length },
  { value: 'cancelled', label: 'Cancelled', count: discrepancies.filter(d => d.status === 'cancelled').length },
];

const categories = ['all', 'rent-overcharge', 'cam-overcharge', 'late-fee', 'error', 'other'];
const priorities = ['all', 'urgent', 'high', 'medium', 'low'];

export function DiscrepanciesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [newDiscOpen, setNewDiscOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = useMemo(() => {
    let data = discrepancies;
    if (statusFilter !== 'all') data = data.filter(d => d.status === statusFilter as DiscrepancyStatus);
    if (categoryFilter !== 'all') data = data.filter(d => d.category === categoryFilter);
    if (priorityFilter !== 'all') data = data.filter(d => d.priority === priorityFilter as DiscrepancyPriority);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(d => d.leaseNumber.toLowerCase().includes(q) || d.tenantName.toLowerCase().includes(q) || d.description.toLowerCase().includes(q));
    }
    if (dateFrom) data = data.filter(d => d.createdAt >= dateFrom);
    if (dateTo) data = data.filter(d => d.createdAt <= dateTo + 'T23:59:59Z');
    return data;
  }, [search, statusFilter, categoryFilter, priorityFilter, dateFrom, dateTo]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <PageHeader
        title="Discrepancies"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Discrepancies' }]}
        actions={
          <button onClick={() => setNewDiscOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> New Discrepancy
          </button>
        }
      />

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by lease, tenant, or description..."
              className="w-full border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
          </div>
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
            className="border border-border rounded-lg px-3 py-2.5 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring">
            {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
          </select>
          <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
            className="border border-border rounded-lg px-3 py-2.5 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring">
            {priorities.map(p => <option key={p} value={p}>{p === 'all' ? 'All Priorities' : p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              title="From date"
              className="border border-border rounded-lg px-3 py-2.5 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
            <span className="text-muted-foreground/70 text-sm shrink-0">to</span>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
              title="To date"
              className="border border-border rounded-lg px-3 py-2.5 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }} className="p-2 text-muted-foreground/70 hover:text-accent-foreground hover:bg-accent rounded-lg transition-colors" title="Clear dates">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <QuickFilterChips chips={statusChips} selected={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} />

        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="No discrepancies found" description="Try adjusting your filters." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      {['ID', 'Lease / Tenant', 'Category', 'Description', 'Variance', 'Priority', 'Status', 'Assigned To', ''].map(h => (
                        <th key={h} className={`text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 ${h === 'Description' ? 'hidden lg:table-cell' : h === 'Assigned To' ? 'hidden xl:table-cell' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(d => (
                      <tr key={d.id} className="border-b border-border/30 hover:bg-accent transition-colors">
                        <td className="px-4 py-3">
                          <Link to={`/discrepancies/${d.id}`} className="text-xs font-mono font-semibold text-primary hover:text-primary">{d.id.toUpperCase()}</Link>
                        </td>
                        <td className="px-4 py-3">
                          <Link to={`/leases/${d.leaseId}`} className="text-sm font-medium text-primary hover:text-primary">{d.leaseNumber}</Link>
                          <p className="text-xs text-muted-foreground">{d.tenantName}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-foreground/80 capitalize whitespace-nowrap">
                            {d.category.replace(/-/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell max-w-xs">
                          <p className="text-sm text-muted-foreground truncate" title={d.description}>{truncate(d.description, 60)}</p>
                        </td>
                        <td className="px-4 py-3"><VarianceIndicator amount={d.variance} size="sm" /></td>
                        <td className="px-4 py-3"><PriorityBadge priority={d.priority} /></td>
                        <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                              {d.assignedTo.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-sm text-muted-foreground whitespace-nowrap">{d.assignedTo}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 relative">
                          <button onClick={() => setOpenMenu(openMenu === d.id ? null : d.id)} className="p-1 text-muted-foreground/70 hover:text-accent-foreground hover:bg-accent rounded-md transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {openMenu === d.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                              <div className="absolute right-0 top-8 z-20 w-36 bg-card border border-border rounded-xl shadow-lg py-1">
                                <button onClick={() => { navigate(`/discrepancies/${d.id}`); setOpenMenu(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground/80 hover:bg-accent">
                                  <Eye className="w-4 h-4 text-muted-foreground/70" /> View
                                </button>
                              </div>
                            </>
                          )}
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
      <NewDiscrepancyModal open={newDiscOpen} onClose={() => setNewDiscOpen(false)} />
    </div>
  );
}
