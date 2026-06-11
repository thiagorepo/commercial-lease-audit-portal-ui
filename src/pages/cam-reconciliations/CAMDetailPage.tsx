import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Shield, Lock } from 'lucide-react';
import { StatusBadge } from '@/components/custom/StatusBadge';
import { VarianceIndicator } from '@/components/custom/VarianceIndicator';
import { StatCard } from '@/components/custom/StatCard';
import { StatCardSkeleton } from '@/components/custom/TableSkeleton';
import { TableSkeleton } from '@/components/custom/TableSkeleton';
import { camReconciliations as mockData } from '@/data/mock';
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import type { CAMStatus, CAMItem, CAMReconciliation } from '@/types';

export function CAMDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cam, setCam] = useState<CAMReconciliation | null>(null);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState<CAMStatus>('draft');
  const [selectedItem, setSelectedItem] = useState<CAMItem | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    let cancelled = false;
    // Simulates a service call: replace mockData with camReconciliationService.getById(id)
    // when the service is implemented.
    const t = setTimeout(() => {
      if (!cancelled) {
        const found = mockData.find(c => c.id === id) ?? null;
        setCam(found);
        if (found) setStatus(found.status);
        setLoading(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [id]);

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <div className="h-4 w-32 bg-muted rounded animate-pulse mb-3" />
          <div className="h-6 w-64 bg-muted rounded animate-pulse" />
        </div>
        <StatCardSkeleton count={4} />
        <div className="mt-6">
          <TableSkeleton rows={8} cols={7} />
        </div>
      </div>
    );
  }

  if (!cam) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Reconciliation not found.</p>
        <Link to="/dashboard/cam-reconciliations" className="text-primary text-sm font-medium mt-2 inline-block">Back to CAM Audit</Link>
      </div>
    );
  }

  const transition = (next: CAMStatus, message: string) => {
    setStatus(next);
    toast.success(message);
  };

  const workflowActions: Record<string, { label: string; color: string; onClick: () => void }[]> = {
    draft: [
      { label: 'Submit', color: 'bg-primary hover:bg-primary/90 text-white', onClick: () => transition('submitted', 'Submitted for review') },
      { label: 'Edit', color: 'border border-border text-muted-foreground hover:bg-accent', onClick: () => toast.info('Edit mode') },
      { label: 'Delete', color: 'border border-error-200 text-error-600 hover:bg-error-50', onClick: () => toast.error('Reconciliation deleted') },
    ],
    submitted: [
      { label: 'Approve', color: 'bg-success-500 hover:bg-success-600 text-white', onClick: () => transition('approved', 'Reconciliation approved') },
      { label: 'Reject', color: 'border border-error-200 text-error-600 hover:bg-error-50', onClick: () => transition('rejected', 'Reconciliation rejected') },
    ],
    approved: [
      { label: 'Finalize', color: 'bg-success-500 hover:bg-success-600 text-white', onClick: () => transition('finalized', 'Reconciliation finalized') },
      { label: 'Reject', color: 'border border-error-200 text-error-600 hover:bg-error-50', onClick: () => transition('rejected', 'Reconciliation rejected') },
    ],
    rejected: [
      { label: 'Resubmit', color: 'bg-primary hover:bg-primary/90 text-white', onClick: () => transition('submitted', 'Resubmitted for review') },
      { label: 'Edit', color: 'border border-border text-muted-foreground hover:bg-accent', onClick: () => toast.info('Edit mode') },
    ],
  };

  const actions = workflowActions[status] || [];

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => navigate('/cam-reconciliations')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent-foreground mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to CAM Audit
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-foreground">{cam.leaseNumber} — FY {cam.fiscalYear}</h1>
              <StatusBadge status={status} />
            </div>
            <p className="text-sm text-muted-foreground">{cam.tenantName} · {cam.propertyName}</p>
          </div>
          {status === 'finalized' ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-lg text-sm text-muted-foreground">
              <Lock className="w-4 h-4" /> View only — finalized
            </div>
          ) : actions.length > 0 && (
            <div className="flex gap-2">
              {actions.map(a => (
                <button key={a.label} onClick={a.onClick} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${a.color}`}>
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Expenses" value={formatCurrency(cam.totalExpenses)} />
        <StatCard label="Pro-Rata Share" value={formatPercent(cam.proRataSharePercent)} />
        <StatCard label="Amount Billed" value={formatCurrency(cam.amountBilled)} />
        <div className="bg-card rounded-xl border border-border shadow-card p-5">
          <p className="text-sm text-muted-foreground font-medium">Variance</p>
          <div className="mt-2"><VarianceIndicator amount={cam.variance} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-card rounded-xl border border-border shadow-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Lease CAM Details</h3>
          <dl className="space-y-2.5">
            {[
              ['CAM Type', cam.camType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())],
              ['Pro-Rata Share', formatPercent(cam.proRataSharePercent)],
              ...(cam.capPercent ? [['Admin Cap', formatPercent(cam.capPercent)]] : []),
              ...(cam.baseYear ? [['Base Year', String(cam.baseYear)]] : []),
            ].map(([label, val]) => (
              <div key={String(label)} className="flex justify-between">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="text-sm font-medium text-foreground">{val}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="xl:col-span-2 bg-card rounded-xl border border-border shadow-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Reconciliation Info</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Created By', cam.createdBy, cam.createdAt],
              ...(cam.submittedBy ? [['Submitted By', cam.submittedBy, cam.submittedAt!]] : []),
              ...(cam.approvedBy ? [['Approved By', cam.approvedBy, cam.approvedAt!]] : []),
              ...(cam.finalizedBy ? [['Finalized By', cam.finalizedBy, cam.finalizedAt!]] : []),
            ].map(([label, name, date]) => (
              <div key={String(label)}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold text-foreground">{name}</p>
                <p className="text-xs text-muted-foreground/70">{formatDate(date)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card mb-6">
        <div className="px-5 py-4 border-b border-border/50">
          <h3 className="text-sm font-semibold text-foreground">CAM Items Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border/50">
              <tr>
                {['Category', 'Description', 'Total Amount', 'Tenant Share %', 'Tenant Amount', 'Pass-through', 'Cap'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(
                cam.items.reduce((groups, item) => {
                  if (!groups[item.category]) groups[item.category] = [];
                  groups[item.category].push(item);
                  return groups;
                }, {} as Record<string, typeof cam.items>)
              ).map(([category, items]) => (
                <React.Fragment key={category}>
                  {items.map((item, itemIdx) => (
                    <tr
                      key={item.id}
                      className={cn('border-b border-border/30 hover:bg-accent transition-colors cursor-pointer', itemIdx === 0 ? 'border-t border-border' : '')}
                      onClick={() => { setSelectedItem(item); setNote(''); }}
                    >
                      <td className="px-5 py-3">
                        {itemIdx === 0 ? <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-foreground/80">{item.category}</span> : null}
                      </td>
                      <td className="px-5 py-3 text-sm text-foreground/80">{item.description}</td>
                      <td className="px-5 py-3 text-sm font-medium text-foreground">{formatCurrency(item.totalAmount)}</td>
                      <td className="px-5 py-3 text-sm text-foreground/80">{formatPercent(item.tenantSharePercent)}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-foreground">{formatCurrency(item.tenantDollarAmount)}</td>
                      <td className="px-5 py-3 text-center">
                        {item.isPassThrough ? <CheckCircle className="w-4 h-4 text-success-500 mx-auto" /> : <span className="text-muted-foreground/50">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        {item.capPercent ? (
                          <div className="flex items-center gap-1 text-xs text-warning-700">
                            <Shield className="w-3.5 h-3.5" /> {item.capPercent}% cap
                          </div>
                        ) : <span className="text-muted-foreground/50 text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                  <tr key={`subtotal-${category}`} className="bg-muted border-b border-border">
                    <td className="px-5 py-2 text-xs font-semibold text-muted-foreground">{category} subtotal</td>
                    <td colSpan={3} />
                    <td className="px-5 py-2 text-sm font-bold text-foreground">{formatCurrency(items.reduce((a, i) => a + i.tenantDollarAmount, 0))}</td>
                    <td colSpan={2} />
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
            <tfoot className="bg-primary/10 border-t-2 border-primary/30">
              <tr>
                <td colSpan={4} className="px-5 py-3 text-sm font-bold text-primary">Grand Total</td>
                <td className="px-5 py-3 text-base font-bold text-primary">{formatCurrency(cam.items.reduce((a, i) => a + i.tenantDollarAmount, 0))}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {cam.exclusions.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Exclusions Applied</h3>
          <ul className="space-y-2">
            {cam.exclusions.map((ex, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                <div className="w-1.5 h-1.5 rounded-full bg-warning-500 shrink-0 mt-1.5" />
                {ex}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Sheet open={!!selectedItem} onOpenChange={(open) => { if (!open) setSelectedItem(null); }}>
        <SheetContent className="w-full sm:max-w-md">
          {selectedItem && (
            <>
              <SheetHeader>
                <SheetTitle className="capitalize">{selectedItem.category.replace(/-/g, ' ')}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm font-medium text-foreground">{selectedItem.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(selectedItem.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tenant Amount</p>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(selectedItem.tenantDollarAmount)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tenant Share</p>
                  <p className="text-sm font-semibold text-foreground">{formatPercent(selectedItem.tenantSharePercent)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Pass-through</p>
                    <p className="text-sm font-medium text-foreground">{selectedItem.isPassThrough ? 'Yes' : 'No'}</p>
                  </div>
                  {selectedItem.capPercent && (
                    <div>
                      <p className="text-sm text-muted-foreground">Cap</p>
                      <p className="text-sm font-medium text-warning-700">{selectedItem.capPercent}%</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a note about this item..."
                    className="min-h-[80px]"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => { toast.success('Item approved'); setSelectedItem(null); }}
                    className="flex-1 py-2 bg-success-500 text-white text-sm font-medium rounded-lg hover:bg-success-600 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => { toast.warning('Item flagged'); setSelectedItem(null); }}
                    className="flex-1 py-2 border border-warning-200 text-warning-700 text-sm font-medium rounded-lg hover:bg-warning-50 transition-colors"
                  >
                    Flag
                  </button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
