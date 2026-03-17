import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, MoreHorizontal, Eye, Pencil as Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { PageHeader } from '@/components/custom/PageHeader';
import { QuickFilterChips } from '@/components/custom/QuickFilterChips';
import { StatusBadge, CAMTypeBadge } from '@/components/custom/StatusBadge';
import { BulkActionToolbar } from '@/components/custom/BulkActionToolbar';
import { Pagination } from '@/components/custom/Pagination';
import { EmptyState } from '@/components/custom/EmptyState';
import { NewLeaseModal } from '@/components/custom/NewLeaseModal';
import { EditLeaseModal } from '@/components/custom/EditLeaseModal';
import { TableSkeleton } from '@/components/custom/TableSkeleton';
import { leases } from '@/data/mock';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { LeaseStatus } from '@/types';

type SortKey = 'leaseNumber' | 'tenantName' | 'termStart' | 'termEnd' | 'baseRent' | 'openDiscrepancies';
type SortDir = 'asc' | 'desc';

const filterChips = [
  { value: 'all', label: 'All', count: leases.length },
  { value: 'active', label: 'Active', count: leases.filter(l => l.status === 'active').length },
  { value: 'expired', label: 'Expired', count: leases.filter(l => l.status === 'expired').length },
  { value: 'pending', label: 'Pending', count: leases.filter(l => l.status === 'pending').length },
  { value: 'terminated', label: 'Terminated', count: leases.filter(l => l.status === 'terminated').length },
];

export function LeasesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('leaseNumber');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [newLeaseOpen, setNewLeaseOpen] = useState(false);
  const [editLeaseId, setEditLeaseId] = useState<string | null>(null);
  const [loading] = useState(false);

  const filtered = useMemo(() => {
    let data = leases;
    if (filter !== 'all') data = data.filter(l => l.status === filter as LeaseStatus);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(l => l.leaseNumber.toLowerCase().includes(q) || l.tenantName.toLowerCase().includes(q) || l.propertyName.toLowerCase().includes(q));
    }
    data = [...data].sort((a, b) => {
      let av = a[sortKey] as string | number;
      let bv = b[sortKey] as string | number;
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      return sortDir === 'asc' ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0);
    });
    return data;
  }, [search, filter, sortKey, sortDir]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const allSelected = paginated.length > 0 && paginated.every(l => selected.has(l.id));

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronUp className="w-3 h-3 text-muted-foreground/50" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />;
  };

  const handleSelectAll = () => {
    if (allSelected) setSelected(s => { const n = new Set(s); paginated.forEach(l => n.delete(l.id)); return n; });
    else setSelected(s => { const n = new Set(s); paginated.forEach(l => n.add(l.id)); return n; });
  };

  return (
    <div>
      <PageHeader
        title="Leases"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/overview' }, { label: 'Leases' }]}
        actions={
          <button onClick={() => setNewLeaseOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> New Lease
          </button>
        }
      />

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by lease number, tenant, or property..."
              className="w-full border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
          </div>
        </div>

        <QuickFilterChips chips={filterChips} selected={filter} onChange={v => { setFilter(v); setPage(1); }} />

        {loading ? (
          <TableSkeleton rows={8} cols={9} />
        ) : null}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState icon={FileText} title="No leases found" description="Try adjusting your filters or search query." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-4 py-3 w-10">
                        <input type="checkbox" checked={allSelected} onChange={handleSelectAll} className="w-4 h-4 rounded border-border" />
                      </th>
                      <th className="text-left px-3 py-3">
                        <button onClick={() => toggleSort('leaseNumber')} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-accent-foreground">
                          Lease # <SortIcon k="leaseNumber" />
                        </button>
                      </th>
                      <th className="text-left px-3 py-3">
                        <button onClick={() => toggleSort('tenantName')} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-accent-foreground">
                          Tenant <SortIcon k="tenantName" />
                        </button>
                      </th>
                      <th className="text-left px-3 py-3 hidden md:table-cell">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Property</span>
                      </th>
                      <th className="text-left px-3 py-3 hidden lg:table-cell">
                        <button onClick={() => toggleSort('termStart')} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-accent-foreground">
                          Term <SortIcon k="termStart" />
                        </button>
                      </th>
                      <th className="text-left px-3 py-3 hidden xl:table-cell">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">CAM Type</span>
                      </th>
                      <th className="text-left px-3 py-3">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</span>
                      </th>
                      <th className="text-center px-3 py-3">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Discrep.</span>
                      </th>
                      <th className="px-3 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(lease => (
                      <tr key={lease.id} className="border-b border-border/30 hover:bg-accent transition-colors">
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selected.has(lease.id)} onChange={() => setSelected(s => { const n = new Set(s); n.has(lease.id) ? n.delete(lease.id) : n.add(lease.id); return n; })} className="w-4 h-4 rounded border-border" />
                        </td>
                        <td className="px-3 py-3">
                          <Link to={`/leases/${lease.id}`} className="text-sm font-semibold text-primary hover:text-primary">{lease.leaseNumber}</Link>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-sm font-medium text-foreground">{lease.tenantName}</p>
                          <p className="text-xs text-muted-foreground hidden sm:block">{formatCurrency(lease.baseRent)}/yr</p>
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell">
                          <p className="text-sm text-foreground/80">{lease.propertyName}</p>
                          <p className="text-xs text-muted-foreground/70">{lease.portfolioName}</p>
                        </td>
                        <td className="px-3 py-3 hidden lg:table-cell">
                          <p className="text-xs text-muted-foreground font-mono">{formatDate(lease.termStart)}</p>
                          <p className="text-xs text-muted-foreground/70 font-mono">{formatDate(lease.termEnd)}</p>
                        </td>
                        <td className="px-3 py-3 hidden xl:table-cell">
                          <CAMTypeBadge type={lease.camType} />
                        </td>
                        <td className="px-3 py-3"><StatusBadge status={lease.status} /></td>
                        <td className="px-3 py-3 text-center">
                          {lease.openDiscrepancies > 0 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-error-100 text-error-700 text-xs font-bold">{lease.openDiscrepancies}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 relative">
                          <button onClick={() => setOpenMenu(openMenu === lease.id ? null : lease.id)} className="p-1 text-muted-foreground/70 hover:text-accent-foreground hover:bg-accent rounded-md transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {openMenu === lease.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                              <div className="absolute right-0 top-8 z-20 w-40 bg-card border border-border rounded-xl shadow-lg py-1">
                                <button onClick={() => { navigate(`/leases/${lease.id}`); setOpenMenu(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground/80 hover:bg-accent">
                                  <Eye className="w-4 h-4 text-muted-foreground/70" /> View
                                </button>
                                <button onClick={() => { setEditLeaseId(lease.id); setOpenMenu(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground/80 hover:bg-accent">
                                  <Edit className="w-4 h-4 text-muted-foreground/70" /> Edit
                                </button>
                                <div className="border-t border-border/50 my-1" />
                                <button onClick={() => { setConfirmDelete(lease.id); setOpenMenu(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-error-600 hover:bg-error-50">
                                  <Trash2 className="w-4 h-4" /> Delete
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
                <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
              </div>
            </>
          )}
        </div>
      </div>

      <BulkActionToolbar
        selectedCount={selected.size}
        onClear={() => setSelected(new Set())}
        onDelete={() => { toast.success(`${selected.size} leases deleted`); setSelected(new Set()); }}
        onExport={() => toast.success('Export started')}
      />

      <NewLeaseModal open={newLeaseOpen} onClose={() => setNewLeaseOpen(false)} />
      <EditLeaseModal
        lease={editLeaseId ? leases.find(l => l.id === editLeaseId) : null}
        open={editLeaseId !== null}
        onClose={() => setEditLeaseId(null)}
      />

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-card rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-base font-semibold text-foreground mb-2">Delete Lease</h3>
            <p className="text-sm text-muted-foreground mb-5">Are you sure you want to delete this lease? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 border border-border rounded-lg text-sm text-foreground/80 hover:bg-accent">Cancel</button>
              <button onClick={() => { toast.success('Lease deleted'); setConfirmDelete(null); }} className="flex-1 py-2 bg-error-500 text-white rounded-lg text-sm font-medium hover:bg-error-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
