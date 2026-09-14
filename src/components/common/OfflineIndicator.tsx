import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 flex items-center gap-3 rounded-xl bg-amber-950/95 border border-amber-600/80 px-4 py-3 text-xs font-medium text-amber-100 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4"
    >
      <div className="p-2 rounded-lg bg-amber-600/20 text-amber-400 shrink-0">
        <WifiOff className="w-4 h-4" />
      </div>
      <div>
        <p className="font-bold text-white text-xs">Offline Mode</p>
        <p className="text-amber-200/90 text-[11px] mt-0.5 leading-tight">
          You&apos;re offline. Connect to the internet to browse the latest music and make purchases.
        </p>
      </div>
    </div>
  );
};
