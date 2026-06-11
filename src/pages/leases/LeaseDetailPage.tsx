import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Pencil as Edit, Upload, AlertTriangle, FileText, File, Building2, Calendar, BarChart3, DollarSign, CheckCircle, Loader2 } from 'lucide-react';
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
import { leases, camReconciliations, documents, activityLog, invoices } from '@/data/mock';
import { discrepancyService } from '@/services/discrepancy.service';
import { calendarService } from '@/services/calendar.service';
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Discrepancy, CalendarEvent } from '@/types';

const tabs = ['Overview', 'Rent Schedule', 'CAM Audit', 'Documents', 'History'];

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

  // Service-driven state
  const [leaseDiscs, setLeaseDiscs] = useState<Discrepancy[]>([]);
  const [discsLoading, setDiscsLoading] = useState(false);
  const [discsError, setDiscsError] = useState<string | null>(null);

  const [leaseCalendarEvents, setLeaseCalendarEvents] = useState<CalendarEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const lease = leases.find(l => l.id === id) ?? null;

  // Fetch discrepancies for this lease via service
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setDiscsLoading(true);
    setDiscsError(null);
    discrepancyService.list({ leaseId: id, pageSize: 100 }).then((res) => {
      if (cancelled) return;
      setLeaseDiscs(res.data);
      setDiscsLoading(false);
    }).catch((err) => {
      if (cancelled) return;
      setDiscsError(err instanceof Error ? err.message : 'Failed to load discrepancies');
      setDiscsLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  // Fetch calendar events for this lease via service
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setEventsLoading(true);
    setEventsError(null);
    calendarService.getByLease(id).then((events) => {
      if (cancelled) return;
      setLeaseCalendarEvents(events);
      setEventsLoading(false);
    }).catch((err) => {
      if (cancelled) return;
      setEventsError(err instanceof Error ? err.message : 'Failed to load events');
      setEventsLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  if (!lease) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Lease not found.</p>
        <Link to="/dashboard/leases" className="text-primary hover:text-primary text-sm font-medium mt-2 inline-block">Back to Leases</Link>
      </div>
    );
  }

  const leaseCams = camReconciliations.filter(c => c.leaseId === id);
  const leaseDocs = documents.filter(d => d.leaseId === id);
  const leaseInvoices = invoices.filter(i => i.leaseId === id);
  const leaseActivity = activityToTimelineItems(activityLog.filter(a => a.entityId === id || leaseDiscs.some(d => d.id === a.entityId)).slice(0, 10));

  // Computed rent schedule data from lease
  const leaseStart = new Date(lease.start_date);
  const leaseEnd = new Date(lease.end_date);
  const totalYears = leaseEnd.getFullYear() - leaseStart.getFullYear();
  const escalationRate = lease.cam_cap_percent / 100;

  const rentSchedule = Array.from({ length: Math.max(totalYears, 1) }, (_, i) => {
    const year = leaseStart.getFullYear() + i;
    const escalatedRent = lease.baseRent * Math.pow(1 + escalationRate, i);
    return {
      year,
      yearNum: i + 1,
      annualRent: Math.round(escalatedRent),
      monthlyRent: Math.round(escalatedRent / 12),
    };
  });

  return (
    <div>
      <PageHeader
        title={lease.leaseNumber}
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/overview' }, { label: 'Leases', href: '/dashboard/leases' }, { label: lease.leaseNumber }]}
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
                  ['Term Start', formatDate(lease.start_date)],
                  ['Term End', formatDate(lease.end_date)],
                  ['Base Rent', formatCurrency(lease.baseRent) + ' / year'],
                  ['Square Footage', `${lease.squareFootage.toLocaleString()} sq ft`],
                  ['CAM Type', <CAMTypeBadge type={lease.camType} />],
                  ['Renewal Option', lease.renewalOption ? <span className="flex items-center gap-1 text-success-700"><CheckCircle className="w-4 h-4" /> Yes</span> : 'No'],
                  ['Escalation Rate', formatPercent(lease.cam_cap_percent) + ' / year'],
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

          {/* Critical dates summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Lease Commencement', date: lease.start_date, icon: Calendar, color: 'bg-success-50 border-success-200 text-success-700' },
              { label: 'Lease Expiration', date: lease.end_date, icon: Calendar, color: 'bg-error-50 border-error-200 text-error-700' },
              { label: 'Next Escalation', date: (() => { try { const d = new Date(lease.start_date); if (isNaN(d.getTime())) return lease.start_date; d.setFullYear(new Date().getFullYear() + 1); return d.toISOString(); } catch { return lease.start_date; } })(), icon: Calendar, color: 'bg-warning-50 border-warning-100 text-warning-700' },
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

          {/* Discrepancies summary */}
          {discsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">Loading discrepancies...</span>
            </div>
          ) : discsError ? (
            <div className="p-4 text-center text-sm text-error-600">{discsError}</div>
          ) : leaseDiscs.length > 0 && (
            <div className="bg-card rounded-xl border border-border shadow-card">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                <h3 className="text-sm font-semibold text-foreground">Discrepancies ({leaseDiscs.length})</h3>
                <button onClick={() => setNewDiscOpen(true)} className="text-sm text-primary hover:text-primary font-medium">+ New Discrepancy</button>
              </div>
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
            </div>
          )}

          {/* CAM summary */}
          {leaseCams.length > 0 && (
            <div className="bg-card rounded-xl border border-border shadow-card">
              <div className="px-5 py-4 border-b border-border/50">
                <h3 className="text-sm font-semibold text-foreground">CAM Summary</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5">
                {leaseCams.slice(0, 3).map(c => (
                  <div key={c.id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">FY{c.fiscalYear}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Billed: {formatCurrency(c.amountBilled)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <VarianceIndicator amount={c.variance} size="sm" />
                      <Link to={`/cam-reconciliations/${c.id}`} className="text-xs text-primary hover:text-primary font-medium">View</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Rent Schedule' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Base Rent (Year 1)" value={formatCurrency(lease.baseRent)} />
            <StatCard label="Escalation Rate" value={formatPercent(lease.cam_cap_percent) + ' / year'} />
            <StatCard label="Lease Term" value={`${totalYears} years`} />
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card">
            <div className="px-5 py-4 border-b border-border/50">
              <h3 className="text-sm font-semibold text-foreground">Projected Rent Schedule</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-muted border-b border-border/50">
                  <tr>
                    {['Year', 'Calendar Year', 'Annual Rent', 'Monthly Rent', 'Escalation'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rentSchedule.map((row, idx) => {
                    const prevRent = idx > 0 ? rentSchedule[idx - 1].annualRent : lease.baseRent;
                    const increase = row.annualRent - prevRent;
                    return (
                      <tr key={row.year} className="border-b border-border/30 hover:bg-accent transition-colors">
                        <td className="px-5 py-3 font-medium text-foreground text-sm">Year {row.yearNum}</td>
                        <td className="px-5 py-3 text-sm text-foreground/80">{row.year}</td>
                        <td className="px-5 py-3 text-sm font-semibold text-foreground">{formatCurrency(row.annualRent)}</td>
                        <td className="px-5 py-3 text-sm text-foreground/80">{formatCurrency(row.monthlyRent)}</td>
                        <td className="px-5 py-3 text-sm text-foreground/80">
                          {idx === 0 ? <span className="text-muted-foreground">--</span> : <span className="text-warning-700">+{formatCurrency(increase)}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upcoming escalation events from service */}
          {eventsLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">Loading events...</span>
            </div>
          ) : eventsError ? (
            <div className="p-4 text-center text-sm text-error-600">{eventsError}</div>
          ) : leaseCalendarEvents.filter(e => e.type === 'escalation').length > 0 && (
            <div className="bg-card rounded-xl border border-border shadow-card">
              <div className="px-5 py-4 border-b border-border/50">
                <h3 className="text-sm font-semibold text-foreground">Upcoming Escalations</h3>
              </div>
              <div className="divide-y divide-border/30">
                {leaseCalendarEvents.filter(e => e.type === 'escalation').map(event => (
                  <div key={event.id} className="flex items-start gap-4 px-5 py-4">
                    <div className="text-center shrink-0 w-14">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</p>
                      <p className="text-2xl font-bold text-foreground leading-tight">{new Date(event.date).getDate()}</p>
                      <p className="text-xs text-muted-foreground/70">{new Date(event.date).getFullYear()}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'CAM Audit' && (
        <div className="space-y-6">
          {/* CAM summary metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total CAM Reconciliations" value={String(leaseCams.length)} />
            <StatCard label="Total Expenses" value={formatCurrency(leaseCams.reduce((sum, c) => sum + c.totalExpenses, 0))} />
            <StatCard label="Total Billed" value={formatCurrency(leaseCams.reduce((sum, c) => sum + c.amountBilled, 0))} />
            <StatCard label="Net Variance" value={formatCurrency(leaseCams.reduce((sum, c) => sum + c.variance, 0))} />
          </div>

          {/* CAM items table */}
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

          {/* CAM line items detail */}
          {leaseCams.length > 0 && (
            <div className="bg-card rounded-xl border border-border shadow-card">
              <div className="px-5 py-4 border-b border-border/50">
                <h3 className="text-sm font-semibold text-foreground">Line Items (Latest Reconciliation)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead className="bg-muted border-b border-border/50">
                    <tr>
                      {['Category', 'Description', 'Total Amount', 'Tenant Share', 'Pass-Through'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leaseCams[0].items.map(item => (
                      <tr key={item.id} className="border-b border-border/30 hover:bg-accent transition-colors">
                        <td className="px-5 py-3 text-sm font-medium text-foreground">{item.category}</td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">{item.description}</td>
                        <td className="px-5 py-3 text-sm text-foreground/80">{formatCurrency(item.totalAmount)}</td>
                        <td className="px-5 py-3 text-sm text-foreground/80">{formatCurrency(item.tenantDollarAmount)} ({item.tenantSharePercent}%)</td>
                        <td className="px-5 py-3">
                          {item.isPassThrough
                            ? <span className="text-xs font-medium text-success-700 bg-success-50 px-2 py-0.5 rounded-full">Yes</span>
                            : <span className="text-xs font-medium text-error-700 bg-error-50 px-2 py-0.5 rounded-full">No</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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

      {activeTab === 'History' && (
        <div className="bg-card rounded-xl border border-border shadow-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Audit Timeline</h3>
          {leaseActivity.length > 0 ? <Timeline items={leaseActivity} /> : <EmptyState icon={FileText} title="No activity yet" />}
        </div>
      )}

      <FileUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <EditLeaseModal open={editOpen} onClose={() => setEditOpen(false)} lease={lease} />
      <NewDiscrepancyModal open={newDiscOpen} onClose={() => setNewDiscOpen(false)} defaultLeaseId={id} />
    </div>
  );
}
