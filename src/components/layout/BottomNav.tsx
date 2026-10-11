import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Shield, Smartphone, Globe, Settings } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const items = [
  { to: '/', icon: Home, label: 'Accueil' },
  { to: '/duo', icon: Smartphone, label: 'Duo' },
  { to: '/browser', icon: Globe, label: 'Portails' },
  { to: '/vpn', icon: Shield, label: 'VPN', isVpn: true },
  { to: '/settings', icon: Settings, label: 'Réglages' }
];

export function BottomNav() {
  const { tvMode, vpnEnabled } = useAppStore();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 glass-strong border-t border-white/[0.08] h-14 pb-[max(env(safe-area-inset-bottom),2px)] flex justify-around items-center px-1 backdrop-blur-2xl">
      {items.map(({ to, icon: Icon, label, isVpn }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] tracking-tight transition-all relative ${
              isActive 
                ? 'text-[#E50914] font-semibold' 
                : 'text-white/60 hover:text-white/90 font-medium'
            } ${tvMode ? 'tv-focusable' : ''}`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-0 w-6 h-0.5 bg-[#E50914] rounded-full shadow-[0_0_8px_#E50914]" />
              )}
              <div className="relative mt-0.5">
                <Icon className={`w-[18px] h-[18px] mb-0.5 transition-transform ${isActive ? 'scale-110' : ''} ${
                  isVpn && vpnEnabled ? 'text-emerald-400' : ''
                }`} />
                {isVpn && vpnEnabled && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
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
