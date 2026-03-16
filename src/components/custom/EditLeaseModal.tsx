import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { properties } from '@/data/mock';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Lease, CAMType } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  lease: Lease | null;
}

const camTypes: { value: CAMType; label: string }[] = [
  { value: 'gross', label: 'Gross' },
  { value: 'net', label: 'Net' },
  { value: 'modified-gross', label: 'Modified Gross' },
  { value: 'triple-net', label: 'Triple Net' },
  { value: 'base-year', label: 'Base Year' },
];

export function EditLeaseModal({ open, onClose, lease }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    leaseNumber: lease?.leaseNumber ?? '',
    status: lease?.status ?? 'active',
    camType: lease?.camType ?? 'gross',
    termStart: lease?.termStart?.split('T')[0] ?? '',
    termEnd: lease?.termEnd?.split('T')[0] ?? '',
    tenantName: lease?.tenantName ?? '',
    tenantContact: lease?.tenantContact ?? '',
    tenantPhone: lease?.tenantPhone ?? '',
    tenantEmail: lease?.tenantEmail ?? '',
    tenantAddress: lease?.tenantAddress ?? '',
    baseRent: String(lease?.baseRent ?? ''),
    squareFootage: String(lease?.squareFootage ?? ''),
    escalationRate: String(lease?.escalationRate ?? ''),
    renewalOption: lease?.renewalOption ?? false,
  });

  useEffect(() => {
    if (lease) {
      setForm({
        leaseNumber: lease.leaseNumber ?? '',
        status: lease.status ?? 'active',
        camType: lease.camType ?? 'gross',
        termStart: lease.termStart?.split('T')[0] ?? '',
        termEnd: lease.termEnd?.split('T')[0] ?? '',
        tenantName: lease.tenantName ?? '',
        tenantContact: lease.tenantContact ?? '',
        tenantPhone: lease.tenantPhone ?? '',
        tenantEmail: lease.tenantEmail ?? '',
        tenantAddress: lease.tenantAddress ?? '',
        baseRent: String(lease.baseRent ?? ''),
        squareFootage: String(lease.squareFootage ?? ''),
        escalationRate: String(lease.escalationRate ?? ''),
        renewalOption: lease.renewalOption ?? false,
      });
    }
  }, [lease]);

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Lease updated successfully');
      onClose();
    }, 900);
  };

  if (!open || !lease) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-2xl animate-fade-in max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-border/50 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-foreground">Edit Lease</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{lease.leaseNumber} — {lease.tenantName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground/70 hover:text-accent-foreground hover:bg-accent rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="col-span-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 pb-2 border-b border-border/50">Lease Details</h3>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80 block mb-1">Lease Number</label>
              <input value={form.leaseNumber} onChange={e => set('leaseNumber', e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80 block mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring">
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80 block mb-1">CAM Type</label>
              <select value={form.camType} onChange={e => set('camType', e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring">
                {camTypes.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80 block mb-1">Annual Escalation (%)</label>
              <input type="number" step="0.1" value={form.escalationRate} onChange={e => set('escalationRate', e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80 block mb-1">Term Start</label>
              <input type="date" value={form.termStart} onChange={e => set('termStart', e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80 block mb-1">Term End</label>
              <input type="date" value={form.termEnd} onChange={e => set('termEnd', e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
            </div>

            <div className="col-span-2 mt-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 pb-2 border-b border-border/50">Tenant Information</h3>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-foreground/80 block mb-1">Tenant Name</label>
              <input value={form.tenantName} onChange={e => set('tenantName', e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80 block mb-1">Contact Person</label>
              <input value={form.tenantContact} onChange={e => set('tenantContact', e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80 block mb-1">Phone</label>
              <input value={form.tenantPhone} onChange={e => set('tenantPhone', e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-foreground/80 block mb-1">Email</label>
              <input type="email" value={form.tenantEmail} onChange={e => set('tenantEmail', e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-foreground/80 block mb-1">Billing Address</label>
              <input value={form.tenantAddress} onChange={e => set('tenantAddress', e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
            </div>

            <div className="col-span-2 mt-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 pb-2 border-b border-border/50">Financial Terms</h3>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80 block mb-1">Annual Base Rent ($)</label>
              <input type="number" value={form.baseRent} onChange={e => set('baseRent', e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80 block mb-1">Square Footage</label>
              <input type="number" value={form.squareFootage} onChange={e => set('squareFootage', e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <button type="button" onClick={() => set('renewalOption', !form.renewalOption)}
                className={cn('relative w-11 h-6 rounded-full transition-colors shrink-0', form.renewalOption ? 'bg-primary' : 'bg-muted')}>
                <div className={cn('absolute top-1 w-4 h-4 bg-card rounded-full shadow transition-transform', form.renewalOption ? 'left-6' : 'left-1')} />
              </button>
              <span className="text-sm text-foreground/80">Renewal Option included</span>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-border/50 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground/80 hover:bg-accent transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
            {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}
