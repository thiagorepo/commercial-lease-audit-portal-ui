import { useState } from 'react';
import { Building2, User, Link2, Save } from 'lucide-react';
import { PageHeader } from '@/components/custom/PageHeader';
import { organization, currentUser } from '@/data/mock';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePreferences } from '@/contexts/PreferencesContext';

const tabs = [
  { id: 'organization', label: 'Organization', icon: Building2 },
  { id: 'preferences', label: 'User Preferences', icon: User },
  { id: 'integrations', label: 'Integrations', icon: Link2 },
];

const integrations = [
  { name: 'Yardi Voyager', description: 'Property management platform integration', connected: false },
  { name: 'MRI Software', description: 'Real estate management software', connected: false },
  { name: 'QuickBooks', description: 'Accounting and financial management', connected: true },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('organization');
  const [editing, setEditing] = useState(false);
  const [configOpen, setConfigOpen] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [notifications, setNotifications] = useState({
    discrepancies: true,
    deadlines: true,
    reports: true,
    digest: false,
  });
  const { dateFormat, setDateFormat, darkMode, setDarkMode } = usePreferences();

  return (
    <div>
      <PageHeader title="Settings" breadcrumbs={[{ label: 'Dashboard', href: '/dashboard/overview' }, { label: 'Settings' }]} />

      <div className="flex gap-6">
        <div className="hidden md:flex flex-col w-52 shrink-0">
          <nav className="space-y-0.5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                  activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 max-w-2xl">
          {activeTab === 'organization' && (
            <div className="bg-card rounded-xl border border-border shadow-card p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold text-foreground">Organization Settings</h2>
                <button onClick={() => setEditing(!editing)} className="text-sm text-primary hover:text-primary font-medium">
                  {editing ? 'Cancel' : 'Edit'}
                </button>
              </div>
              {[
                { label: 'Organization Name', value: organization.name },
                { label: 'Type', value: organization.type },
                { label: 'Address', value: organization.address },
                { label: 'City', value: organization.city },
                { label: 'State', value: organization.state },
                { label: 'Phone', value: organization.phone },
                { label: 'Email', value: organization.email },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">{f.label}</label>
                  {editing ? (
                    <input defaultValue={f.value} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
                  ) : (
                    <p className="text-sm text-foreground">{f.value}</p>
                  )}
                </div>
              ))}
              {editing && (
                <button onClick={() => { setEditing(false); toast.success('Settings saved'); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              )}
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="bg-card rounded-xl border border-border shadow-card p-6 space-y-6">
              <h2 className="text-base font-semibold text-foreground">User Preferences</h2>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Theme</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Dark Mode</span>
                  <button
                    onClick={() => setDarkMode(v => !v)}
                    className={cn('relative w-11 h-6 rounded-full transition-colors', darkMode ? 'bg-primary' : 'bg-muted')}
                  >
                    <div className={cn('absolute top-1 w-4 h-4 bg-card rounded-full shadow transition-transform', darkMode ? 'left-6' : 'left-1')} />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Email Notifications</h3>
                <div className="space-y-3">
                  {[
                    { key: 'discrepancies', label: 'Discrepancy alerts' },
                    { key: 'deadlines', label: 'Deadline reminders' },
                    { key: 'reports', label: 'Report updates' },
                    { key: 'digest', label: 'Weekly digest' },
                  ].map(n => (
                    <label key={n.key} className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-foreground/80">{n.label}</span>
                      <button
                        onClick={() => setNotifications(p => ({ ...p, [n.key]: !p[n.key as keyof typeof p] }))}
                        className={cn('relative w-11 h-6 rounded-full transition-colors', notifications[n.key as keyof typeof notifications] ? 'bg-primary' : 'bg-muted')}
                      >
                        <div className={cn('absolute top-1 w-4 h-4 bg-card rounded-full shadow transition-transform', notifications[n.key as keyof typeof notifications] ? 'left-6' : 'left-1')} />
                      </button>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Default Date Format</h3>
                <div className="space-y-2">
                  {['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].map(fmt => (
                    <label key={fmt} className="flex items-center gap-3 cursor-pointer">
                      <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center', dateFormat === fmt ? 'border-primary' : 'border-border')}>
                        {dateFormat === fmt && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <input type="radio" className="sr-only" checked={dateFormat === fmt} onChange={() => setDateFormat(fmt)} />
                      <span className="text-sm font-mono text-foreground/80">{fmt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button onClick={() => toast.success('Preferences saved')} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                <Save className="w-4 h-4" /> Save Preferences
              </button>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-4">
              {integrations.map(int => (
                <div key={int.name} className="bg-card rounded-xl border border-border shadow-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{int.name}</h3>
                      <p className="text-xs text-muted-foreground">{int.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', int.connected ? 'bg-success-50 text-success-700' : 'bg-muted text-muted-foreground')}>
                        {int.connected ? 'Connected' : 'Not Connected'}
                      </span>
                      <button onClick={() => setConfigOpen(configOpen === int.name ? null : int.name)} className="px-3 py-1.5 border border-border rounded-lg text-sm text-foreground/80 hover:bg-accent transition-colors">
                        Configure
                      </button>
                    </div>
                  </div>
                  {(int.connected || configOpen === int.name) && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      {configOpen === int.name ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground block mb-1">API Key</label>
                            <input
                              type="password"
                              placeholder="Enter API key..."
                              value={apiKey}
                              onChange={(e) => setApiKey(e.target.value)}
                              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (apiKey) {
                                  toast.success(`${int.name} configured successfully`);
                                  setConfigOpen(null);
                                  setApiKey('');
                                } else {
                                  toast.error('API key cannot be empty');
                                }
                              }}
                              className="px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setConfigOpen(null)}
                              className="px-3 py-1.5 border border-border text-foreground/80 text-sm font-medium rounded-lg hover:bg-accent transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1">API Key</label>
                          <input type="password" value="sk-••••••••••••••••••••••••" readOnly className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 bg-muted font-mono" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
