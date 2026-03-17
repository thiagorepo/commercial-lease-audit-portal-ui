import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Download } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/custom/PageHeader';
import { StatusBadge } from '@/components/custom/StatusBadge';
import { exports_ } from '@/data/mock';
import { formatDate } from '@/lib/utils';

export function ExportsPage() {
  return (
    <div>
      <PageHeader
        title="Exports"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/overview' }, { label: 'Exports' }]}
        actions={
          <Link to="/dashboard/exports/new" className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> New Export
          </Link>
        }
      />
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted border-b border-border">
            <tr>
              {['Name', 'Type', 'Format', 'Created', 'Size', 'Status', ''].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exports_.map(e => (
              <tr key={e.id} className="border-b border-border/30 hover:bg-accent transition-colors">
                <td className="px-5 py-3 text-sm font-medium text-foreground">{e.name}</td>
                <td className="px-5 py-3 text-sm text-muted-foreground">{e.type}</td>
                <td className="px-5 py-3">
                  <span className="text-xs font-mono uppercase font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">{e.format}</span>
                </td>
                <td className="px-5 py-3 text-sm text-muted-foreground">{formatDate(e.createdAt)}</td>
                <td className="px-5 py-3 text-sm text-muted-foreground/70">{e.fileSize}</td>
                <td className="px-5 py-3"><StatusBadge status={e.status} /></td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => {
                    const content = `Export: ${e.name}\nType: ${e.type}\nFormat: ${e.format}\nCreated: ${formatDate(e.createdAt)}\nSize: ${e.fileSize}\nStatus: ${e.status}`;
                    const blob = new Blob([content], { type: 'text/plain' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${e.name.replace(/\s+/g, '-')}.${e.format.toLowerCase()}`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                    toast.success(`Downloaded ${e.name}`);
                  }} className="flex items-center gap-1.5 text-sm text-primary hover:text-primary font-medium">
                    <Download className="w-4 h-4" /> Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function NewExportPage() {
  const [type, setType] = useState('lease-summary');
  const [format, setFormat] = useState('excel');
  const [scope, setScope] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); toast.success('Export generated successfully!'); }, 2000);
  };

  return (
    <div>
      <PageHeader
        title="New Export"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/overview' }, { label: 'Exports', href: '/dashboard/exports' }, { label: 'New Export' }]}
      />
      <div className="max-w-2xl">
        <div className="bg-card rounded-xl border border-border shadow-card p-6 space-y-6">
          <div>
            <label className="text-sm font-semibold text-foreground block mb-3">Export Type</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'lease-summary', label: 'Lease Summary' },
                { value: 'discrepancy-report', label: 'Discrepancy Report' },
                { value: 'cam-summary', label: 'CAM Summary' },
                { value: 'full-audit', label: 'Full Audit' },
              ].map(opt => (
                <label key={opt.value} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${type === opt.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                  <input type="radio" name="type" value={opt.value} checked={type === opt.value} onChange={e => setType(e.target.value)} className="sr-only" />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${type === opt.value ? 'border-primary' : 'border-border'}`}>
                    {type === opt.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-medium text-foreground">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground block mb-2">Scope</label>
            <select value={scope} onChange={e => setScope(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring">
              <option value="all">All Portfolios & Properties</option>
              <option value="portfolio-1">Northeast Commercial Portfolio</option>
              <option value="portfolio-2">Sunbelt Retail Holdings</option>
              <option value="property-1">One Harbor Plaza</option>
              <option value="property-2">Midtown Tower</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground block mb-3">Format</label>
            <div className="flex gap-3">
              {[
                { value: 'excel', label: 'Excel (.xlsx)' },
                { value: 'pdf', label: 'PDF' },
                { value: 'csv', label: 'CSV' },
              ].map(opt => (
                <label key={opt.value} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${format === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                  <input type="radio" name="format" value={opt.value} checked={format === opt.value} onChange={e => setFormat(e.target.value)} className="sr-only" />
                  <span className="text-sm font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground block mb-3">Date Range <span className="text-muted-foreground/70 font-normal text-xs">(optional)</span></label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground block mb-1">From</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
              </div>
              <span className="text-muted-foreground/70 mt-4">—</span>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground block mb-1">To</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
            ) : (
              <><Download className="w-4 h-4" /> Generate Export</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
