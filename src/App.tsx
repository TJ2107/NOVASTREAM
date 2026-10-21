import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
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
import { InterstitialAdModal } from './components/common/InterstitialAdModal';
import { AdminAnnouncementBanner } from './components/common/AdminAnnouncementBanner';
import { lazyWithRetry } from './utils/lazyWithRetry';

const Home = lazyWithRetry(() => import('./pages/Home'));
const LiveTV = lazyWithRetry(() => import('./pages/LiveTV'));
const Movies = lazyWithRetry(() => import('./pages/Movies'));
const Series = lazyWithRetry(() => import('./pages/Series'));
const RadioPage = lazyWithRetry(() => import('./pages/Radio'));
const Library = lazyWithRetry(() => import('./pages/Library'));
const PortalBrowser = lazyWithRetry(() => import('./pages/PortalBrowser'));
const VPNPage = lazyWithRetry(() => import('./pages/VPNPage'));
const DuoPage = lazyWithRetry(() => import('./pages/DuoPage'));
const SettingsPage = lazyWithRetry(() => import('./pages/SettingsPage'));
const MultiViewPage = lazyWithRetry(() => import('./pages/MultiViewPage'));
const AdminPage = lazyWithRetry(() => import('./pages/AdminPage'));

export default function App() {
  const location = useLocation();
  const {
    tvMode,
    isInterfaceVisible,
    subscriptionPlan,
    subscriptionExpiresAt,
    setSubscriptionPlan,
    incrementFreeWatchSeconds
  } = useAppStore();
  const { user, isAdmin, loading, initAuth } = useAuthStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  const isPlayingMedia = /^\/(tv|movies|series)\/[^/]+$/.test(location.pathname) || location.pathname === '/multiview' || (location.pathname === '/browser' && location.search.includes('category='));

  // Periodic subscription auto-expiration check:
  // If subscription expiration timestamp has passed, automatically downgrade to free plan
  useEffect(() => {
    if (subscriptionPlan !== 'premium' || !subscriptionExpiresAt) return;
    const verifyExpiration = async () => {
      if (Date.now() > subscriptionExpiresAt) {
        setSubscriptionPlan('free', null);
        if (user?.uid) {
          const { updateUserSubscription } = await import('./services/analyticsService');
          updateUserSubscription(user.uid, 'free', null);
        }
      }
    };
    verifyExpiration();
    const interval = setInterval(verifyExpiration, 30000);
    return () => clearInterval(interval);
  }, [subscriptionPlan, subscriptionExpiresAt, setSubscriptionPlan, user]);

  // Accumulate watch time for free users when watching media
  useEffect(() => {
    if (showSplash || subscriptionPlan !== 'free' || !isPlayingMedia) return;
    const interval = setInterval(() => {
      incrementFreeWatchSeconds(1);
    }, 1000);
    return () => clearInterval(interval);
  }, [showSplash, subscriptionPlan, isPlayingMedia, incrementFreeWatchSeconds]);

  // Initialize Firebase Auth listener
  useEffect(() => {
    initAuth();
  }, [initAuth]);


  // Enable TV remote control navigation when TV mode is active
  useTVRemoteNavigation();

  // Prevent screen sleep / standby mode across computers, phones, tablets, and smart TVs
  useWakeLock();

  // Scroll to top on page navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // 1. Launch Splash Screen: Always unfolds smoothly on app start
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // 2. Loading state while verifying Google session (if not already finished during splash)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#04040a] flex flex-col items-center justify-center text-white space-y-4">
        <NovaLogo size="lg" showText={true} />
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full glass border border-white/10 text-xs text-white/70">
          <div className="w-4 h-4 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
          <span>Initialisation de NOVASTREAM...</span>
        </div>
      </div>
    );
  }

  // 3. Mandatory Authentication: Non-authenticated users redirected to AuthGate
  if (!user) {
    return <AuthGate />;
  }

  return (
    <div className={`min-h-screen flex text-white relative ${tvMode ? 'tv-mode' : ''}`}>
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

        {/* Free Plan Ad Banner - Compact on mobile for ergonomics */}
        {subscriptionPlan === 'free' && !isPlayingMedia && isInterfaceVisible && (
          <div className="bg-gradient-to-r from-amber-950/90 via-purple-950/90 to-indigo-950/90 border-b border-amber-500/30 px-3 py-1.5 sm:px-4 sm:py-2 flex flex-row items-center justify-between gap-2 text-[11px] sm:text-xs text-white z-10 shadow-lg">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[9px] uppercase border border-amber-500/30 flex-shrink-0">Pub</span>
              <span className="text-white/80 text-[10px] sm:text-xs truncate sm:whitespace-normal">Passez à <strong className="text-amber-300">NovaStream Sans Pub (5$/mois)</strong>.</span>
            </div>
            <a
              href="/settings"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/settings';
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[10px] sm:text-[11px] transition flex items-center gap-1 flex-shrink-0 cursor-pointer shadow-sm shadow-amber-500/20"
            >
              <span>Sans Pub (5$)</span>
            </a>
          </div>
        )}

        {/* Admin Announcements & Communications Banner */}
        {!isPlayingMedia && isInterfaceVisible && <AdminAnnouncementBanner />}

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

      {/* Free Plan Interstitial Ad Modal (1 minute ad every 30 minutes of viewing) */}
      <InterstitialAdModal />
    </div>
  );
}
