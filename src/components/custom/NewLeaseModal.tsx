import { useState } from 'react';
import { X, Building2, User, DollarSign } from 'lucide-react';
import { properties } from '@/data/mock';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DatePicker } from '@/components/ui/date-picker';
import type { CAMType } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const camTypes: { value: CAMType; label: string }[] = [
  { value: 'gross', label: 'Gross' },
  { value: 'net', label: 'Net' },
  { value: 'modified-gross', label: 'Modified Gross' },
  { value: 'triple-net', label: 'Triple Net' },
  { value: 'base-year', label: 'Base Year' },
];

const steps = ['Lease Info', 'Tenant', 'Financial'];

export function NewLeaseModal({ open, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    leaseNumber: '',
    propertyId: '',
    status: 'active',
    camType: 'gross' as CAMType,
    termStart: undefined as Date | undefined,
    termEnd: undefined as Date | undefined,
    tenantName: '',
    tenantContact: '',
    tenantPhone: '',
    tenantEmail: '',
    tenantAddress: '',
    baseRent: '',
    squareFootage: '',
    escalationRate: '',
    renewalOption: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string | boolean | Date | undefined) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const validateStep = () => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!form.leaseNumber.trim()) e.leaseNumber = 'Required';
      if (!form.propertyId) e.propertyId = 'Required';
      if (!form.termStart) e.termStart = 'Required';
      if (!form.termEnd) e.termEnd = 'Required';
      if (form.termStart && form.termEnd && form.termEnd <= form.termStart) e.termEnd = 'End must be after start date';
    }
    if (step === 1) {
      if (!form.tenantName.trim()) e.tenantName = 'Required';
      if (!form.tenantEmail.trim()) e.tenantEmail = 'Required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.tenantEmail)) e.tenantEmail = 'Invalid email';
    }
    if (step === 2) {
      if (!form.baseRent || isNaN(Number(form.baseRent))) e.baseRent = 'Enter a valid amount';
      if (!form.squareFootage || isNaN(Number(form.squareFootage))) e.squareFootage = 'Enter a valid number';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validateStep()) setStep(s => s + 1); };
  const handleBack = () => setStep(s => s - 1);
  const handleSubmit = () => {
    if (!validateStep()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(`Lease ${form.leaseNumber} created successfully`);
      onClose();
      setStep(0);
      setForm({
        leaseNumber: '', propertyId: '', status: 'active', camType: 'gross',
        termStart: undefined, termEnd: undefined, tenantName: '', tenantContact: '', tenantPhone: '',
        tenantEmail: '', tenantAddress: '', baseRent: '', squareFootage: '', escalationRate: '', renewalOption: false,
      });
    }, 1200);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-lg animate-fade-in overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-border/50">
          <div>
            <h2 className="text-base font-semibold text-foreground">New Lease</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Step {step + 1} of {steps.length} — {steps[step]}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground/70 hover:text-accent-foreground hover:bg-accent rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 pt-3 pb-2 sm:px-6 sm:pt-4">
          <div className="flex gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex-1">
                <div className={cn('h-1.5 rounded-full transition-colors', i <= step ? 'bg-primary' : 'bg-muted')} />
                <p className={cn('text-xs mt-1.5 font-medium', i === step ? 'text-primary' : 'text-muted-foreground/70')}>{s}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 py-3 sm:px-6 sm:py-4 space-y-4 min-h-[320px]">
          {step === 0 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Lease Information</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-foreground/80 block mb-1">Lease Number <span className="text-error-500">*</span></label>
                  <input value={form.leaseNumber} onChange={e => set('leaseNumber', e.target.value)} placeholder="e.g. LS-2024-013"
                    className={cn('w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring', errors.leaseNumber ? 'border-error-400 bg-error-50' : 'border-border')} />
                  {errors.leaseNumber && <p className="text-xs text-error-600 mt-1">{errors.leaseNumber}</p>}
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-foreground/80 block mb-1">Property <span className="text-error-500">*</span></label>
                  <select value={form.propertyId} onChange={e => set('propertyId', e.target.value)}
                    className={cn('w-full border rounded-lg px-3 py-2 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring', errors.propertyId ? 'border-error-400 bg-error-50' : 'border-border')}>
                    <option value="">Select property...</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name} — {p.city}, {p.state}</option>)}
                  </select>
                  {errors.propertyId && <p className="text-xs text-error-600 mt-1">{errors.propertyId}</p>}
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
                  <label className="text-xs font-medium text-foreground/80 block mb-1">Term Start <span className="text-error-500">*</span></label>
                  <DatePicker
                    value={form.termStart}
                    onChange={d => set('termStart', d)}
                    placeholder="Select start date"
                    className={cn(errors.termStart && 'border-error-400 bg-error-50')}
                  />
                  {errors.termStart && <p className="text-xs text-error-600 mt-1">{errors.termStart}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground/80 block mb-1">Term End <span className="text-error-500">*</span></label>
                  <DatePicker
                    value={form.termEnd}
                    onChange={d => set('termEnd', d)}
                    placeholder="Select end date"
                    className={cn(errors.termEnd && 'border-error-400 bg-error-50')}
                  />
                  {errors.termEnd && <p className="text-xs text-error-600 mt-1">{errors.termEnd}</p>}
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Tenant Information</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-foreground/80 block mb-1">Tenant Name <span className="text-error-500">*</span></label>
                  <input value={form.tenantName} onChange={e => set('tenantName', e.target.value)} placeholder="Company or individual name"
                    className={cn('w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring', errors.tenantName ? 'border-error-400 bg-error-50' : 'border-border')} />
                  {errors.tenantName && <p className="text-xs text-error-600 mt-1">{errors.tenantName}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground/80 block mb-1">Contact Person</label>
                  <input value={form.tenantContact} onChange={e => set('tenantContact', e.target.value)} placeholder="Full name"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground/80 block mb-1">Phone</label>
                  <input value={form.tenantPhone} onChange={e => set('tenantPhone', e.target.value)} placeholder="(555) 000-0000"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-foreground/80 block mb-1">Email <span className="text-error-500">*</span></label>
                  <input type="email" value={form.tenantEmail} onChange={e => set('tenantEmail', e.target.value)} placeholder="contact@company.com"
                    className={cn('w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring', errors.tenantEmail ? 'border-error-400 bg-error-50' : 'border-border')} />
                  {errors.tenantEmail && <p className="text-xs text-error-600 mt-1">{errors.tenantEmail}</p>}
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-foreground/80 block mb-1">Billing Address</label>
                  <input value={form.tenantAddress} onChange={e => set('tenantAddress', e.target.value)} placeholder="Street, City, State ZIP"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Financial Terms</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-foreground/80 block mb-1">Annual Base Rent ($) <span className="text-error-500">*</span></label>
                  <input type="number" value={form.baseRent} onChange={e => set('baseRent', e.target.value)} placeholder="0"
                    className={cn('w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring', errors.baseRent ? 'border-error-400 bg-error-50' : 'border-border')} />
                  {errors.baseRent && <p className="text-xs text-error-600 mt-1">{errors.baseRent}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground/80 block mb-1">Square Footage <span className="text-error-500">*</span></label>
                  <input type="number" value={form.squareFootage} onChange={e => set('squareFootage', e.target.value)} placeholder="0"
                    className={cn('w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring', errors.squareFootage ? 'border-error-400 bg-error-50' : 'border-border')} />
                  {errors.squareFootage && <p className="text-xs text-error-600 mt-1">{errors.squareFootage}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground/80 block mb-1">Annual Escalation Rate (%)</label>
                  <input type="number" step="0.1" value={form.escalationRate} onChange={e => set('escalationRate', e.target.value)} placeholder="3.0"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <button type="button" onClick={() => set('renewalOption', !form.renewalOption)}
                    className={cn('relative w-11 h-6 rounded-full transition-colors shrink-0', form.renewalOption ? 'bg-primary' : 'bg-muted')}>
                    <div className={cn('absolute top-1 w-4 h-4 bg-card rounded-full shadow transition-transform', form.renewalOption ? 'left-6' : 'left-1')} />
                  </button>
                  <label className="text-sm text-foreground/80 cursor-pointer" onClick={() => set('renewalOption', !form.renewalOption)}>
                    Renewal Option
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-border/50 flex gap-3">
          {step > 0 && (
            <button onClick={handleBack} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground/80 hover:bg-accent transition-colors">
              Back
            </button>
          )}
          {step < steps.length - 1 ? (
            <button onClick={handleNext} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
              Next: {steps[step + 1]}
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</> : 'Create Lease'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
