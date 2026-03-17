import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

function PasswordStrength({ password }: { password: string }) {
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(password)).length;
  const labels = ['', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['', 'bg-error-500', 'bg-warning-500', 'bg-success-500', 'bg-success-600'];
  const textColors = ['', 'text-error-600', 'text-warning-600', 'text-success-600', 'text-success-700'];
  if (!password) return null;
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {[1,2,3,4].map(i => (
          <div key={i} className={cn('h-1 flex-1 rounded-full transition-all', i <= score ? colors[score] : 'bg-muted')} />
        ))}
      </div>
      <p className={cn('text-xs font-medium', textColors[score])}>{labels[score]}</p>
    </div>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', orgName: '', orgType: '', leaseCount: '', termsAccepted: false });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string | boolean) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.email) e.email = 'Email is required';
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!form.orgName) e.orgName = 'Organization name is required';
    if (!form.orgType) e.orgType = 'Select an organization type';
    if (!form.termsAccepted) e.terms = 'You must accept the Terms of Service';
    return e;
  };

  const handleNext = () => {
    const e = validateStep1();
    if (Object.keys(e).length) { setErrors(e); return; }
    setStep(2);
  };

  const handleCreate = () => {
    const e = validateStep2();
    if (Object.keys(e).length) { setErrors(e); return; }
    setTimeout(() => navigate('/dashboard/overview'), 500);
  };

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Create account</h2>
          <p className="text-sm text-muted-foreground">Step {step} of 2</p>
        </div>
        <div className="flex gap-1.5">
          {[1,2].map(s => (
            <div key={s} className={cn('w-8 h-1.5 rounded-full transition-all', s <= step ? 'bg-primary' : 'bg-muted')} />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground/80 block mb-1">Email address</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com"
              className={cn('w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring', errors.email ? 'border-error-500 bg-error-50' : 'border-border')} />
            {errors.email && <p className="text-xs text-error-600 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground/80 block mb-1">Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="At least 8 characters"
                className={cn('w-full border rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring', errors.password ? 'border-error-500 bg-error-50' : 'border-border')} />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-accent-foreground">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-error-600 mt-1">{errors.password}</p>}
            <PasswordStrength password={form.password} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground/80 block mb-1">Confirm password</label>
            <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="Re-enter password"
              className={cn('w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring', errors.confirmPassword ? 'border-error-500 bg-error-50' : 'border-border')} />
            {errors.confirmPassword && <p className="text-xs text-error-600 mt-1">{errors.confirmPassword}</p>}
          </div>
          <button onClick={handleNext} className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">Next</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground/80 block mb-1">Organization name</label>
            <input type="text" value={form.orgName} onChange={e => set('orgName', e.target.value)} placeholder="Your company name"
              className={cn('w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring', errors.orgName ? 'border-error-500 bg-error-50' : 'border-border')} />
            {errors.orgName && <p className="text-xs text-error-600 mt-1">{errors.orgName}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground/80 block mb-1">Organization type</label>
            <select value={form.orgType} onChange={e => set('orgType', e.target.value)} className={cn('w-full border rounded-lg px-3 py-2.5 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring', errors.orgType ? 'border-error-500 bg-error-50' : 'border-border')}>
              <option value="">Select type...</option>
              <option>Property Management</option>
              <option>Audit Firm</option>
              <option>Corporate Real Estate</option>
              <option>Other</option>
            </select>
            {errors.orgType && <p className="text-xs text-error-600 mt-1">{errors.orgType}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground/80 block mb-1">Expected lease count</label>
            <select value={form.leaseCount} onChange={e => set('leaseCount', e.target.value)} className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring">
              <option value="">Select range...</option>
              <option>1–10</option>
              <option>11–50</option>
              <option>51–200</option>
              <option>200+</option>
            </select>
          </div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={form.termsAccepted} onChange={e => set('termsAccepted', e.target.checked)} className="w-4 h-4 mt-0.5 rounded border-border" />
            <span className="text-sm text-muted-foreground">I agree to the <span className="text-primary cursor-default">Terms of Service</span> and <span className="text-primary cursor-default">Privacy Policy</span></span>
          </label>
          {errors.terms && <p className="text-xs text-error-600">{errors.terms}</p>}
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-2.5 border border-border text-foreground/80 text-sm font-medium rounded-lg hover:bg-accent transition-colors">Back</button>
            <button onClick={handleCreate} className="flex-1 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">Create Account</button>
          </div>
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground mt-5">
        Already have an account?{' '}
        <Link to="/auth/login" className="text-primary hover:text-primary font-medium">Sign in</Link>
      </p>
    </div>
  );
}
