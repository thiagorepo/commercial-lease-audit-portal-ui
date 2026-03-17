import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

function PasswordStrength({ password }: { password: string }) {
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(password)).length;
  const colors = ['', 'bg-error-500', 'bg-warning-500', 'bg-success-500', 'bg-success-600'];
  const labels = ['', 'Weak', 'Fair', 'Strong', 'Very Strong'];
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

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!password || password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (password !== confirm) errs.confirm = 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSuccess(true);
    setTimeout(() => navigate('/auth/login'), 2000);
  };

  if (success) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-card p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-success-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-success-500" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Password reset!</h2>
        <p className="text-sm text-muted-foreground">Redirecting you to sign in...</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-8">
      <h2 className="text-xl font-bold text-foreground mb-1">Set new password</h2>
      <p className="text-sm text-muted-foreground mb-6">Choose a strong password for your account.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground/80 block mb-1">New password</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }} placeholder="At least 8 characters"
              className={cn('w-full border rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring', errors.password ? 'border-error-500 bg-error-50' : 'border-border')} />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-accent-foreground">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-error-600 mt-1">{errors.password}</p>}
          <PasswordStrength password={password} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground/80 block mb-1">Confirm password</label>
          <input type="password" value={confirm} onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: '' })); }} placeholder="Re-enter password"
            className={cn('w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring', errors.confirm ? 'border-error-500 bg-error-50' : 'border-border')} />
          {errors.confirm && <p className="text-xs text-error-600 mt-1">{errors.confirm}</p>}
        </div>
        <button type="submit" className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">Reset Password</button>
      </form>
    </div>
  );
}
