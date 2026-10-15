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
  Grid2X2,
  ShieldAlert,
  MessageSquarePlus,
  Share2
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { NovaLogo } from '../common/NovaLogo';
import { AuthWidget } from '../auth/AuthWidget';
import { FeedbackModal } from '../feedback/FeedbackModal';
import { ShareAppModal } from '../common/ShareAppModal';

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
  { to: '/admin', icon: ShieldAlert, label: 'Module Admin & Logs', isAdmin: true },
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
  const { isAdmin } = useAuthStore();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Controlled or local state
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const toggleCollapse = () => {
    if (externalToggle) {
      externalToggle();
    } else {
      setInternalCollapsed(prev => !prev);
    }
  };

  const filteredNavItems = navItems.filter(item => !item.isAdmin || isAdmin);

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
          {filteredNavItems.map(({ to, icon: Icon, label, isVpn, isDuo, isAdmin: itemIsAdmin }) => (
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
                    : itemIsAdmin 
                    ? 'text-amber-400' 
                    : ''
                }`} />
                {!isCollapsed && <span className="truncate">{label}</span>}
              </div>

              {!isCollapsed && isDuo && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/40">
                  DUO
                </span>
              )}
              {!isCollapsed && itemIsAdmin && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  ADMIN
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

        {/* Footer Section: Mode TV, PWA Install, then Auth & Feedback positioned lower for ergonomics */}
        <div className="p-3 border-t border-white/[0.08] space-y-2.5 bg-black/20">
          <button
            onClick={() => setTVMode(!tvMode)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2'} rounded-xl transition-all text-xs font-medium ${
              tvMode
                ? 'bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/40 accent-glow'
                : 'text-white/70 hover:bg-white/5 hover:text-white glass'
            } ${tvMode ? 'tv-focusable' : ''}`}
            title="Activer/Désactiver le mode TV"
            aria-label="Mode télécommande TV"
          >
            <TVIcon className="w-4 h-4 flex-shrink-0 text-[#E50914]" />
            {!isCollapsed && (
              <div className="flex flex-col text-left leading-tight min-w-0">
                <span className="text-xs font-bold truncate">Mode TV {tvMode ? 'Actif' : ''}</span>
                <span className="text-[10px] text-white/40 font-normal">Télécommande D-pad</span>
              </div>
            )}
          </button>

          {!isCollapsed && (
            <div className="px-0.5">
              <PWAInstallButton />
            </div>
          )}

          {/* Divider separating navigation tools from Auth and Feedback */}
          <div className="border-t border-white/10 pt-2.5 space-y-2">
            <AuthWidget collapsed={isCollapsed} />

            {!isCollapsed && (
              <div className="space-y-1.5">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 border border-cyan-500/30 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-md"
                >
                  <Share2 className="w-4 h-4 text-cyan-300" />
                  <span>Partager sur X, FB & LinkedIn</span>
                </button>

                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/50 hover:to-purple-600/50 border border-indigo-500/30 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-md"
                >
                  <MessageSquarePlus className="w-4 h-4 text-cyan-300" />
                  <span>Donner un avis / Critique</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />

      <ShareAppModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </>
  );
}
