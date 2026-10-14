import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { AudioPlayer } from './components/player/AudioPlayer';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { NovaLogo } from './components/common/NovaLogo';
import { VPNBadge } from './components/common/VPNBadge';
import { CastBadge } from './components/common/CastBadge';
import { DuoBadge } from './components/common/DuoBadge';
import { useAppStore } from './store/useAppStore';
import { useAuthStore } from './store/useAuthStore';
import { useTVRemoteNavigation } from './hooks/useTVRemoteNavigation';
import { SplashScreen } from './components/common/SplashScreen';

const Home = lazy(() => import('./pages/Home'));
const LiveTV = lazy(() => import('./pages/LiveTV'));
const Movies = lazy(() => import('./pages/Movies'));
const Series = lazy(() => import('./pages/Series'));
const RadioPage = lazy(() => import('./pages/Radio'));
const Library = lazy(() => import('./pages/Library'));
const PortalBrowser = lazy(() => import('./pages/PortalBrowser'));
const VPNPage = lazy(() => import('./pages/VPNPage'));
const DuoPage = lazy(() => import('./pages/DuoPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const MultiViewPage = lazy(() => import('./pages/MultiViewPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

export default function App() {
  const location = useLocation();
  const { tvMode, isInterfaceVisible } = useAppStore();
  const { initAuth } = useAuthStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Initialize Firebase Auth listener
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Enable TV remote control navigation when TV mode is active
  useTVRemoteNavigation();

  const isPlayingMedia = /^\/(tv|movies|series)\/[^/]+$/.test(location.pathname) || location.pathname === '/multiview';

  // Scroll to top on page navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className={`min-h-screen flex text-white relative ${tvMode ? 'tv-mode' : ''}`}>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {/* Network offline banner */}
      <OfflineIndicator />

      {/* Desktop Sidebar - hidden when playing media or interface hidden */}
      {!isPlayingMedia && isInterfaceVisible && (
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
      )}

      {/* Main View Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile Top Brand Bar - hidden when playing media or interface hidden */}
        {!isPlayingMedia && isInterfaceVisible && (
          <header className="md:hidden sticky top-0 z-20 h-14 px-3.5 glass-strong border-b border-white/[0.08] flex items-center justify-between backdrop-blur-2xl">
            <NovaLogo size="xs" showText={true} />
            <div className="flex items-center gap-1.5">
              <DuoBadge />
              <CastBadge />
              <VPNBadge compact={true} />
            </div>
          </header>
        )}

        <main className="flex-1 min-w-0">
          <Suspense fallback={<div className="p-4 text-center">Chargement...</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/tv" element={<LiveTV />} />
              <Route path="/tv/:id" element={<LiveTV />} />
              <Route path="/multiview" element={<MultiViewPage />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/movies/:id" element={<Movies />} />
              <Route path="/series" element={<Series />} />
              <Route path="/series/:id" element={<Series />} />
              <Route path="/radio" element={<RadioPage />} />
              <Route path="/library" element={<Library />} />
              <Route path="/browser" element={<PortalBrowser />} />
              <Route path="/vpn" element={<VPNPage />} />
              <Route path="/duo" element={<DuoPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </Suspense>
        </main>
      </div>

      {/* Persistent Background / Mini Audio Player - hidden when playing video media */}
      {!isPlayingMedia && isInterfaceVisible && <AudioPlayer />}

      {/* Mobile Bottom Navigation - hidden when playing media */}
      {!isPlayingMedia && isInterfaceVisible && <BottomNav />}
    </div>
  );
}
