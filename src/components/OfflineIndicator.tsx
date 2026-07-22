'use client';
import { useState, useEffect } from 'react';
import { WifiOff, CloudOff, RefreshCw, Check } from 'lucide-react';
import { getQueueCount, syncPendingOrders } from '@/lib/offline';

export default function OfflineIndicator() {
  const [online, setOnline] = useState(true);
  const [queueCount, setQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; failed: number } | null>(null);

  useEffect(() => {
    setOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    setQueueCount(getQueueCount());

    const goOnline = () => {
      setOnline(true);
      setQueueCount(getQueueCount());
    };
    const goOffline = () => setOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    const interval = setInterval(() => {
      setQueueCount(getQueueCount());
    }, 5000);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncPendingOrders();
      setSyncResult(result);
      setQueueCount(getQueueCount());
      setTimeout(() => setSyncResult(null), 3000);
    } catch {
      setSyncResult({ synced: 0, failed: 1 });
    } finally {
      setSyncing(false);
    }
  };

  if (online && queueCount === 0) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium shadow-lg backdrop-blur-sm transition-all ${
      !online
        ? 'bg-red-500/90 text-white'
        : 'bg-[#C48A3A]/90 text-white'
    }`}>
      {!online && (
        <>
          <WifiOff size={14} className="animate-pulse" />
          <span>Offline — {queueCount} pending order{queueCount !== 1 ? 's' : ''}</span>
        </>
      )}
      {online && queueCount > 0 && (
        <>
          <CloudOff size={14} />
          <span>{queueCount} unsynced order{queueCount !== 1 ? 's' : ''}</span>
          <button onClick={handleSync} disabled={syncing}
            className="ml-1 px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50 flex items-center gap-1">
            {syncing ? (
              <><RefreshCw size={11} className="animate-spin" /> Syncing...</>
            ) : syncResult ? (
              <><Check size={11} /> Synced {syncResult.synced}</>
            ) : (
              <><RefreshCw size={11} /> Sync Now</>
            )}
          </button>
        </>
      )}
    </div>
  );
}