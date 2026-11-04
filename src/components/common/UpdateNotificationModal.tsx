import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  X,
  CheckCircle2,
  Megaphone,
  Wrench,
  Zap,
  ShieldCheck,
  ChevronRight,
  Calendar,
  Layers
} from 'lucide-react';
import {
  CURRENT_APP_VERSION,
  AppUpdateInfo,
  DEFAULT_LATEST_UPDATE,
  subscribeToAppUpdate,
  isUpdateDismissed,
  isVersionInstalled,
  markUpdateAsDismissed,
  installAppUpdate
} from '../../services/UpdateService';
import { subscribeToActiveAnnouncements } from '../../services/announcementService';

export function UpdateNotificationModal() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo>(DEFAULT_LATEST_UPDATE);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [updateStep, setUpdateStep] = useState('Prêt pour la mise à jour');
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // Check if an update has already been installed on this device
    const handleGlobalUpdateInstalled = (e: any) => {
      // When update is installed anywhere, immediately hide this modal
      setShowUpdate(false);
    };

    window.addEventListener('novastream_update_installed', handleGlobalUpdateInstalled);

    // 1. Listen to real-time app update document in Firestore (app_meta/version)
    const unsubAppUpdate = subscribeToAppUpdate((latest) => {
      if (!latest || !latest.version) return;

      // If already installed on this machine, never show
      if (isVersionInstalled(latest.version)) {
        setShowUpdate(false);
        return;
      }

      // If dismissed by user, do not show
      if (isUpdateDismissed(latest.version)) {
        return;
      }

      // If it's a newer or different version from current bundle or marked forceShow
      if (latest.version !== CURRENT_APP_VERSION || latest.forceShow) {
        setUpdateInfo(latest);
        setShowUpdate(true);
      }
    });

    // 2. Also listen to announcements of type 'update'
    const unsubAnnouncements = subscribeToActiveAnnouncements((list) => {
      const updateAnnouncement = list.find((a) => a.type === 'update' && a.active);
      if (updateAnnouncement) {
        const updateKey = `announcement_update_${updateAnnouncement.id}`;
        const verMatch = updateAnnouncement.title.match(/v\d+(\.\d+)*/);
        const versionNum = verMatch ? verMatch[0].replace('v', '') : '3.0.0';

        if (isVersionInstalled(versionNum) || isUpdateDismissed(updateKey) || isUpdateDismissed(versionNum)) {
          return;
        }

        const notes = updateAnnouncement.content
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        setUpdateInfo({
          version: versionNum,
          title: updateAnnouncement.title,
          description: 'Mise à jour diffusée par l\'administrateur NOVASTREAM.',
          releaseNotes: notes.length > 0 ? notes : [updateAnnouncement.content],
          forceShow: true,
          publishedAt: updateAnnouncement.createdAt
        });
        setShowUpdate(true);
      }
    });

    return () => {
      window.removeEventListener('novastream_update_installed', handleGlobalUpdateInstalled);
      unsubAppUpdate();
      unsubAnnouncements();
    };
  }, []);

  const handleDismiss = () => {
    markUpdateAsDismissed(updateInfo.version);
    setShowUpdate(false);
  };

  const handleInstallNow = () => {
    setIsUpdating(true);
    setProgress(15);
    setUpdateStep('Téléchargement des composants de mise à jour...');

    setTimeout(() => {
      setProgress(45);
      setUpdateStep(`Application des modifications et correctifs v${updateInfo.version}...`);
    }, 600);

    setTimeout(() => {
      setProgress(80);
      setUpdateStep('Purge et synchronisation du cache média...');
    }, 1300);

    setTimeout(() => {
      setProgress(100);
      setUpdateStep('Mise à jour installée avec succès !');
      setInstalledSuccess(true);
    }, 2000);

    setTimeout(() => {
      // 1. Mark as installed & dismissed in localStorage so this notification NEVER reappears
      installAppUpdate(updateInfo.version);

      // 2. Hide and remove the notification modal completely
      setIsUpdating(false);
      setShowUpdate(false);
      setInstalledSuccess(false);
    }, 2800);
  };

  // Helper to categorize note badges
  const renderNoteItem = (note: string, index: number) => {
    let icon = <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />;
    let tag = 'Amélioration';
    let tagColor = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30';

    if (note.includes('✨') || note.toLowerCase().includes('nouveau') || note.toLowerCase().includes('nouvelle')) {
      icon = <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />;
      tag = 'Nouveauté';
      tagColor = 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30';
    } else if (note.includes('🛠️') || note.toLowerCase().includes('correct') || note.toLowerCase().includes('bug') || note.toLowerCase().includes('fix')) {
      icon = <Wrench className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />;
      tag = 'Correctif';
      tagColor = 'bg-amber-950/80 text-amber-300 border-amber-500/30';
    } else if (note.includes('⚡') || note.toLowerCase().includes('optimis') || note.toLowerCase().includes('rapid') || note.toLowerCase().includes('flux')) {
      icon = <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />;
      tag = 'Performance';
      tagColor = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30';
    } else if (note.includes('🔒') || note.toLowerCase().includes('sécurit') || note.toLowerCase().includes('abonnement')) {
      icon = <ShieldCheck className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />;
      tag = 'Sécurité';
      tagColor = 'bg-purple-950/80 text-purple-300 border-purple-500/30';
    }

    // Clean leading emojis for pure text if present
    const cleanText = note.replace(/^([✨🛠️⚡🔒•\s-]+)/, '').trim();

    return (
      <div
        key={index}
        className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition space-y-1.5"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {icon}
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border ${tagColor}`}>
              {tag}
            </span>
          </div>
          <span className="text-[10px] text-white/40 font-mono">Modif #{index + 1}</span>
        </div>
        <p className="text-xs text-white/90 leading-relaxed pl-6">
          {cleanText || note}
        </p>
      </div>
    );
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none">
      <div className="w-full max-w-lg glass-strong border border-emerald-500/40 rounded-3xl p-5 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden bg-gradient-to-b from-indigo-950/90 via-[#0a0a24] to-black">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50 flex-shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">Mise à Jour Détectée !</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                  v{updateInfo.version}
                </span>
              </div>
              <p className="text-[11px] text-white/60">
                Une nouvelle version optimisée de NOVASTREAM est disponible avec des améliorations majeures.
              </p>
            </div>
          </div>

          {!isUpdating && (
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-xl glass hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Update Details & List of Modifications */}
        {!isUpdating ? (
          <div className="space-y-3.5 relative z-10">
            {/* Update Title Banner */}
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-2.5">
              <Megaphone className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-emerald-200 block">
                  {updateInfo.title}
                </span>
                {updateInfo.description && (
                  <p className="text-[11px] text-white/70 mt-0.5 leading-relaxed">
                    {updateInfo.description}
                  </p>
                )}
              </div>
            </div>

            {/* Section: Modifications apportées */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white/80 px-1">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Détails des modifications apportées ({updateInfo.releaseNotes.length}) :</span>
                </span>
                <span className="text-[10px] text-white/40 font-mono">Changelog officiel</span>
              </div>

              {/* Scrollable list of modifications */}
              <div className="space-y-2 bg-black/60 p-3 sm:p-3.5 rounded-2xl border border-white/10 max-h-56 overflow-y-auto no-scrollbar">
                {updateInfo.releaseNotes.map((note, index) => renderNoteItem(note, index))}
              </div>
            </div>
          </div>
        ) : (
          /* Progress Bar Section during installation */
          <div className="space-y-4 relative z-10 bg-black/60 p-5 rounded-2xl border border-emerald-500/40 shadow-xl">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-300 font-bold flex items-center gap-2">
                {installedSuccess ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-bounce" />
                ) : (
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                )}
                <span>{updateStep}</span>
              </span>
              <span className="text-white font-bold">{progress}%</span>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(16,185,129,0.7)]"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="text-[11px] text-white/70 text-center font-mono">
              {installedSuccess
                ? 'Installation terminée ! Cette information va maintenant disparaître.'
                : 'Mise à niveau des composants et rechargement des flux...'}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1 relative z-10">
          <button
            onClick={handleInstallNow}
            disabled={isUpdating}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-black font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 cursor-pointer active:scale-95 disabled:opacity-80"
          >
            <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>
              {isUpdating
                ? installedSuccess
                  ? 'Finalisation...'
                  : `Installation en cours (${progress}%)...`
                : 'Installer la mise à jour'}
            </span>
          </button>

          {!isUpdating && (
            <button
              onClick={handleDismiss}
              className="w-full sm:w-auto px-5 py-3 rounded-xl glass hover:bg-white/10 text-white/70 hover:text-white font-bold text-xs transition cursor-pointer"
            >
              Plus tard
            </button>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[10px] text-white/40 font-mono pt-1 border-t border-white/5">
          <span>Version actuelle : v{CURRENT_APP_VERSION}</span>
          <span className="text-emerald-400/80">L'information disparaît une fois installée</span>
        </div>
      </div>
    </div>
  );
}
export default UpdateNotificationModal;
