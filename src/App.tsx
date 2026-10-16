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
import { useWakeLock } from './hooks/useWakeLock';
import { SplashScreen } from './components/common/SplashScreen';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthGate } from './components/auth/AuthGate';
import { AuthWidget } from './components/auth/AuthWidget';
import { UserTour } from './components/common/UserTour';

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
  const { user, loading, initAuth } = useAuthStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Initialize Firebase Auth listener
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Enable TV remote control navigation when TV mode is active
  useTVRemoteNavigation();

  // Prevent screen sleep / standby mode across computers, phones, tablets, and smart TVs
  useWakeLock();

  const isPlayingMedia = /^\/(tv|movies|series)\/[^/]+$/.test(location.pathname) || location.pathname === '/multiview';

  // Scroll to top on page navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Loading state while verifying Google session
  if (loading) {
    return (
      <div className="min-h-screen bg-[#04040a] flex flex-col items-center justify-center text-white space-y-4">
        <NovaLogo size="lg" showText={true} />
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full glass border border-white/10 text-xs text-white/70">
          <div className="w-4 h-4 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
          <span>Vérification de la session Google...</span>
        </div>
      </div>
    );
  }

  // Mandatory Authentication: Non-authenticated users have NO access to the application
  if (!user) {
    return <AuthGate />;
  }

  return (
    <div className={`min-h-screen flex text-white relative ${tvMode ? 'tv-mode' : ''}`}>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <UserTour />

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
              <AuthWidget collapsed={true} />
            </div>
          </header>
        )}

        <main className="flex-1 min-w-0">
          <ErrorBoundary>
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
          </ErrorBoundary>
        </main>
      </div>

      {/* Persistent Background / Mini Audio Player - hidden when playing video media */}
      {!isPlayingMedia && isInterfaceVisible && <AudioPlayer />}

      {/* Mobile Bottom Navigation - hidden when playing media */}
      {!isPlayingMedia && isInterfaceVisible && <BottomNav />}
    </div>
  );
}
