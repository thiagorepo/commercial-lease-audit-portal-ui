import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, AlertTriangle, Download, Calendar, Clock, FileText } from 'lucide-react';
import { NewLeaseModal } from '@/components/custom/NewLeaseModal';
import { NewDiscrepancyModal } from '@/components/custom/NewDiscrepancyModal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { StatCard } from '@/components/custom/StatCard';
import { VarianceIndicator } from '@/components/custom/VarianceIndicator';
import { StatusBadge, PriorityBadge, CAMTypeBadge } from '@/components/custom/StatusBadge';
import { Timeline, activityToTimelineItems } from '@/components/custom/Timeline';
import { leases, discrepancies, activityLog, calendarEvents, sparklineData, currentUser } from '@/data/mock';
import { formatCurrency, formatDate } from '@/lib/utils';
import { themeColors } from '@/lib/colors';
import { toast } from 'sonner';

const pieColors = { active: themeColors.success[500], expired: themeColors.secondary[400], pending: themeColors.warning[500], terminated: themeColors.error[500] };

const eventIcons: Record<string, React.ElementType> = {
  renewal: Calendar,
  escalation: AlertTriangle,
  expiration: AlertTriangle,
  deadline: Clock,
  audit: FileText,
};
const eventColors: Record<string, string> = {
  renewal: 'text-success-600 bg-success-50',
  escalation: 'text-warning-600 bg-warning-50',
  expiration: 'text-error-600 bg-error-50',
  deadline: 'text-primary bg-primary/10',
  audit: 'text-secondary-600 bg-secondary-100',
};

function SkeletonCard() {
  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-5 animate-pulse">
      <div className="h-3 bg-muted rounded w-1/3 mb-3" />
      <div className="h-7 bg-muted rounded w-1/2 mb-2" />
      <div className="h-3 bg-muted rounded w-1/4" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border/30 animate-pulse">
      <td className="px-5 py-3"><div className="h-4 bg-muted rounded w-24" /></td>
      <td className="px-3 py-3"><div className="h-4 bg-muted rounded w-20" /></td>
      <td className="px-3 py-3"><div className="h-4 bg-muted rounded w-16" /></td>
      <td className="px-3 py-3"><div className="h-5 bg-muted rounded-full w-14" /></td>
      <td className="px-3 py-3"><div className="h-5 bg-muted rounded-full w-16" /></td>
      <td className="px-3 py-3"><div className="h-4 bg-muted rounded w-8 ml-auto" /></td>
    </tr>
  );
}

export function DashboardPage() {
  const [newLeaseOpen, setNewLeaseOpen] = useState(false);
  const [newDiscOpen, setNewDiscOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const today = new Date();

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const leasesByStatus = ['active','expired','pending','terminated'].map(s => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: leases.filter(l => l.status === s).length,
    color: pieColors[s as keyof typeof pieColors],
  })).filter(d => d.value > 0);

  const openDiscs = discrepancies.filter(d => ['open','pending'].includes(d.status));
  const totalRecovery = discrepancies.reduce((a, d) => a + (d.status === 'recovered' ? (d.recoveredAmount || 0) : d.status !== 'dismissed' && d.status !== 'false-positive' ? d.variance : 0), 0);
  const recoveryRate = Math.round((discrepancies.filter(d => d.status === 'recovered').length / discrepancies.length) * 100);
  const recentDiscs = openDiscs.slice(0, 5);
  const upcomingEvents = [...calendarEvents].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  const timelineItems = activityToTimelineItems(activityLog.slice(0, 10));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{greeting}, {currentUser.name.split(' ')[0]}</h1>
          <p className="text-sm text-muted-foreground">{dayName}, {formatDate(today)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard label="Total Leases" value={String(leases.length)} trend={{ value: 12, direction: 'up', positive: true }} sparkline={sparklineData.leases} />
            <StatCard label="Active Discrepancies" value={String(openDiscs.length)} trend={{ value: -8, direction: 'down', positive: true }} sparkline={sparklineData.discrepancies} />
            <StatCard label="Potential Recovery" value={formatCurrency(totalRecovery)} trend={{ value: 23, direction: 'up', positive: true }} sparkline={sparklineData.recovery} />
            <StatCard label="Recovery Rate" value={`${recoveryRate}%`} trend={{ value: 5, direction: 'up', positive: true }} sparkline={sparklineData.rate} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl border border-border shadow-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <h2 className="text-base font-semibold text-foreground">Recent Discrepancies</h2>
              <Link to="/dashboard/discrepancies" className="text-sm text-primary hover:text-primary font-medium">View all</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 w-44">Lease</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3">Category</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3 w-28">Variance</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3 w-20">Priority</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3 w-24">Status</th>
                    <th className="px-3 py-3 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : recentDiscs.map(d => (
                    <tr key={d.id} className="border-b border-border/30 hover:bg-accent transition-colors">
                      <td className="px-5 py-3 w-44">
                        <Link to={`/leases/${d.leaseId}`} className="text-sm font-medium text-primary hover:text-primary whitespace-nowrap">{d.leaseNumber}</Link>
                        <p className="text-xs text-muted-foreground truncate max-w-[160px]">{d.tenantName}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-foreground/80 capitalize whitespace-nowrap">
                          {d.category.replace(/-/g, ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-3 w-28"><VarianceIndicator amount={d.variance} percent={d.variancePercent} size="sm" /></td>
                      <td className="px-3 py-3 w-20"><PriorityBadge priority={d.priority} /></td>
                      <td className="px-3 py-3 w-24"><StatusBadge status={d.status} /></td>
                      <td className="px-3 py-3 text-right w-12">
                        <Link to={`/discrepancies/${d.id}`} className="text-sm text-primary hover:text-primary font-medium">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <h2 className="text-base font-semibold text-foreground">Portfolio Summary</h2>
            </div>
            <div className="p-5 flex flex-col md:flex-row items-center gap-6">
              <div className="w-full md:w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={leasesByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                      {leasesByStatus.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v} leases`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3">
                {leasesByStatus.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: d.color }} />
                    <div>
                      <p className="text-xs text-muted-foreground">{d.name}</p>
                      <p className="text-lg font-bold text-foreground">{d.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border shadow-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <h2 className="text-base font-semibold text-foreground">Upcoming Deadlines</h2>
              <Link to="/dashboard/calendar" className="text-sm text-primary hover:text-primary font-medium">View all</Link>
            </div>
            <div className="divide-y divide-border/30">
              {upcomingEvents.map(ev => {
                const Icon = eventIcons[ev.type];
                const colorClass = eventColors[ev.type];
                const label = ev.title.split(': ')[1] || ev.title;
                return (
                  <div key={ev.id} className="flex items-center gap-3 px-5 py-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate leading-tight">{label}</p>
                      <p className="text-xs text-muted-foreground">{ev.leaseNumber} &middot; {formatDate(ev.date)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
            </div>
            <div className="p-5">
              <Timeline items={timelineItems.slice(0, 6)} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setNewLeaseOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" /> New Lease
        </button>
        <button
          onClick={() => setNewDiscOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-primary text-primary text-sm font-semibold rounded-xl hover:bg-primary/10 transition-colors"
        >
          <AlertTriangle className="w-4 h-4" /> New Discrepancy
        </button>
        <button
          onClick={() => {
            const csvContent = [
              ['Lease #', 'Tenant', 'Property', 'Status', 'Base Rent', 'Open Discrepancies'],
              ...leases.slice(0, 5).map(l => [
                l.leaseNumber,
                l.tenantName,
                l.propertyName,
                l.status,
                l.baseRent,
                l.openDiscrepancies
              ])
            ].map(row => row.join(',')).join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `portfolio-report-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('Report exported successfully');
          }}
          className="flex-1 flex items-center justify-center gap-2 py-3 border border-border text-foreground/80 text-sm font-semibold rounded-xl hover:bg-accent transition-colors"
        >
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      <NewLeaseModal open={newLeaseOpen} onClose={() => setNewLeaseOpen(false)} />
      <NewDiscrepancyModal open={newDiscOpen} onClose={() => setNewDiscOpen(false)} />
    </div>
  );
}
