import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Download, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/custom/PageHeader';
import { StatusBadge } from '@/components/custom/StatusBadge';
import { Pagination } from '@/components/custom/Pagination';
import { exportService, type ExportJob } from '@/services/export.service';
import { formatDate } from '@/lib/utils';

function formatFileSize(bytes: number | null): string {
  if (bytes === null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ExportsPage() {
  const navigate = useNavigate();
  const [exports, setExports] = useState<ExportJob[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const fetchExports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await exportService.list(page, pageSize);
      setExports(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exports');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    void fetchExports();
  }, [fetchExports]);

  const handleProcess = async (id: string) => {
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      await exportService.process(id);
      toast.success('Export processed successfully');
      void fetchExports();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDownload = async (e: ExportJob) => {
    try {
      const url = await exportService.download(e.id);
      if (url) {
        window.open(url, '_blank');
        toast.success(`Downloading ${e.name}`);
      } else {
        toast.error('File not available for download');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await exportService.delete(id);
      toast.success('Export deleted');
      void fetchExports();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

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

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="ml-3 text-sm text-muted-foreground">Loading exports...</span>
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-error-600 text-sm">{error}</p>
          <button onClick={() => void fetchExports()} className="mt-3 text-sm text-primary font-medium hover:text-primary/80">Retry</button>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          {exports.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">No exports found.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      {['Name', 'Type', 'Format', 'Created', 'Size', 'Status', ''].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {exports.map(e => (
                      <tr key={e.id} className="border-b border-border/30 hover:bg-accent transition-colors">
                        <td className="px-5 py-3 text-sm font-medium text-foreground">{e.name}</td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">{e.type}</td>
                        <td className="px-5 py-3">
                          <span className="text-xs font-mono uppercase font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">{e.format}</span>
                        </td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">{formatDate(e.createdAt)}</td>
                        <td className="px-5 py-3 text-sm text-muted-foreground/70">{formatFileSize(e.fileSize)}</td>
                        <td className="px-5 py-3"><StatusBadge status={e.status} /></td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {e.status === 'completed' && (
                              <button onClick={() => void handleDownload(e)} className="flex items-center gap-1.5 text-sm text-primary hover:text-primary font-medium">
                                <Download className="w-4 h-4" /> Download
                              </button>
                            )}
                            {(e.status === 'pending' || e.status === 'failed') && (
                              <button onClick={() => void handleProcess(e.id)} disabled={processingIds.has(e.id)} className="flex items-center gap-1.5 text-sm text-primary hover:text-primary font-medium disabled:opacity-50">
                                {processingIds.has(e.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Loader2 className="w-4 h-4" />}
                                {processingIds.has(e.id) ? 'Processing...' : 'Process'}
                              </button>
                            )}
                            <button onClick={() => void handleDelete(e.id)} className="p-1.5 text-muted-foreground/70 hover:text-error-600 hover:bg-error-50 rounded-md transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 border-t border-border/50">
                <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function NewExportPage() {
  const navigate = useNavigate();
  const [type, setType] = useState('lease-summary');
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('excel');
  const [scope, setScope] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const job = await exportService.create({
        name: `${type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Export`,
        type,
        format,
        sourceId: scope !== 'all' ? scope : undefined,
      });
      const processed = await exportService.process(job.id);
      if (processed.status === 'completed') {
        toast.success('Export generated and processed successfully!');
      } else {
        toast.success('Export created. Processing may take a moment.');
      }
      navigate('/dashboard/exports');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export generation failed');
    } finally {
      setLoading(false);
    }
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
                { value: 'excel' as const, label: 'Excel (.xlsx)' },
                { value: 'pdf' as const, label: 'PDF' },
                { value: 'csv' as const, label: 'CSV' },
              ].map(opt => (
                <label key={opt.value} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all ${format === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                  <input type="radio" name="format" value={opt.value} checked={format === opt.value} onChange={e => setFormat(e.target.value as 'pdf' | 'excel' | 'csv')} className="sr-only" />
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
            onClick={() => void handleGenerate()}
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
