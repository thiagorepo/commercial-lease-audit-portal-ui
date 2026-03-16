import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar, MobileSidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { CommandPalette } from '@/components/custom/CommandPalette';
import { OfflineBanner } from '@/components/custom/OfflineBanner';
import { SyncIndicator } from '@/components/custom/SyncIndicator';
import { Toaster } from 'sonner';

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [lastSyncTime] = useState<Date>(new Date());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <OfflineBanner />
      <div className="hidden lg:flex shrink-0">
        <Sidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} />
      </div>
      <MobileSidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0">
        <Header
          onMenuClick={() => setMobileMenuOpen(true)}
          onCommandPalette={() => setCommandPaletteOpen(true)}
          syncIndicator={<SyncIndicator status="synced" lastSyncTime={lastSyncTime} />}
        />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-[1400px] mx-auto p-4 md:p-6 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
      <Toaster position="top-right" richColors />
    </div>
  );
}
