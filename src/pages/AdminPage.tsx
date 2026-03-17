import { useState } from 'react';
import { Shield, UserPlus, X } from 'lucide-react';
import { PageHeader } from '@/components/custom/PageHeader';
import { StatusBadge } from '@/components/custom/StatusBadge';
import { users, auditLogEntries } from '@/data/mock';
import { formatDate, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const tabs = ['User Management', 'Organization', 'Audit Log'];

const roleColors: Record<string, string> = {
  admin: 'bg-primary/10 text-primary border-primary/30',
  auditor: 'bg-warning-50 text-warning-700 border-warning-100',
  viewer: 'bg-secondary-100 text-secondary-600 border-secondary-200',
};

export function AdminPage() {
  const [activeTab, setActiveTab] = useState('User Management');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('auditor');
  const [logSearch, setLogSearch] = useState('');
  const [logAction, setLogAction] = useState('all');
  const [userStates, setUserStates] = useState<Record<string, { status: string; editing?: boolean }>>(
    Object.fromEntries(users.map(u => [u.id, { status: u.status }]))
  );

  const filteredLog = auditLogEntries.filter(e => {
    if (logAction !== 'all' && e.action !== logAction) return false;
    if (logSearch && !e.user.toLowerCase().includes(logSearch.toLowerCase()) && !e.description.toLowerCase().includes(logSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Admin"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/overview' }, { label: 'Admin' }]}
        description="Manage users, organization settings, and system audit logs"
      />

      <div className="border-b border-border mb-6">
        <nav className="flex gap-1">
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={cn('px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-accent-foreground'
              )}>
              {t}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'User Management' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setInviteOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
              <UserPlus className="w-4 h-4" /> Invite User
            </button>
          </div>
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    {['User', 'Role', 'Status', 'Last Login', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-border/30 hover:bg-accent transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary text-sm font-semibold shrink-0">
                          {u.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize', roleColors[u.role])}>{u.role}</span>
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={userStates[u.id]?.status || u.status} /></td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{formatDateTime(u.lastLogin)}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setUserStates(p => ({ ...p, [u.id]: { ...p[u.id], editing: !p[u.id]?.editing } }))}
                          className="text-sm text-primary hover:text-primary font-medium"
                        >
                          {userStates[u.id]?.editing ? 'Close' : 'Edit'}
                        </button>
                        {(userStates[u.id]?.status || u.status) === 'active' && (
                          <button
                            onClick={() => {
                              setUserStates(p => ({ ...p, [u.id]: { ...p[u.id], status: 'inactive' } }));
                              toast.success(`${u.name} deactivated`);
                            }}
                            className="text-sm text-error-600 hover:text-error-700 font-medium"
                          >
                            Deactivate
                          </button>
                        )}
                        {(userStates[u.id]?.status || u.status) === 'inactive' && (
                          <button
                            onClick={() => {
                              setUserStates(p => ({ ...p, [u.id]: { ...p[u.id], status: 'active' } }));
                              toast.success(`${u.name} activated`);
                            }}
                            className="text-sm text-success-600 hover:text-success-700 font-medium"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Organization' && (
        <div className="bg-card rounded-xl border border-border shadow-card p-6 max-w-2xl">
          <h3 className="text-base font-semibold text-foreground mb-4">Organization Details</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Organization Name', value: 'Meridian Audit Group' },
              { label: 'Organization Type', value: 'Audit Firm' },
              { label: 'Address', value: '350 Fifth Avenue, Suite 4800' },
              { label: 'City', value: 'New York' },
              { label: 'State', value: 'NY' },
              { label: 'Zip Code', value: '10118' },
              { label: 'Phone', value: '(212) 555-0100' },
              { label: 'Email', value: 'info@meridianaudit.com' },
              { label: 'Website', value: 'www.meridianaudit.com' },
              { label: 'Total Leases', value: '12' },
            ].map(f => (
              <div key={f.label}>
                <label className="text-xs font-medium text-muted-foreground block mb-1">{f.label}</label>
                <input defaultValue={f.value} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
              </div>
            ))}
          </div>
          <button onClick={() => toast.success('Organization updated')} className="mt-4 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
            Save Changes
          </button>
        </div>
      )}

      {activeTab === 'Audit Log' && (
        <div>
          <div className="flex gap-3 mb-4">
            <input type="text" value={logSearch} onChange={e => setLogSearch(e.target.value)} placeholder="Search by user or action..."
              className="flex-1 max-w-sm border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
            <select value={logAction} onChange={e => setLogAction(e.target.value)} className="border border-border rounded-lg px-3 py-2.5 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring">
              <option value="all">All Actions</option>
              {['LOGIN', 'VIEW', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'INVITE'].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  {['Timestamp', 'User', 'Action', 'Entity', 'Description'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLog.map(e => (
                  <tr key={e.id} className="border-b border-border/30 hover:bg-accent transition-colors">
                    <td className="px-5 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">{formatDateTime(e.timestamp)}</td>
                    <td className="px-5 py-3 text-sm text-foreground/80">{e.user}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">{e.action}</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{e.entityType}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground max-w-xs truncate">{e.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setInviteOpen(false)} />
          <div className="relative bg-card rounded-2xl shadow-xl p-6 max-w-sm w-full animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">Invite User</h3>
              <button onClick={() => setInviteOpen(false)} className="p-1 text-muted-foreground/70 hover:text-accent-foreground rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground/80 block mb-1">Email address</label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@company.com"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground/80 block mb-1">Role</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring">
                  <option value="auditor">Auditor</option>
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setInviteOpen(false)} className="flex-1 py-2 border border-border rounded-lg text-sm text-foreground/80 hover:bg-accent">Cancel</button>
              <button onClick={() => { toast.success(`Invitation sent to ${inviteEmail}`); setInviteOpen(false); }} className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90">
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
