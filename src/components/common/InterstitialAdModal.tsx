import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, Play, CheckCircle2 } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl w-full glass-strong rounded-3xl p-6 md:p-10 border border-white/15 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Top Ad Badge */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/40 text-[11px] font-extrabold uppercase tracking-widest animate-pulse">
              Annonce Publicitaire (1 min)
            </span>
            <span className="text-white/50 text-xs font-mono">
              Temps restant : <strong className="text-amber-400 font-bold">{timeLeft}s</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleUpgrade}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold text-xs transition shadow-lg hover:scale-105 flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Version Sans Pub (5$/mois)</span>
            </button>
          </div>
        </div>

        {/* Ad Video / Message Screen */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-950 to-black border border-white/10 flex flex-col items-center justify-center text-center p-6 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,90,95,0.15),transparent_70%)] pointer-events-none" />
          
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#E50914] to-amber-500 flex items-center justify-center shadow-2xl shadow-red-600/40 mb-4 animate-bounce">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-red-400 tracking-tight">
            NOVASTREAM
          </h2>
          <p className="text-lg md:text-2xl font-bold text-amber-300 mt-2 tracking-wide font-sans">
            « Le numérique autrement dans la télé »
          </p>
          <p className="text-xs md:text-sm text-white/70 max-w-md mt-3 leading-relaxed">
            Profitez de vos chaînes TV en direct, films et séries avec une qualité d'image révolutionnaire, le streaming multi-écrans et un son spatialisé haute fidélité.
          </p>

          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[11px] text-white/40 font-mono border-t border-white/10 pt-3">
            <span>Abonnement Gratuit (Pub toutes les 30 min)</span>
            <span>NovaStream 2026</span>
          </div>
        </div>

        {/* Action / Skip Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-white/60">
            {canSkip ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Vous pouvez maintenant reprendre votre visionnage.
              </span>
            ) : (
              <span className="text-amber-400/80">
                La reprise du film/direct sera disponible dans {timeLeft} secondes...
              </span>
            )}
          </div>

          <button
            onClick={handleClose}
            disabled={!canSkip}
            className={`px-6 py-3 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
              canSkip
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 cursor-pointer hover:scale-105'
                : 'bg-white/10 text-white/40 cursor-not-allowed border border-white/5'
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
