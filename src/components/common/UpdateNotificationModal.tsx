import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, X, CheckCircle2 } from 'lucide-react';

const CURRENT_APP_VERSION = '2.8.5'; // Current stable version

export function UpdateNotificationModal() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [latestVersion, setLatestVersion] = useState('2.9.0');
  const [releaseNotes, setReleaseNotes] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [updateStep, setUpdateStep] = useState('Prêt pour la mise à jour');

  useEffect(() => {
    // Check local storage to see if this version was already installed/dismissed
    const dismissedVersion = localStorage.getItem('novastream_dismissed_update');
    
    const checkVersion = async () => {
      try {
        const newVersion: string = '2.9.0';
        const notes = [
          'Console Studio Audio 3D entièrement repensée avec platine vinyle interactive',
          'Système de progression d\'installation en temps réel et masquage automatique',
          'Optimisation complète de l\'ergonomie mobile, tablette et smart TV'
        ];

        // Only show if the latest version is greater than the currently installed version
        // AND the user hasn't already installed or dismissed this version
        if (newVersion !== CURRENT_APP_VERSION && dismissedVersion !== newVersion) {
          setLatestVersion(newVersion);
          setReleaseNotes(notes);
          setShowUpdate(true);
        }
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
    setProgress(10);
    setUpdateStep('Connexion aux serveurs sécurisés...');

    setTimeout(() => {
      setProgress(35);
      setUpdateStep(`Téléchargement de la mise à jour v${latestVersion}...`);
    }, 600);

    setTimeout(() => {
      setProgress(70);
      setUpdateStep('Application du cache & optimisation WebAudio...');
    }, 1300);

    setTimeout(() => {
      setProgress(95);
      setUpdateStep('Finalisation de l\'installation...');
    }, 2000);

    setTimeout(() => {
      setProgress(100);
      setUpdateStep('Mise à jour réussie ! Prêt à l\'utilisation.');
    }, 2600);

    setTimeout(() => {
      // Save this version as dismissed/installed so it never shows up again on next restart
      localStorage.setItem('novastream_dismissed_update', latestVersion);
      setIsUpdating(false);
      setShowUpdate(false);
    }, 3200);
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

          {!isUpdating && (
            <button
              onClick={handleDismiss}
              className="p-2 rounded-xl glass hover:bg-white/10 text-white/60 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Release Notes */}
        {!isUpdating ? (
          <div className="space-y-3 relative z-10">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block font-mono">
              Nouveautés de la v{latestVersion} :
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
        ) : (
          /* Progress Bar Section during installation */
          <div className="space-y-4 relative z-10 bg-black/50 p-5 rounded-2xl border border-emerald-500/30">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-300 font-bold flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                {updateStep}
              </span>
              <span className="text-white font-bold">{progress}%</span>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="text-[11px] text-white/60 text-center font-mono">
              Veuillez patienter pendant l'installation des fichiers de mise à jour...
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 relative z-10">
          <button
            onClick={handleUpdateNow}
            disabled={isUpdating}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 cursor-pointer active:scale-95 disabled:opacity-80"
          >
            <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? `Installation en cours (${progress}%)` : 'Mettre à jour maintenant'}</span>
          </button>

          {!isUpdating && (
            <button
              onClick={handleDismiss}
              className="w-full sm:w-auto px-4 py-3 rounded-xl glass hover:bg-white/10 text-white/70 hover:text-white font-bold text-xs transition cursor-pointer"
            >
              Plus tard
            </button>
          )}
        </div>

        <p className="text-[10px] text-white/40 text-center font-mono">
          Version actuelle installée : v{CURRENT_APP_VERSION} • Mise à jour instantanée sans perte de données.
        </p>
      </div>
    </div>
  );
}
