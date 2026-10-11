import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface Props {
  compact?: boolean;
}

export function VPNBadge({ compact = false }: Props) {
  const navigate = useNavigate();
  const { vpnEnabled, vpnServer, toggleVPN, tvMode } = useAppStore();

  return (
    <button
      onClick={() => navigate('/vpn')}
      className={`group relative flex items-center gap-2 rounded-xl transition-all select-none border ${
        vpnEnabled
          ? 'bg-gradient-to-r from-emerald-950/70 to-teal-950/70 border-emerald-500/40 text-emerald-300 hover:border-emerald-400 shadow-md shadow-emerald-950/40'
          : 'glass hover:bg-white/10 border-white/10 text-white/60 hover:text-white'
      } ${compact ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs font-semibold'} ${
        tvMode ? 'tv-focusable' : ''
      }`}
      title={
        vpnEnabled
          ? `VPN Chiffré Actif : ${vpnServer.flag} ${vpnServer.country} (${vpnServer.city}) • Pas de logs • Pas de bridage`
          : 'VPN Déconnecté : Cliquez pour chiffrer votre connexion en un tap'
      }
    >
      {/* Pulse indicator */}
      <span className="relative flex h-2 w-2 flex-shrink-0">
        {vpnEnabled ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </>
        ) : (
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500/70" />
        )}
      </span>

      {/* Flag or Shield */}
      <span className="text-sm flex-shrink-0 leading-none">
        {vpnEnabled ? vpnServer.flag : '🛡️'}
      </span>

      {/* Label */}
      {/* Label */}
      {!compact && (
        <span className="font-mono text-xs font-bold tracking-tight truncate">
          {vpnEnabled ? (
            <span className="flex items-center gap-1">
              <span>{vpnServer.country}</span>
              <span className="hidden sm:inline text-white/50 text-[10px]">• Chiffré</span>
            </span>
          ) : (
            <span>VPN Inactif</span>
          )}
        </span>
      )}
    </button>
  );
}
