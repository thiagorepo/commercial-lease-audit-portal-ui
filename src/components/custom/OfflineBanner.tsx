import { useEffect, useState } from 'react';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' && navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-warning-500/90 backdrop-blur-sm border-b border-warning-600 z-50">
      <div className="flex items-center gap-3 px-4 py-2 max-w-7xl mx-auto">
        <WifiOff className="w-4 h-4 text-white shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-white">You are offline</p>
          <p className="text-xs text-white/80">Changes will sync when connection is restored</p>
        </div>
      </div>
    </div>
  );
}
