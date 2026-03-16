import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' && navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium backdrop-blur-sm',
        isOnline
          ? 'bg-success/90 border-b border-success/20 text-success-foreground'
          : 'bg-warning/90 border-b border-warning/20 text-warning-foreground'
      )}
    >
      <span className="flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            Back online — your changes will sync
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            You're offline — changes will sync when connected
          </>
        )}
      </span>
    </div>
  );
}
