import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { leases, users } from '@/data/mock';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { DiscrepancyCategory, DiscrepancyPriority } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultLeaseId?: string;
}

const categories: { value: DiscrepancyCategory; label: string }[] = [
  { value: 'rent-overcharge', label: 'Rent Overcharge' },
  { value: 'cam-overcharge', label: 'CAM Overcharge' },
  { value: 'late-fee', label: 'Late Fee' },
  { value: 'error', label: 'Billing Error' },
  { value: 'other', label: 'Other' },
];

const priorities: { value: DiscrepancyPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'border-secondary-300 text-secondary-600' },
  { value: 'medium', label: 'Medium', color: 'border-warning-300 text-warning-700' },
  { value: 'high', label: 'High', color: 'border-warning-400 text-warning-700' },
  { value: 'urgent', label: 'Urgent', color: 'border-error-400 text-error-700' },
];

export function NewDiscrepancyModal({ open, onClose, defaultLeaseId }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    leaseId: defaultLeaseId || '',
    category: 'rent-overcharge' as DiscrepancyCategory,
    priority: 'medium' as DiscrepancyPriority,
    description: '',
    expectedAmount: '',
    actualAmount: '',
    assignedTo: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.leaseId) e.leaseId = 'Required';
    if (!form.description.trim()) e.description = 'Required';
    if (!form.expectedAmount || isNaN(Number(form.expectedAmount))) e.expectedAmount = 'Enter a valid amount';
    if (!form.actualAmount || isNaN(Number(form.actualAmount))) e.actualAmount = 'Enter a valid amount';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const variance = Number(form.expectedAmount || 0) - Number(form.actualAmount || 0);

  const handleSubmit = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Discrepancy created and assigned');
      onClose();
      setForm({ leaseId: defaultLeaseId || '', category: 'rent-overcharge', priority: 'medium', description: '', expectedAmount: '', actualAmount: '', assignedTo: '' });
    }, 1000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-lg animate-fade-in flex flex-col max-h-[90vh] sm:max-h-auto">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-warning-50 border border-warning-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-warning-600" />
            </div>
            <h2 className="text-base font-semibold text-foreground">New Discrepancy</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground/70 hover:text-accent-foreground hover:bg-accent rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-4 sm:px-6 sm:py-5 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-medium text-foreground/80 block mb-1">Lease <span className="text-error-500">*</span></label>
              <select value={form.leaseId} onChange={e => set('leaseId', e.target.value)}
                className={cn('w-full border rounded-lg px-3 py-2 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring', errors.leaseId ? 'border-error-400 bg-error-50' : 'border-border')}>
                <option value="">Select lease...</option>
                {leases.map(l => <option key={l.id} value={l.id}>{l.leaseNumber} — {l.tenantName}</option>)}
              </select>
              {errors.leaseId && <p className="text-xs text-error-600 mt-1">{errors.leaseId}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-foreground/80 block mb-1">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring">
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground/80 block mb-1">Priority</label>
              <div className="grid grid-cols-2 gap-1.5">
                {priorities.map(p => (
                  <button key={p.value} type="button" onClick={() => set('priority', p.value)}
                    className={cn('py-1.5 rounded-lg text-xs font-semibold border-2 transition-colors', form.priority === p.value ? `${p.color} bg-opacity-10` : 'border-border text-muted-foreground hover:border-border',
                      form.priority === p.value && p.value === 'low' ? 'bg-secondary-50' :
                      form.priority === p.value && p.value === 'medium' ? 'bg-warning-50' :
                      form.priority === p.value && p.value === 'high' ? 'bg-warning-50' :
                      form.priority === p.value && p.value === 'urgent' ? 'bg-error-50' : '')}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-2">
              <label className="text-xs font-medium text-foreground/80 block mb-1">Description <span className="text-error-500">*</span></label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
                placeholder="Describe the discrepancy in detail..."
                className={cn('w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring', errors.description ? 'border-error-400 bg-error-50' : 'border-border')} />
              {errors.description && <p className="text-xs text-error-600 mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-foreground/80 block mb-1">Expected Amount ($) <span className="text-error-500">*</span></label>
              <input type="number" value={form.expectedAmount} onChange={e => set('expectedAmount', e.target.value)} placeholder="0"
                className={cn('w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring', errors.expectedAmount ? 'border-error-400 bg-error-50' : 'border-border')} />
              {errors.expectedAmount && <p className="text-xs text-error-600 mt-1">{errors.expectedAmount}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-foreground/80 block mb-1">Actual Amount ($) <span className="text-error-500">*</span></label>
              <input type="number" value={form.actualAmount} onChange={e => set('actualAmount', e.target.value)} placeholder="0"
                className={cn('w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring', errors.actualAmount ? 'border-error-400 bg-error-50' : 'border-border')} />
              {errors.actualAmount && <p className="text-xs text-error-600 mt-1">{errors.actualAmount}</p>}
            </div>

            {(form.expectedAmount || form.actualAmount) && !isNaN(variance) && (
              <div className="col-span-2 p-3 rounded-xl bg-muted border border-border/50">
                <p className="text-xs text-muted-foreground mb-0.5">Calculated Variance</p>
                <p className={cn('text-lg font-bold', variance > 0 ? 'text-error-600' : variance < 0 ? 'text-success-600' : 'text-muted-foreground')}>
                  {variance > 0 ? '+' : ''}{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(variance)}
                </p>
              </div>
            )}

            <div className="col-span-2">
              <label className="text-xs font-medium text-foreground/80 block mb-1">Assign To</label>
              <select value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring">
                <option value="">Unassigned</option>
                {users.filter(u => u.status === 'active').map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-border/50 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground/80 hover:bg-accent transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
            {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</> : 'Create Discrepancy'}
          </button>
        </div>
      </div>
    </div>
  );
}
