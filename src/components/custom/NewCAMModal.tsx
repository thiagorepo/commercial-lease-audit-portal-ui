import { useState } from 'react';
import { X, Calculator, Plus, Trash2 } from 'lucide-react';
import { leases } from '@/data/mock';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultLeaseId?: string;
}

interface CAMItemRow {
  id: string;
  category: string;
  description: string;
  totalAmount: string;
  tenantSharePercent: string;
  isPassThrough: boolean;
}

export function NewCAMModal({ open, onClose, defaultLeaseId }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    leaseId: defaultLeaseId || '',
    fiscalYear: String(new Date().getFullYear()),
    capPercent: '',
    baseYear: '',
  });
  const [items, setItems] = useState<CAMItemRow[]>([
    { id: '1', category: 'Maintenance', description: '', totalAmount: '', tenantSharePercent: '', isPassThrough: false },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setField = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const addItem = () => {
    setItems(prev => [...prev, { id: Date.now().toString(), category: '', description: '', totalAmount: '', tenantSharePercent: '', isPassThrough: false }]);
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const updateItem = (id: string, k: keyof CAMItemRow, v: string | boolean) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [k]: v } : i));
  };

  const totalExpenses = items.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
  const itemsWithShare = items.filter(i => i.tenantSharePercent);
  const avgShare = itemsWithShare.length > 0 ? itemsWithShare.reduce((s, i) => s + (Number(i.tenantSharePercent) || 0), 0) / itemsWithShare.length : 0;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.leaseId) e.leaseId = 'Required';
    if (!form.fiscalYear) e.fiscalYear = 'Required';
    if (items.every(i => !i.totalAmount)) e.items = 'Add at least one CAM item with an amount';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const lease = leases.find(l => l.id === form.leaseId);
      toast.success(`CAM reconciliation for FY ${form.fiscalYear} created — ${lease?.tenantName}`);
      onClose();
    }, 1000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-2xl animate-fade-in max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground">New CAM Reconciliation</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground/70 hover:text-accent-foreground hover:bg-accent rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-medium text-foreground/80 block mb-1">Lease <span className="text-error-500">*</span></label>
              <select value={form.leaseId} onChange={e => setField('leaseId', e.target.value)}
                className={cn('w-full border rounded-lg px-3 py-2 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring', errors.leaseId ? 'border-error-400 bg-error-50' : 'border-border')}>
                <option value="">Select lease...</option>
                {leases.map(l => <option key={l.id} value={l.id}>{l.leaseNumber} — {l.tenantName}</option>)}
              </select>
              {errors.leaseId && <p className="text-xs text-error-600 mt-1">{errors.leaseId}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80 block mb-1">Fiscal Year <span className="text-error-500">*</span></label>
              <select value={form.fiscalYear} onChange={e => setField('fiscalYear', e.target.value)}
                className={cn('w-full border rounded-lg px-3 py-2 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring', errors.fiscalYear ? 'border-error-400 bg-error-50' : 'border-border')}>
                {['2025', '2024', '2023', '2022'].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80 block mb-1">CAM Cap (%)</label>
              <input type="number" step="0.1" value={form.capPercent} onChange={e => setField('capPercent', e.target.value)} placeholder="e.g. 5.0"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-foreground">CAM Items</label>
              <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary font-medium">
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
            {errors.items && <p className="text-xs text-error-600 mb-2">{errors.items}</p>}
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={item.id} className="p-3 bg-muted rounded-xl border border-border/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Item {idx + 1}</span>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(item.id)} className="text-muted-foreground/70 hover:text-error-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Category</label>
                      <select value={item.category} onChange={e => updateItem(item.id, 'category', e.target.value)}
                        className="w-full border border-border rounded-lg px-2 py-1.5 text-xs text-foreground/80 focus:outline-none focus:ring-1 focus:ring-ring/20 bg-card">
                        {['Maintenance', 'Insurance', 'Utilities', 'Management', 'Taxes', 'Landscaping', 'Security', 'Other'].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Description</label>
                      <input value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="Brief description"
                        className="w-full border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring/20 bg-card" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Total Amount ($)</label>
                      <input type="number" value={item.totalAmount} onChange={e => updateItem(item.id, 'totalAmount', e.target.value)} placeholder="0"
                        className="w-full border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring/20 bg-card" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Tenant Share (%)</label>
                      <input type="number" step="0.1" value={item.tenantSharePercent} onChange={e => updateItem(item.id, 'tenantSharePercent', e.target.value)} placeholder="0"
                        className="w-full border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring/20 bg-card" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={item.isPassThrough} onChange={e => updateItem(item.id, 'isPassThrough', e.target.checked)} className="w-3.5 h-3.5 rounded border-border" />
                    <span className="text-xs text-muted-foreground">Pass-through item</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {totalExpenses > 0 && (
            <div className="grid grid-cols-2 gap-3 p-4 bg-primary/10 rounded-xl border border-primary/20">
              <div>
                <p className="text-xs text-primary">Total CAM Expenses</p>
                <p className="text-base font-bold text-primary">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalExpenses)}</p>
              </div>
              {avgShare > 0 && (
                <div>
                  <p className="text-xs text-primary">Avg. Tenant Share</p>
                  <p className="text-base font-bold text-primary">{avgShare.toFixed(1)}%</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border/50 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground/80 hover:bg-accent transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
            {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : 'Create as Draft'}
          </button>
        </div>
      </div>
    </div>
  );
}
