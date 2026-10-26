import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, Play, CheckCircle2, Tv, ShieldCheck, Smartphone, Clock } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useNavigate } from 'react-router-dom';

export function InterstitialAdModal() {
  const { showInterstitialAd, setShowInterstitialAd, resetFreeWatchSeconds, subscriptionPlan } = useAppStore();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(60); // 1 minute (60 seconds)
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (!showInterstitialAd || subscriptionPlan !== 'free') {
      setTimeLeft(60);
      setCanSkip(false);
      return;
    }

    setTimeLeft(60);
    setCanSkip(false);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showInterstitialAd, subscriptionPlan]);

  if (!showInterstitialAd || subscriptionPlan !== 'free') {
    return null;
  }

  const handleClose = () => {
    setShowInterstitialAd(false);
    resetFreeWatchSeconds();
  };

  const handleUpgrade = () => {
    setShowInterstitialAd(false);
    navigate('/settings');
  };

  const progressPercent = Math.min(100, Math.max(0, ((60 - timeLeft) / 60) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-fade-in select-none">
      {/* Background ambient red/gold glows */}
      <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 sm:w-96 h-72 sm:h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Billboard Container */}
      <div className="max-w-2xl w-full bg-[#0d0d14] border border-white/20 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 md:p-8 space-y-3.5 sm:space-y-5 shadow-2xl relative overflow-hidden my-auto max-h-[96vh] flex flex-col justify-between">
        
        {/* Animated Progress Bar at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5 sm:pb-3.5 pt-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="px-2.5 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/40 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider animate-pulse flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              <span>Annonce (1 min)</span>
            </span>
            <span className="text-white/60 text-xs font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400 inline" />
              <strong className="text-amber-400 font-bold">{timeLeft}s</strong>
            </span>
          </div>

          <button
            onClick={handleUpgrade}
            className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold text-[11px] sm:text-xs transition shadow-lg hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer ml-auto"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Passer en VIP (Sans Pub)</span>
          </button>
        </div>

        {/* Billboard Main Display (Le Panneau Publicitaire) */}
        <div className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-[#140826] via-[#0d0718] to-[#05020a] border border-white/15 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center text-center shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(229,9,20,0.18),transparent_75%)] pointer-events-none" />
          
          {/* Logo & Slogan Header */}
          <div className="flex flex-col items-center gap-2 mb-2 sm:mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-[#E50914] via-red-600 to-amber-500 flex items-center justify-center shadow-xl shadow-red-600/40 animate-bounce">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-red-400 tracking-tight">
              NOVASTREAM
            </h2>
            <p className="text-xs sm:text-base md:text-xl font-bold text-amber-300 font-sans tracking-wide">
              « Le numérique autrement dans la télé »
            </p>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-white/80 max-w-lg leading-relaxed mb-3 sm:mb-5">
            Profitez de vos chaînes TV en direct, films et séries avec une qualité d'image HD/4K, le streaming multi-écrans et un son haute fidélité.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3 w-full max-w-md pt-2 border-t border-white/10">
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col items-center gap-1">
              <Tv className="w-4 h-4 text-red-400" />
              <span className="text-[10px] sm:text-xs font-semibold text-white/90">TV & VOD 4K</span>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] sm:text-xs font-semibold text-white/90">Proxy Anti-403</span>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col items-center gap-1">
              <Smartphone className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] sm:text-xs font-semibold text-white/90">Mode Duo TV</span>
            </div>
          </div>

          <div className="mt-3 sm:mt-4 text-[10px] sm:text-[11px] text-white/40 font-mono">
            Abonnement Gratuit • Prochaine publicité dans 5 min
          </div>
        </div>

        {/* Footer & Skip Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 pt-1 sm:pt-2 border-t border-white/10">
          <div className="text-xs text-white/70 text-center sm:text-left">
            {canSkip ? (
              <span className="text-emerald-400 font-semibold flex items-center justify-center sm:justify-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Vous pouvez maintenant reprendre la lecture.</span>
              </span>
            ) : (
              <span className="text-amber-400/90 font-mono text-[11px] sm:text-xs">
                Bouton de reprise actif dans <strong className="text-amber-300 font-bold">{timeLeft}s</strong>...
              </span>
            )}
          </div>

          <button
            onClick={handleClose}
            disabled={!canSkip}
            className={`w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-extrabold text-xs sm:text-sm transition flex items-center justify-center gap-2 min-h-[44px] ${
              canSkip
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/25 cursor-pointer hover:scale-105 active:scale-95'
                : 'bg-white/10 text-white/30 cursor-not-allowed border border-white/5'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Passer la publicité</span>
          </button>
        </div>
      </div>
    </div>
  );
}

