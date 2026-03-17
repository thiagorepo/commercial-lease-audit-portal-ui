import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, MapPin, FileText, AlertTriangle,
  Calculator, Calendar, BarChart3, Download, Settings, Shield,
  ChevronLeft, ChevronRight, LogOut, Menu, X, File, Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { organization, currentUser } from '@/data/mock';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/overview' },
  { label: 'Portfolios', icon: Building2, href: '/dashboard/portfolios' },
  { label: 'Properties', icon: MapPin, href: '/dashboard/properties' },
  { label: 'Leases', icon: FileText, href: '/dashboard/leases' },
  { label: 'Discrepancies', icon: AlertTriangle, href: '/dashboard/discrepancies' },
  { label: 'CAM Audit', icon: Calculator, href: '/dashboard/cam-reconciliations' },
  { label: 'Documents', icon: File, href: '/dashboard/documents' },
  { label: 'Invoices', icon: Receipt, href: '/dashboard/invoices' },
  { label: 'Calendar', icon: Calendar, href: '/dashboard/calendar' },
  { label: 'Reports', icon: BarChart3, href: '/dashboard/reports' },
  { label: 'Exports', icon: Download, href: '/dashboard/exports' },
  { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
  { label: 'Admin', icon: Shield, href: '/dashboard/admin' },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
}

export function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className={cn('flex items-center h-16 px-4 border-b border-sidebar-border', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">LeaseAudit</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{organization.name}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  style={isActive ? { backgroundColor: '#F8FAFC', color: '#09090B', borderLeftColor: '#09090B' } : {}}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    collapsed ? 'justify-center' : '',
                    isActive
                      ? 'border-l-4 font-semibold'
                      : 'text-sidebar-foreground/70 hover:bg-accent/10 hover:text-sidebar-foreground'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className={cn('shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-2">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">{currentUser.name}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{currentUser.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => onCollapse(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-lg text-sm transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span className="text-xs">Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation();

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      )}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-sidebar-foreground">LeaseAudit</span>
          </div>
          <button onClick={onClose} className="p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    onClick={onClose}
                    style={isActive ? { backgroundColor: '#F8FAFC', color: '#09090B', borderLeftColor: '#09090B' } : {}}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'border-l-4 font-semibold'
                        : 'text-sidebar-foreground/70 hover:bg-accent/10 hover:text-sidebar-foreground'
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
              {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-sidebar-foreground">{currentUser.name}</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{currentUser.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
