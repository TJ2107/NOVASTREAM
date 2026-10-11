import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Tv,
  Film,
  Tv2,
  Radio,
  Library,
  Globe,
  Shield,
  Smartphone,
  Tv as TVIcon,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Grid2X2
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { PlatformCompatibilityModal } from '../common/PlatformCompatibilityModal';
import { NovaLogo } from '../common/NovaLogo';

const navItems = [
  { to: '/', icon: Home, label: 'Accueil' },
  { to: '/duo', icon: Smartphone, label: 'Duo Multi-Écrans', isDuo: true },
  { to: '/vpn', icon: Shield, label: 'Bouclier VPN', isVpn: true },
  { to: '/browser', icon: Globe, label: 'Navigateur Portails' },
  { to: '/tv', icon: Tv, label: 'TV en direct' },
  { to: '/multiview', icon: Grid2X2, label: 'Mode Mosaïque' },
  { to: '/movies', icon: Film, label: 'Films' },
  { to: '/series', icon: Tv2, label: 'Séries' },
  { to: '/radio', icon: Radio, label: 'Radios' },
  { to: '/library', icon: Library, label: 'Bibliothèque' },
  { to: '/settings', icon: SettingsIcon, label: 'Paramètres' }
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ 
  isCollapsed: externalCollapsed, 
  onToggleCollapse: externalToggle 
}: SidebarProps = {}) {
  const { tvMode, setTVMode, vpnEnabled, vpnServer } = useAppStore();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false);

  // Controlled or local state
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const toggleCollapse = () => {
    if (externalToggle) {
      externalToggle();
    } else {
      setInternalCollapsed(prev => !prev);
    }
  };

  return (
    <>
      <aside 
        className={`hidden md:flex md:flex-col glass-strong border-r border-white/[0.08] h-screen sticky top-0 z-30 select-none transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Brand Header - NOVASTREAM Cinema Brand */}
        <div className={`h-16 px-3 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} border-b border-white/[0.08]`}>
          <NavLink to="/" className="flex items-center gap-2.5 min-w-0 transition-opacity hover:opacity-95" title="Accueil NOVASTREAM">
            <NovaLogo size="sm" showText={!isCollapsed} />
          </NavLink>

          <button 
            onClick={toggleCollapse} 
            className={`p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors ${isCollapsed ? 'hidden' : 'block'}`}
            title="Réduire la barre latérale"
            aria-label="Réduire la barre latérale"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Collapsed Expand Button */}
        {isCollapsed && (
          <div className="py-2 flex justify-center border-b border-white/5">
            <button
              onClick={toggleCollapse}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              title="Agrandir la barre latérale"
              aria-label="Agrandir la barre latérale"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, isVpn, isDuo }) => (
            <NavLink
              key={to}
              to={to}
              title={isCollapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center ${isCollapsed ? 'justify-center px-0 py-2.5' : 'justify-between px-3 py-2'} rounded-xl transition-all text-[13px] font-medium ${
                  isActive
                    ? 'bg-white/10 text-white font-semibold border-l-2 border-[#E50914] shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                } ${tvMode ? 'tv-focusable' : ''}`
              }
            >
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'} min-w-0`}>
                <Icon className={`w-4 h-4 flex-shrink-0 ${
                  isVpn && vpnEnabled 
                    ? 'text-emerald-400' 
                    : isDuo 
                    ? 'text-[#E50914]' 
                    : ''
                }`} />
                {!isCollapsed && <span className="truncate">{label}</span>}
              </div>

              {!isCollapsed && isDuo && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/40">
                  DUO
                </span>
              )}
              {!isCollapsed && isVpn && vpnEnabled && (
                <span className="text-[10px] leading-none" title={vpnServer.country}>
                  {vpnServer.flag}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-2 border-t border-white/[0.08] space-y-1.5">
          {!isCollapsed && (
            <div className="px-1">
              <PWAInstallButton />
            </div>
          )}

          <button
            onClick={() => setShowCompatibilityModal(true)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-2.5 py-1.5'} rounded-xl transition-all text-xs font-medium text-white/70 hover:bg-white/5 hover:text-white glass ${tvMode ? 'tv-focusable' : ''}`}
            title="Compatibilité iOS, Android, TV et PC"
            aria-label="Compatibilité multi-plateformes"
          >
            <Smartphone className="w-3.5 h-3.5 flex-shrink-0 text-blue-400" />
            {!isCollapsed && (
              <div className="flex flex-col text-left leading-tight min-w-0">
                <span className="text-[11px] font-medium truncate">Compatibilité</span>
                <span className="text-[9px] text-white/40 font-normal">Multi-écrans</span>
              </div>
            )}
          </button>

          <button
            onClick={() => setTVMode(!tvMode)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-2.5 py-1.5'} rounded-xl transition-all text-xs font-medium ${
              tvMode
                ? 'bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/40 accent-glow'
                : 'text-white/70 hover:bg-white/5 hover:text-white glass'
            } ${tvMode ? 'tv-focusable' : ''}`}
            title="Activer/Désactiver le mode TV"
            aria-label="Mode télécommande TV"
          >
            <TVIcon className="w-3.5 h-3.5 flex-shrink-0 text-[#E50914]" />
            {!isCollapsed && (
              <div className="flex flex-col text-left leading-tight min-w-0">
                <span className="text-[11px] font-medium truncate">Mode TV {tvMode ? 'Actif' : ''}</span>
                <span className="text-[9px] text-white/40 font-normal">Télécommande</span>
              </div>
            )}
          </button>
        </div>
      </aside>

      <PlatformCompatibilityModal 
        isOpen={showCompatibilityModal} 
        onClose={() => setShowCompatibilityModal(false)} 
      />
    </>
  );
}
