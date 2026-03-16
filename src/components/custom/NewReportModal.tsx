import { useState } from 'react';
import { X, BarChart3 } from 'lucide-react';
import { portfolios, leases } from '@/data/mock';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ReportType } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const reportTypes: { value: ReportType; label: string; description: string }[] = [
  { value: 'portfolio-summary', label: 'Portfolio Summary', description: 'High-level overview of all leases across a portfolio' },
  { value: 'lease-specific', label: 'Lease Specific', description: 'Detailed audit report for a single lease' },
  { value: 'cam-audit', label: 'CAM Audit', description: 'CAM reconciliation findings and analysis' },
  { value: 'annual-review', label: 'Annual Review', description: 'Comprehensive annual audit report' },
];

export function NewReportModal({ open, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: 'portfolio-summary' as ReportType,
    scopeType: 'portfolio',
    portfolioId: '',
    leaseId: '',
    periodStart: '',
    periodEnd: '',
    executiveSummary: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Required';
    if (!form.periodStart) e.periodStart = 'Required';
    if (!form.periodEnd) e.periodEnd = 'Required';
    if (form.periodStart && form.periodEnd && form.periodEnd <= form.periodStart) e.periodEnd = 'End must be after start';
    if (form.type === 'lease-specific' && !form.leaseId) e.leaseId = 'Required for lease-specific reports';
    if (form.type !== 'lease-specific' && form.scopeType === 'portfolio' && !form.portfolioId) e.portfolioId = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(`Report "${form.title}" created as draft`);
      onClose();
      setForm({ title: '', type: 'portfolio-summary', scopeType: 'portfolio', portfolioId: '', leaseId: '', periodStart: '', periodEnd: '', executiveSummary: '' });
    }, 1000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-lg animate-fade-in max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-success-50 border border-success-100 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-success-600" />
            </div>
            <h2 className="text-base font-semibold text-foreground">New Report</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground/70 hover:text-accent-foreground hover:bg-accent rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 space-y-5">
          <div>
            <label className="text-xs font-medium text-foreground/80 block mb-1">Report Title <span className="text-error-500">*</span></label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Q1 2024 CAM Audit — Northeast Portfolio"
              className={cn('w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring', errors.title ? 'border-error-400 bg-error-50' : 'border-border')} />
            {errors.title && <p className="text-xs text-error-600 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-foreground/80 block mb-2">Report Type</label>
            <div className="space-y-2">
              {reportTypes.map(rt => (
                <label key={rt.value} className={cn('flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all', form.type === rt.value ? 'border-primary bg-primary/10' : 'border-border hover:border-border')}>
                  <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0', form.type === rt.value ? 'border-primary' : 'border-border')}>
                    {form.type === rt.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <input type="radio" className="sr-only" checked={form.type === rt.value} onChange={() => set('type', rt.value)} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{rt.label}</p>
                    <p className="text-xs text-muted-foreground">{rt.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground/80 block mb-2">Scope</label>
            {form.type === 'lease-specific' ? (
              <div>
                <select value={form.leaseId} onChange={e => set('leaseId', e.target.value)}
                  className={cn('w-full border rounded-lg px-3 py-2 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring', errors.leaseId ? 'border-error-400 bg-error-50' : 'border-border')}>
                  <option value="">Select lease...</option>
                  {leases.map(l => <option key={l.id} value={l.id}>{l.leaseNumber} — {l.tenantName}</option>)}
                </select>
                {errors.leaseId && <p className="text-xs text-error-600 mt-1">{errors.leaseId}</p>}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-3">
                  {[{ value: 'all', label: 'All Portfolios' }, { value: 'portfolio', label: 'Specific Portfolio' }].map(opt => (
                    <label key={opt.value} className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-all', form.scopeType === opt.value ? 'border-primary/70 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-border')}>
                      <input type="radio" className="sr-only" checked={form.scopeType === opt.value} onChange={() => set('scopeType', opt.value)} />
                      {opt.label}
                    </label>
                  ))}
                </div>
                {form.scopeType === 'portfolio' && (
                  <div>
                    <select value={form.portfolioId} onChange={e => set('portfolioId', e.target.value)}
                      className={cn('w-full border rounded-lg px-3 py-2 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring', errors.portfolioId ? 'border-error-400 bg-error-50' : 'border-border')}>
                      <option value="">Select portfolio...</option>
                      {portfolios.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    {errors.portfolioId && <p className="text-xs text-error-600 mt-1">{errors.portfolioId}</p>}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground/80 block mb-1">Period Start <span className="text-error-500">*</span></label>
              <input type="date" value={form.periodStart} onChange={e => set('periodStart', e.target.value)}
                className={cn('w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring', errors.periodStart ? 'border-error-400 bg-error-50' : 'border-border')} />
              {errors.periodStart && <p className="text-xs text-error-600 mt-1">{errors.periodStart}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80 block mb-1">Period End <span className="text-error-500">*</span></label>
              <input type="date" value={form.periodEnd} onChange={e => set('periodEnd', e.target.value)}
                className={cn('w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring', errors.periodEnd ? 'border-error-400 bg-error-50' : 'border-border')} />
              {errors.periodEnd && <p className="text-xs text-error-600 mt-1">{errors.periodEnd}</p>}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground/80 block mb-1">Executive Summary <span className="text-muted-foreground/70 font-normal">(optional)</span></label>
            <textarea value={form.executiveSummary} onChange={e => set('executiveSummary', e.target.value)} rows={3}
              placeholder="Brief overview of the audit scope and key objectives..."
              className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
          </div>
        </div>

        <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-border/50 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground/80 hover:bg-accent transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
            {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</> : 'Create Draft Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
