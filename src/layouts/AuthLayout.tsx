import { Outlet } from 'react-router-dom';
import { Building2 } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-muted flex flex-col">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex items-center justify-center w-14 h-14 bg-primary rounded-2xl shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">LeaseAudit Portal</h1>
            <p className="text-sm text-muted-foreground mt-1">Commercial lease audit management</p>
          </div>
        </div>

        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>

      <footer className="relative py-6 text-center text-xs text-muted-foreground/70">
        <span>© 2026 LeaseAudit Portal</span>
        <span className="mx-2">·</span>
        <span className="hover:text-accent-foreground transition-colors cursor-default">Terms of Service</span>
        <span className="mx-2">·</span>
        <span className="hover:text-accent-foreground transition-colors cursor-default">Privacy Policy</span>
      </footer>
    </div>
  );
}
