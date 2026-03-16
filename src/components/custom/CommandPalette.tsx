import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, AlertTriangle, LayoutDashboard, Building2, MapPin, Calculator, BarChart3, Download, Settings, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { leases, discrepancies } from '@/data/mock';

const pages = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Portfolios', href: '/portfolios', icon: Building2 },
  { label: 'Properties', href: '/properties', icon: MapPin },
  { label: 'Leases', href: '/leases', icon: FileText },
  { label: 'Discrepancies', href: '/discrepancies', icon: AlertTriangle },
  { label: 'CAM Audit', href: '/cam-reconciliations', icon: Calculator },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Exports', href: '/exports', icon: Download },
  { label: 'Settings', href: '/settings', icon: Settings },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
      }
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const q = query.toLowerCase();
  const filteredPages = pages.filter(p => !q || p.label.toLowerCase().includes(q));
  const filteredLeases = leases.filter(l => !q || l.leaseNumber.toLowerCase().includes(q) || l.tenantName.toLowerCase().includes(q)).slice(0, 3);
  const filteredDiscs = discrepancies.filter(d => !q || d.id.toLowerCase().includes(q) || d.tenantName.toLowerCase().includes(q)).slice(0, 3);

  const handleSelect = (href: string) => {
    navigate(href);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-fade-in">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground/70 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, leases, discrepancies..."
            className="flex-1 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-xs text-muted-foreground/70 border border-border rounded font-mono">ESC</kbd>
        </div>
        <div className="max-h-96 overflow-y-auto py-2 scrollbar-thin">
          {filteredPages.length > 0 && (
            <div>
              <p className="px-4 py-1.5 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Pages</p>
              {filteredPages.map(p => (
                <button
                  key={p.href}
                  onClick={() => handleSelect(p.href)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground/80 hover:bg-accent transition-colors"
                >
                  <p.icon className="w-4 h-4 text-muted-foreground/70" />
                  <span className="flex-1 text-left">{p.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                </button>
              ))}
            </div>
          )}
          {filteredLeases.length > 0 && (
            <div>
              <p className="px-4 py-1.5 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mt-1">Recent Leases</p>
              {filteredLeases.map(l => (
                <button
                  key={l.id}
                  onClick={() => handleSelect(`/leases/${l.id}`)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground/80 hover:bg-accent transition-colors"
                >
                  <FileText className="w-4 h-4 text-muted-foreground/70" />
                  <span className="flex-1 text-left">{l.leaseNumber} — {l.tenantName}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                </button>
              ))}
            </div>
          )}
          {filteredDiscs.length > 0 && (
            <div>
              <p className="px-4 py-1.5 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mt-1">Recent Discrepancies</p>
              {filteredDiscs.map(d => (
                <button
                  key={d.id}
                  onClick={() => handleSelect(`/discrepancies/${d.id}`)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-foreground/80 hover:bg-accent transition-colors"
                >
                  <AlertTriangle className="w-4 h-4 text-muted-foreground/70" />
                  <span className="flex-1 text-left">{d.tenantName} — {d.category.replace(/-/g, ' ')}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                </button>
              ))}
            </div>
          )}
          {!filteredPages.length && !filteredLeases.length && !filteredDiscs.length && (
            <div className="py-12 text-center text-sm text-muted-foreground/70">No results found</div>
          )}
        </div>
      </div>
    </div>
  );
}
