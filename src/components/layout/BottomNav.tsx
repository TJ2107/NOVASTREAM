import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Shield, Smartphone, Globe, Settings, ShieldAlert } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';

export function BottomNav() {
  const { tvMode, vpnEnabled } = useAppStore();
  const { isAdmin } = useAuthStore();

  // On phone / tablet, the Admin button is STRICTLY visible only for the administrator
  const items = [
    { to: '/', icon: Home, label: 'Accueil' },
    { to: '/duo', icon: Smartphone, label: 'Duo' },
    { to: '/browser', icon: Globe, label: 'Portails' },
    { to: '/vpn', icon: Shield, label: 'VPN', isVpn: true },
    ...(isAdmin ? [{ to: '/admin', icon: ShieldAlert, label: 'Admin', isAdminBadge: true }] : []),
    { to: '/settings', icon: Settings, label: 'Réglages' }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 glass-strong border-t border-white/[0.08] h-14 pb-[max(env(safe-area-inset-bottom),2px)] flex justify-around items-center px-1 backdrop-blur-2xl">
      {items.map(({ to, icon: Icon, label, isVpn, isAdminBadge }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] tracking-tight transition-all relative ${
              isActive 
                ? isAdminBadge ? 'text-amber-400 font-bold' : 'text-[#E50914] font-semibold'
                : isAdminBadge ? 'text-amber-400/80 hover:text-amber-300 font-semibold' : 'text-white/60 hover:text-white/90 font-medium'
            } ${tvMode ? 'tv-focusable' : ''}`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className={`absolute top-0 w-6 h-0.5 rounded-full ${isAdminBadge ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-[#E50914] shadow-[0_0_8px_#E50914]'}`} />
              )}
              <div className="relative mt-0.5">
                <Icon className={`w-[18px] h-[18px] mb-0.5 transition-transform ${isActive ? 'scale-110' : ''} ${
                  isVpn && vpnEnabled ? 'text-emerald-400' : isAdminBadge ? 'text-amber-400' : ''
                }`} />
                {isVpn && vpnEnabled && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                )}
                {isAdminBadge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full border border-black animate-pulse" />
                )}
              </div>
              <span className="leading-tight">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
