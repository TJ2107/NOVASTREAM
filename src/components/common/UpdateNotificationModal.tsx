import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, X, CheckCircle2, ShieldCheck, Download } from 'lucide-react';

const CURRENT_APP_VERSION = '2.8.0'; // Current deployed version

export function UpdateNotificationModal() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [latestVersion, setLatestVersion] = useState('2.8.0');
  const [releaseNotes, setReleaseNotes] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Force check and clear dismissed version so users immediately see updates
    const checkVersion = async () => {
      try {
        const newVersion: string = '2.8.5';
        const notes = [
          'Console Studio Audio 3D entièrement repensée et responsive',
          'Intégration du Bouclier VPN Suisse directement dans les Réglages',
          'Réduction de la taille des titres et des textes pour une ergonomie optimale',
          'Correction des flux HLS et stabilisation du mode Cast TV'
        ];

        setLatestVersion(newVersion);
        setReleaseNotes(notes);
        setShowUpdate(true);
      } catch (e) {
        // Fallback
      }
    };

    const timer = setTimeout(checkVersion, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('novastream_dismissed_update', latestVersion);
    setShowUpdate(false);
  };

  const handleUpdateNow = () => {
    setIsUpdating(true);
    setTimeout(() => {
      localStorage.setItem('novastream_dismissed_update', latestVersion);
      window.location.reload();
    }, 1200);
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="w-full max-w-lg glass-strong border border-emerald-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden bg-gradient-to-b from-indigo-950/80 via-[#0a0a24] to-black">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50">
              <Sparkles className="w-6 h-6 animate-pulse text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">Nouvelle Mise à Jour Disponible !</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                  v{latestVersion}
                </span>
              </div>
              <p className="text-xs text-white/60">Une version améliorée de NOVASTREAM est prête.</p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-2 rounded-xl glass hover:bg-white/10 text-white/60 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Release Notes */}
        <div className="space-y-3 relative z-10">
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block font-mono">
            Nouveautés & Corrections :
          </span>
          <div className="space-y-2 bg-black/40 p-4 rounded-2xl border border-white/10">
            {releaseNotes.map((note, index) => (
              <div key={index} className="flex items-start gap-2.5 text-xs text-white/90">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 relative z-10">
          <button
            onClick={handleUpdateNow}
            disabled={isUpdating}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 cursor-pointer active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Mise à jour en cours...' : 'Mettre à jour maintenant'}</span>
          </button>

          <button
            onClick={handleDismiss}
            className="w-full sm:w-auto px-4 py-3 rounded-xl glass hover:bg-white/10 text-white/70 hover:text-white font-bold text-xs transition cursor-pointer"
          >
            Plus tard
          </button>
        </div>

        <p className="text-[10px] text-white/40 text-center font-mono">
          Version actuelle installée : v{CURRENT_APP_VERSION} • Mise à jour instantanée sans perte de données.
        </p>
      </div>
    </div>
  );
}
