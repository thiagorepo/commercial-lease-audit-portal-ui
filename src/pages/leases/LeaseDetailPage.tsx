import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Pencil as Edit, Upload, AlertTriangle, FileText, File, Building2, Calendar, BarChart3, DollarSign, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/components/custom/PageHeader';
import { StatCard } from '@/components/custom/StatCard';
import { StatusBadge, CAMTypeBadge } from '@/components/custom/StatusBadge';
import { VarianceIndicator } from '@/components/custom/VarianceIndicator';
import { PriorityBadge } from '@/components/custom/StatusBadge';
import { Timeline, activityToTimelineItems } from '@/components/custom/Timeline';
import { FileUploadModal } from '@/components/custom/FileUploadModal';
import { EmptyState } from '@/components/custom/EmptyState';
import { EditLeaseModal } from '@/components/custom/EditLeaseModal';
import { NewDiscrepancyModal } from '@/components/custom/NewDiscrepancyModal';
import { leases, discrepancies, camReconciliations, documents, activityLog, invoices, calendarEvents, reports } from '@/data/mock';
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const tabs = ['Overview', 'Documents', 'Discrepancies', 'CAM', 'Invoices', 'Calendar', 'Reports'];

const fileIcons: Record<string, React.ElementType> = {
  lease: FileText,
  amendment: File,
  renewal: FileText,
  other: File,
};

export function LeaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [newDiscOpen, setNewDiscOpen] = useState(false);

  const lease = leases.find(l => l.id === id) ?? null;

  if (!lease) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Lease not found.</p>
        <Link to="/dashboard/leases" className="text-primary hover:text-primary text-sm font-medium mt-2 inline-block">Back to Leases</Link>
      </div>
    );
  }

  const leaseDiscs = discrepancies.filter(d => d.leaseId === id);
  const leaseCams = camReconciliations.filter(c => c.leaseId === id);
  const leaseDocs = documents.filter(d => d.leaseId === id);
  const leaseInvoices = invoices.filter(i => i.leaseId === id);
  const leaseActivity = activityToTimelineItems(activityLog.filter(a => a.entityId === id || leaseDiscs.some(d => d.id === a.entityId)).slice(0, 10));

  return (
    <div>
      <PageHeader
        title={lease.leaseNumber}
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Leases', href: '/leases' }, { label: lease.leaseNumber }]}
        actions={
          <div className="flex gap-2">
            <button onClick={() => setEditOpen(true)} className="flex items-center gap-2 px-3 py-2 border border-border text-foreground/80 text-sm font-medium rounded-lg hover:bg-accent transition-colors">
              <Edit className="w-4 h-4" /> Edit
            </button>
            <button onClick={() => setUploadOpen(true)} className="flex items-center gap-2 px-3 py-2 border border-border text-foreground/80 text-sm font-medium rounded-lg hover:bg-accent transition-colors">
              <Upload className="w-4 h-4" /> Upload Doc
            </button>
            <button onClick={() => setNewDiscOpen(true)} className="flex items-center gap-2 px-3 py-2 border border-primary/30 text-primary text-sm font-medium rounded-lg hover:bg-primary/10 transition-colors">
              <AlertTriangle className="w-4 h-4" /> New Discrepancy
            </button>
          </div>
        }
      />

      <div className="flex items-center gap-3 mb-6">
        <span className="text-lg font-semibold text-foreground">{lease.tenantName}</span>
        <StatusBadge status={lease.status} />
        <CAMTypeBadge type={lease.camType} />
      </div>

      <div className="border-b border-border mb-6">
        <nav className="flex gap-1 overflow-x-auto scrollbar-thin">
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={cn('px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
                activeTab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-accent-foreground'
              )}>
              {t}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'Overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border border-border shadow-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Lease Details</h3>
              <dl className="space-y-3">
                {[
                  ['Term Start', formatDate(lease.termStart)],
                  ['Term End', formatDate(lease.termEnd)],
                  ['Base Rent', formatCurrency(lease.baseRent) + ' / year'],
                  ['Square Footage', `${lease.squareFootage.toLocaleString()} sq ft`],
                  ['CAM Type', <CAMTypeBadge type={lease.camType} />],
                  ['Renewal Option', lease.renewalOption ? <span className="flex items-center gap-1 text-success-700"><CheckCircle className="w-4 h-4" /> Yes</span> : 'No'],
                  ['Escalation Rate', formatPercent(lease.escalationRate) + ' / year'],
                ].map(([label, val]) => (
                  <div key={String(label)} className="flex items-center justify-between gap-4">
                    <dt className="text-sm text-muted-foreground shrink-0">{label}</dt>
                    <dd className="text-sm font-medium text-foreground text-right">{val}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="bg-card rounded-xl border border-border shadow-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Tenant Information</h3>
              <dl className="space-y-3">
                {[
                  ['Tenant', lease.tenantName],
                  ['Contact', lease.tenantContact],
                  ['Phone', lease.tenantPhone],
                  ['Email', lease.tenantEmail],
                  ['Property', lease.propertyName],
                  ['Portfolio', lease.portfolioName],
                ].map(([label, val]) => (
                  <div key={String(label)} className="flex items-start justify-between gap-4">
                    <dt className="text-sm text-muted-foreground shrink-0">{label}</dt>
                    <dd className="text-sm font-medium text-foreground text-right break-all">{val}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Invoiced" value={formatCurrency(lease.totalInvoiced)} />
            <StatCard label="Total Audited" value={formatCurrency(lease.totalAudited)} />
            <StatCard label="Open Discrepancies" value={String(lease.openDiscrepancies)} />
            <StatCard label="Potential Recovery" value={formatCurrency(lease.potentialRecovery)} />
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h3>
            {leaseActivity.length > 0 ? <Timeline items={leaseActivity} /> : <EmptyState icon={FileText} title="No activity yet" />}
          </div>
        </div>
      )}

      {activeTab === 'Documents' && (
        <div className="bg-card rounded-xl border border-border shadow-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <h3 className="text-sm font-semibold text-foreground">Documents</h3>
            <button onClick={() => setUploadOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors">
              <Upload className="w-3.5 h-3.5" /> Upload Document
            </button>
          </div>
          {leaseDocs.length === 0 ? <EmptyState icon={FileText} title="No documents" description="Upload lease documents to get started." /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
              <thead className="bg-muted border-b border-border/50">
                <tr>
                  {[
                    { label: 'Document', show: true },
                    { label: 'Type', show: true },
                    { label: 'Uploaded By', show: 'md:table-cell' },
                    { label: 'Date', show: true },
                    { label: 'Size', show: 'hidden md:table-cell' }
                  ].map(h => (
                    <th key={h.label} className={`text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 ${h.show === true ? '' : h.show}`}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaseDocs.map(doc => {
                  const Icon = fileIcons[doc.type] || File;
                  return (
                    <tr key={doc.id} className="border-b border-border/30 hover:bg-accent transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-sm text-foreground">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3"><span className="text-xs text-muted-foreground capitalize">{doc.type}</span></td>
                      <td className="hidden md:table-cell px-5 py-3"><span className="text-sm text-muted-foreground">{doc.uploadedBy}</span></td>
                      <td className="px-5 py-3"><span className="text-sm text-muted-foreground font-mono">{formatDate(doc.uploadedAt)}</span></td>
                      <td className="hidden md:table-cell px-5 py-3"><span className="text-sm text-muted-foreground/70">{doc.fileSize}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Discrepancies' && (
        <div className="bg-card rounded-xl border border-border shadow-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <h3 className="text-sm font-semibold text-foreground">Discrepancies ({leaseDiscs.length})</h3>
            <button onClick={() => setNewDiscOpen(true)} className="text-sm text-primary hover:text-primary font-medium">+ New Discrepancy</button>
          </div>
          {leaseDiscs.length === 0 ? <EmptyState icon={AlertTriangle} title="No discrepancies" description="No discrepancies found for this lease." /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
              <thead className="bg-muted border-b border-border/50">
                <tr>
                  {['ID', 'Category', 'Variance', 'Priority', 'Status', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaseDiscs.map(d => (
                  <tr key={d.id} className="border-b border-border/30 hover:bg-accent transition-colors">
                    <td className="px-5 py-3">
                      <Link to={`/discrepancies/${d.id}`} className="text-sm font-semibold text-primary hover:text-primary">{d.id.toUpperCase()}</Link>
                    </td>
                    <td className="px-5 py-3"><span className="text-sm text-foreground/80 capitalize">{d.category.replace(/-/g, ' ')}</span></td>
                    <td className="px-5 py-3"><VarianceIndicator amount={d.variance} size="sm" /></td>
                    <td className="px-5 py-3"><PriorityBadge priority={d.priority} /></td>
                    <td className="px-5 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-5 py-3 text-right">
                      <Link to={`/discrepancies/${d.id}`} className="text-sm text-primary hover:text-primary font-medium">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'CAM' &&(
        <div className="bg-card rounded-xl border border-border shadow-card">
          <div className="px-5 py-4 border-b border-border/50">
            <h3 className="text-sm font-semibold text-foreground">CAM Reconciliations</h3>
          </div>
          {leaseCams.length === 0 ? <EmptyState icon={DollarSign} title="No CAM reconciliations" /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
              <thead className="bg-muted border-b border-border/50">
                <tr>
                  {['Fiscal Year', 'Total Expenses', 'Billed', 'Variance', 'Status', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaseCams.map(c => (
                  <tr key={c.id} className="border-b border-border/30 hover:bg-accent transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground text-sm">{c.fiscalYear}</td>
                    <td className="px-5 py-3 text-sm text-foreground/80">{formatCurrency(c.totalExpenses)}</td>
                    <td className="px-5 py-3 text-sm text-foreground/80">{formatCurrency(c.amountBilled)}</td>
                    <td className="px-5 py-3"><VarianceIndicator amount={c.variance} size="sm" /></td>
                    <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-3 text-right">
                      <Link to={`/cam-reconciliations/${c.id}`} className="text-sm text-primary hover:text-primary font-medium">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Invoices' && (
        <div className="bg-card rounded-xl border border-border shadow-card">
          <div className="px-5 py-4 border-b border-border/50">
            <h3 className="text-sm font-semibold text-foreground">Invoices</h3>
          </div>
          {leaseInvoices.length === 0 ? <EmptyState icon={FileText} title="No invoices" /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
              <thead className="bg-muted border-b border-border/50">
                <tr>
                  {['Invoice #', 'Date', 'Description', 'Amount', 'Status'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaseInvoices.map(inv => (
                  <tr key={inv.id} className="border-b border-border/30 hover:bg-accent transition-colors">
                    <td className="px-5 py-3 font-mono text-sm text-foreground">{inv.invoiceNumber}</td>
                    <td className="px-5 py-3 text-sm text-foreground/80">{formatDate(inv.date)}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{inv.description}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-foreground">{formatCurrency(inv.amount)}</td>
                    <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Calendar' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Lease Commencement', date: lease.termStart, icon: Calendar, color: 'bg-success-50 border-success-200 text-success-700' },
              { label: 'Lease Expiration', date: lease.termEnd, icon: Calendar, color: 'bg-error-50 border-error-200 text-error-700' },
              { label: 'Next Escalation', date: (() => { try { const d = new Date(lease.termStart); if (isNaN(d.getTime())) return lease.termStart; d.setFullYear(new Date().getFullYear() + 1); return d.toISOString(); } catch { return lease.termStart; } })(), icon: Calendar, color: 'bg-warning-50 border-warning-100 text-warning-700' },
            ].map(item => (
              <div key={item.label} className={`p-4 rounded-xl border ${item.color}`}>
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className="w-4 h-4 opacity-70" />
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{item.label}</p>
                </div>
                <p className="text-xl font-bold">{formatDate(item.date)}</p>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card">
            <div className="px-5 py-4 border-b border-border/50">
              <h3 className="text-sm font-semibold text-foreground">Upcoming Events</h3>
            </div>
            {calendarEvents.filter(e => e.leaseId === id).length === 0 ? (
              <EmptyState icon={Calendar} title="No scheduled events" description="Upcoming renewals, escalations, and deadlines will appear here." />
            ) : (
              <div className="divide-y divide-border/30">
                {calendarEvents.filter(e => e.leaseId === id).map(event => {
                  const typeColors: Record<string, string> = {
                    renewal: 'bg-primary/10 border-primary/30 text-primary',
                    escalation: 'bg-warning-50 border-warning-100 text-warning-700',
                    expiration: 'bg-error-50 border-error-200 text-error-700',
                    deadline: 'bg-secondary-100 border-secondary-200 text-secondary-700',
                    audit: 'bg-success-50 border-success-200 text-success-700',
                  };
                  return (
                    <div key={event.id} className="flex items-start gap-4 px-5 py-4">
                      <div className="text-center shrink-0 w-14">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</p>
                        <p className="text-2xl font-bold text-foreground leading-tight">{new Date(event.date).getDate()}</p>
                        <p className="text-xs text-muted-foreground/70">{new Date(event.date).getFullYear()}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-foreground truncate">{event.title}</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize shrink-0 ${typeColors[event.type] || typeColors.deadline}`}>
                            {event.type}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'Reports' && (() => {
        const leaseReports = reports.filter(r => r.leaseId === id || r.portfolioId === lease.portfolioId);
        const typeLabels: Record<string, string> = {
          'portfolio-summary': 'Portfolio', 'lease-specific': 'Lease', 'cam-audit': 'CAM Audit', 'annual-review': 'Annual',
        };
        return (
          <div className="bg-card rounded-xl border border-border shadow-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <h3 className="text-sm font-semibold text-foreground">Reports ({leaseReports.length})</h3>
              <Link to="/dashboard/reports" className="text-sm text-primary hover:text-primary font-medium">View all reports</Link>
            </div>
            {leaseReports.length === 0 ? (
              <EmptyState icon={BarChart3} title="No reports" description="Reports referencing this lease will appear here." action={{ label: 'View All Reports', onClick: () => navigate('/reports') }} />
            ) : (
              <table className="w-full">
                <thead className="bg-muted border-b border-border/50">
                  <tr>
                    {['Report', 'Type', 'Period', 'Discrepancies', 'Recovery', 'Status'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaseReports.map(r => (
                    <tr key={r.id} className="border-b border-border/30 hover:bg-accent transition-colors">
                      <td className="px-5 py-3">
                        <Link to={`/reports/${r.id}`} className="text-sm font-semibold text-primary hover:text-primary">{r.title}</Link>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs bg-muted text-foreground/80 px-2 py-0.5 rounded-md">{typeLabels[r.type] || r.type}</span>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{formatDate(r.periodStart)} — {formatDate(r.periodEnd)}</td>
                      <td className="px-5 py-3 text-sm text-foreground/80">{r.discrepancyCount}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-success-700">{formatCurrency(r.recoveryAmount)}</td>
                      <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })()}

      <FileUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <EditLeaseModal open={editOpen} onClose={() => setEditOpen(false)} lease={lease} />
      <NewDiscrepancyModal open={newDiscOpen} onClose={() => setNewDiscOpen(false)} defaultLeaseId={id} />
    </div>
  );
}
