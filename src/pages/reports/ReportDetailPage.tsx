import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Archive, Send } from 'lucide-react';
import { StatusBadge } from '@/components/custom/StatusBadge';
import { VarianceIndicator } from '@/components/custom/VarianceIndicator';
import { Timeline, statusHistoryToTimelineItems } from '@/components/custom/Timeline';
import { reports, discrepancies, leases } from '@/data/mock';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import type { ReportStatus } from '@/types';

const formatDateTime2 = (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const typeLabels: Record<string, string> = {
  'portfolio-summary': 'Portfolio Summary',
  'lease-specific': 'Lease Specific',
  'cam-audit': 'CAM Audit',
  'annual-review': 'Annual Review',
};

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const report = reports.find(r => r.id === id);

  const [status, setStatus] = useState<ReportStatus>('draft');
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (report) setStatus(report.status);
  }, [id]);

  if (!report) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Report not found.</p>
        <Link to="/dashboard/reports" className="text-primary text-sm font-medium mt-2 inline-block">Back to Reports</Link>
      </div>
    );
  }

  const transition = (next: ReportStatus, message: string) => {
    setStatus(next);
    toast.success(message);
  };

  const workflowActions: Record<string, { label: string; color: string; onClick: () => void }[]> = {
    draft: [
      { label: 'Submit for Review', color: 'bg-primary hover:bg-primary/90 text-white', onClick: () => transition('reviewed', 'Submitted for review') },
      { label: 'Archive', color: 'border border-border text-muted-foreground hover:bg-accent', onClick: () => transition('archived', 'Report archived') },
    ],
    reviewed: [
      { label: 'Finalize', color: 'bg-success-500 hover:bg-success-600 text-white', onClick: () => transition('final', 'Report finalized') },
      { label: 'Reject', color: 'border border-error-200 text-error-600 hover:bg-error-50', onClick: () => transition('draft', 'Report returned to draft') },
    ],
    final: [
      { label: 'Distribute', color: 'bg-success-500 hover:bg-success-600 text-white', onClick: () => transition('distributed', 'Report distributed') },
      { label: 'Archive', color: 'border border-border text-muted-foreground hover:bg-accent', onClick: () => transition('archived', 'Report archived') },
    ],
    distributed: [
      { label: 'Archive', color: 'border border-border text-muted-foreground hover:bg-accent', onClick: () => transition('archived', 'Report archived') },
    ],
  };

  const actions = workflowActions[status] || [];
  const statusHistory = statusHistoryToTimelineItems(report.statusHistory);
  const portfolioLeaseIds = report.portfolioId
    ? new Set(leases.filter(l => l.portfolioId === report.portfolioId).map(l => l.id))
    : null;
  const relatedDiscs = report.leaseId
    ? discrepancies.filter(d => d.leaseId === report.leaseId).slice(0, 8)
    : portfolioLeaseIds
      ? discrepancies.filter(d => portfolioLeaseIds.has(d.leaseId)).slice(0, 8)
      : discrepancies.slice(0, 8);

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => navigate('/reports')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent-foreground mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Reports
        </button>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-2xl font-bold text-foreground">{report.title}</h1>
              <StatusBadge status={status} />
              <span className="text-xs font-mono text-muted-foreground/70 bg-muted px-2 py-0.5 rounded">v{report.version}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              <span>{typeLabels[report.type]}</span>
              <span>·</span>
              <span>{report.portfolioName || report.leaseName}</span>
              <span>·</span>
              <span>{formatDate(report.periodStart)} — {formatDate(report.periodEnd)}</span>
              <span>·</span>
              <span>By {report.createdBy}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => {
              const content = `REPORT: ${report.title}\nVersion ${report.version}\n\n${report.executiveSummary}\n\nFindings:\n${report.findings.map((f, i) => `${i+1}. ${f}`).join('\n')}\n\nRecovery Amount: $${report.recoveryAmount.toLocaleString()}\nGenerated: ${new Date().toISOString()}`;
              const blob = new Blob([content], { type: 'text/plain' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${report.title.replace(/\s+/g, '-')}-v${report.version}.txt`;
              a.click();
              window.URL.revokeObjectURL(url);
              toast.success('Report downloaded');
            }} className="flex items-center gap-2 px-3 py-2 border border-border text-foreground/80 text-sm font-medium rounded-lg hover:bg-accent transition-colors">
              <Download className="w-4 h-4" /> Download
            </button>
            {actions.map(a => (
              <button key={a.label} onClick={a.onClick} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${a.color}`}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-card rounded-xl border border-border shadow-card p-6">
            <h2 className="text-base font-semibold text-foreground mb-3">Executive Summary</h2>
            <p className="text-sm text-foreground/80 leading-relaxed">{report.executiveSummary}</p>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card p-6">
            <h2 className="text-base font-semibold text-foreground mb-3">Findings</h2>
            <ol className="space-y-3">
              {report.findings.map((f, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                  <p className="text-sm text-foreground/80 leading-relaxed">{f}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card p-6">
            <h2 className="text-base font-semibold text-foreground mb-3">Recommendations</h2>
            <ul className="space-y-2">
              {report.recommendations.map((r, i) => (
                <li key={i} className="flex gap-3 text-sm text-foreground/80">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0 mt-1.5" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card p-6">
            <h2 className="text-base font-semibold text-foreground mb-3">Methodology</h2>
            <p className="text-sm text-foreground/80 leading-relaxed">{report.methodology}</p>
          </div>

          {report.appendix.length > 0 && (
            <div className="bg-card rounded-xl border border-border shadow-card p-6">
              <h2 className="text-base font-semibold text-foreground mb-3">Appendix</h2>
              <ol className="space-y-2">
                {report.appendix.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-foreground/80">
                    <span className="text-xs text-muted-foreground/70 font-mono mt-0.5 shrink-0">[{String.fromCharCode(65+i)}]</span>
                    {item}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="bg-card rounded-xl border border-border shadow-card p-6">
            <h2 className="text-base font-semibold text-foreground mb-4">Referenced Discrepancies</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
              <thead className="bg-muted border-b border-border/50">
                <tr>
                  {['ID', 'Tenant', 'Category', 'Variance', 'Status'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {relatedDiscs.map(d => (
                  <tr key={d.id} className="border-b border-border/30 hover:bg-accent">
                    <td className="px-4 py-2">
                      <Link to={`/discrepancies/${d.id}`} className="text-xs font-mono text-primary hover:text-primary">{d.id.toUpperCase()}</Link>
                    </td>
                    <td className="px-4 py-2 text-sm text-foreground/80">{d.tenantName}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground capitalize">{d.category.replace(/-/g, ' ')}</td>
                    <td className="px-4 py-2"><VarianceIndicator amount={d.variance} size="sm" /></td>
                    <td className="px-4 py-2"><StatusBadge status={d.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-card rounded-xl border border-border shadow-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-sm text-muted-foreground">Discrepancies</span>
                <span className="text-lg font-bold text-foreground">{report.discrepancyCount}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/30">
                <span className="text-sm text-muted-foreground">Total Recovery</span>
                <span className="text-lg font-bold text-success-700">{formatCurrency(report.recoveryAmount)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Report Version</span>
                <span className="text-sm font-semibold text-foreground">v{report.version}</span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Status History</h3>
            <Timeline items={statusHistory} />
          </div>

          {report.comments.length > 0 && (
            <div className="bg-card rounded-xl border border-border shadow-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Review Comments</h3>
              <div className="space-y-3">
                {report.comments.map(c => (
                  <div key={c.id} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground/80">{c.userName}</span>
                      <span className="text-xs text-muted-foreground/70">{formatDateTime(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{c.content}</p>
                    {replies[c.id] && (
                      <div className="mt-2 p-2 bg-primary/10 border border-primary/30 rounded text-xs text-foreground/80">
                        <strong>Your reply:</strong> {replies[c.id]}
                      </div>
                    )}
                    <div className="mt-2 flex gap-1">
                      <input
                        type="text"
                        placeholder="Write a reply..."
                        value={replyInputs[c.id] || ''}
                        onChange={(e) => setReplyInputs(p => ({ ...p, [c.id]: e.target.value }))}
                        className="flex-1 text-xs border border-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring/20"
                      />
                      <button
                        onClick={() => {
                          if (replyInputs[c.id]?.trim()) {
                            setReplies(p => ({ ...p, [c.id]: replyInputs[c.id] }));
                            setReplyInputs(p => ({ ...p, [c.id]: '' }));
                            toast.success('Reply added');
                          }
                        }}
                        className="px-2 py-1 bg-primary text-white text-xs font-medium rounded hover:bg-primary/90 transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
