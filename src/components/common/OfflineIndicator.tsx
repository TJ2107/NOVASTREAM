import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full glass-strong px-4 py-1.5 text-xs font-medium text-amber-300 border border-amber-500/40 shadow-xl backdrop-blur-md animate-pulse">
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>Mode hors-ligne — Seuls les contenus en cache sont disponibles.</span>
    </div>
  );
};
