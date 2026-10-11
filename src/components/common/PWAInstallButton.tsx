import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedJustNow, setInstalledJustNow] = useState(false);

  if (isInstalled && !installedJustNow) {
    return null;
  }

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstalledJustNow(true);
      setTimeout(() => setInstalledJustNow(false), 4000);
    }
  };

  return (
    <>
      {isInstallable && (
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#E50914] hover:bg-[#F40612] text-white shadow-lg shadow-red-950/40 transition-all border border-red-500/30 tv-focusable"
          title="Installer NOVASTREAM comme application PWA"
        >
          <Download className="w-3.5 h-3.5 animate-bounce" />
          <span>Installer l'app</span>
        </button>
      )}

      {isIOS && (
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg glass text-white/90 hover:text-white hover:bg-white/10 transition tv-focusable"
        >
          <Smartphone className="w-3.5 h-3.5 text-purple-400" />
          <span>Installer (iOS)</span>
        </button>
      )}

      {installedJustNow && (
        <div className="fixed bottom-20 right-4 z-50 glass-strong p-3 rounded-xl flex items-center gap-2 border border-emerald-500/40 text-emerald-300 text-sm shadow-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Application installée avec succès !</span>
        </div>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl glass-strong p-6 shadow-2xl border border-purple-500/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-bold text-white">Installer sur iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-white/80">
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-600/50 flex items-center justify-center font-bold text-white">1</span>
                <span>Touchez l'icône de <strong>Partage</strong> (rectangle avec flèche vers le haut) dans la barre Safari.</span>
              </div>
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-600/50 flex items-center justify-center font-bold text-white">2</span>
                <span>Faites défiler vers le bas et touchez <strong>Sur l'écran d'accueil</strong>.</span>
              </div>
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-600/50 flex items-center justify-center font-bold text-white">3</span>
                <span>Touchez <strong>Ajouter</strong> en haut à droite. NOVASTREAM apparaîtra sur votre écran d'accueil !</span>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-[#E50914] hover:bg-[#F40612] py-2.5 text-xs font-semibold text-white transition shadow-lg shadow-red-950/40"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </>
  );
};
