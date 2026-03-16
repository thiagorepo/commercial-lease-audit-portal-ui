import { Bell, Search, Menu, ChevronRight, Home, LogOut, User, Settings, Moon, Sun } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { currentUser } from '@/data/mock';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/portfolios': 'Portfolios',
  '/properties': 'Properties',
  '/leases': 'Leases',
  '/discrepancies': 'Discrepancies',
  '/cam-reconciliations': 'CAM Audit',
  '/calendar': 'Calendar',
  '/reports': 'Reports',
  '/exports': 'Exports',
  '/settings': 'Settings',
  '/admin': 'Admin',
};

function buildBreadcrumbs(pathname: string) {
  const parts = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; href: string }[] = [{ label: 'Dashboard', href: '/' }];

  if (parts.length === 0) return crumbs;

  let path = '';
  for (let i = 0; i < parts.length; i++) {
    path += '/' + parts[i];
    const label = routeLabels[path] || parts[i].charAt(0).toUpperCase() + parts[i].slice(1).replace(/-/g, ' ');
    crumbs.push({ label, href: path });
  }

  return crumbs;
}

interface HeaderProps {
  onMenuClick: () => void;
  onCommandPalette: () => void;
}

export function Header({ onMenuClick, onCommandPalette }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const breadcrumbs = buildBreadcrumbs(location.pathname);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    html.classList.toggle('dark');
    setIsDark(!isDark);
    localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center gap-4 px-4 shrink-0">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 text-muted-foreground hover:text-accent-foreground hover:bg-accent rounded-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      <nav className="flex-1 min-w-0">
        <ol className="flex items-center gap-1.5 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <li key={crumb.href} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />}
              {i === breadcrumbs.length - 1 ? (
                <span className="text-primary font-medium truncate">{crumb.label}</span>
              ) : (
                <Link
                  to={crumb.href}
                  className="text-muted-foreground hover:text-primary truncate transition-colors"
                >
                  {i === 0 ? <Home className="w-4 h-4" /> : crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex items-center gap-2">
        <button
          onClick={onCommandPalette}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted hover:bg-accent rounded-lg transition-colors"
        >
          <Search className="w-4 h-4" />
          <span>Search...</span>
          <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-card border border-border rounded font-mono">⌘K</kbd>
        </button>

        <button
          onClick={() => navigate('/discrepancies')}
          className="flex items-center gap-0.5 px-2 py-1 bg-warning-50 border border-warning-100 rounded-full text-xs text-warning-700 hover:bg-warning-100 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-warning-500 animate-pulse-dot shrink-0" />
          <span className="hidden sm:inline ml-1">3 pending</span>
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 text-muted-foreground hover:text-accent-foreground hover:bg-accent dark:text-muted-foreground/70 dark:hover:text-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 text-muted-foreground hover:text-accent-foreground hover:bg-accent rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error-500 rounded-full" />
          </button>

          {notificationsOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotificationsOpen(false)} />
              <div className="absolute right-0 top-10 z-20 w-80 bg-card border border-border rounded-xl shadow-lg">
                <div className="px-4 py-3 border-b border-border/50">
                  <p className="text-sm font-semibold text-foreground">Notifications</p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {[
                    { title: 'Lease expiring soon', desc: 'One Harbor Plaza - Expires in 30 days', time: '2 hours ago' },
                    { title: 'CAM reconciliation due', desc: 'Midtown Tower - Q1 2025', time: '5 hours ago' },
                    { title: 'Discrepancy resolved', desc: 'PRE-036 has been approved', time: '1 day ago' },
                  ].map((notif, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        toast.info(notif.title);
                        setNotificationsOpen(false);
                      }}
                      className="w-full px-4 py-3 border-b border-border/30 hover:bg-accent transition-colors text-left"
                    >
                      <p className="text-sm font-medium text-foreground">{notif.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{notif.desc}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">{notif.time}</p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-accent transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold">
              {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-10 z-20 w-52 bg-card border border-border rounded-xl shadow-lg py-1">
                <div className="px-4 py-2.5 border-b border-border/50">
                  <p className="text-sm font-semibold text-foreground">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                </div>
                <Link
                  to="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-foreground/80 hover:bg-accent"
                >
                  <User className="w-4 h-4 text-muted-foreground/70" /> Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-foreground/80 hover:bg-accent"
                >
                  <Settings className="w-4 h-4 text-muted-foreground/70" /> Settings
                </Link>
                <div className="border-t border-border/50 mt-1" />
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    toast.success('Signed out successfully');
                    navigate('/login');
                  }}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-error-600 hover:bg-error-50 w-full text-left"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
