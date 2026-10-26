import React, { useState } from 'react';
import {
  Cast,
  Tv,
  Smartphone,
  Airplay,
  Radio,
  Wifi,
  ExternalLink,
  Copy,
  Check,
  X,
  Volume2,
  Square,
  ShieldCheck,
  Sparkles,
  Info
} from 'lucide-react';
import { useCast } from '../../hooks/useCast';
import { type CastMediaOptions } from '../../services/CastService';

interface CastModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoElementRef?: React.RefObject<HTMLVideoElement | null>;
  media: {
    url: string;
    title: string;
    poster?: string;
    isLive?: boolean;
    currentTime?: number;
  };
  onOpenDuo?: () => void;
}

export function CastModal({
  isOpen,
  onClose,
  videoElementRef,
  media,
  onOpenDuo
}: CastModalProps) {
  const {
    isCasting,
    activeDeviceName,
    castType,
    capabilities,
    castViaGoogleCast,
    castViaRemotePlayback,
    castViaAirPlay,
    stopCasting
  } = useCast(videoElementRef?.current);

  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  if (!isOpen) return null;

  const handleGoogleCast = async () => {
    setErrorMsg(null);
    setIsConnecting(true);
    try {
      const opts: CastMediaOptions = {
        url: media.url,
        title: media.title,
        poster: media.poster,
        isLive: media.isLive,
        currentTime: media.currentTime
      };
      const ok = await castViaGoogleCast(opts);
      if (ok) {
        onClose();
      }
    } catch (err: any) {
      if (err === 'cancel' || err?.message === 'cancel' || err?.toString?.().includes('cancel')) {
        return;
      }
      console.warn('[CastModal] Google cast notification:', err);
      
      const msg = err?.message || "Google Cast non disponible.";
      setErrorMsg(msg);

      // Si AirPlay ou RemotePlayback est disponible, proposer ou basculer facilement
      const videoEl = videoElementRef?.current;
      if (videoEl && capabilities.airPlay) {
        console.log('[CastModal] AirPlay disponible, tentative automatique...');
        try {
          if (castViaAirPlay(videoEl)) {
            onClose();
            return;
          }
        } catch (airErr) {}
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRemotePlayback = async () => {
    const videoElement = videoElementRef?.current;
    if (!videoElement) {
      setErrorMsg("Le lecteur vidéo n'est pas actif pour le partage direct.");
      return;
    }
    setErrorMsg(null);
    setIsConnecting(true);
    try {
      const ok = await castViaRemotePlayback(videoElement);
      if (ok) {
        onClose();
      } else {
        setErrorMsg(
          "La sélection d'écran sans fil a été fermée ou aucune TV n'a été sélectionnée. Si votre Smart TV n'apparaît pas automatiquement, utilisez le mode 'NOVASTREAM Duo'."
        );
      }
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          "La sélection d'écran sans fil a été annulée ou n'est pas supportée sur ce système."
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAirPlay = () => {
    const videoElement = videoElementRef?.current;
    if (!videoElement) return;
    setErrorMsg(null);
    try {
      const ok = castViaAirPlay(videoElement);
      if (ok) {
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "AirPlay n'est pas disponible sur cet appareil.");
    }
  };

  const handleCopyStreamUrl = () => {
    const streamUrl = media.url.startsWith('http')
      ? media.url
      : `${window.location.origin}${media.url.startsWith('/') ? '' : '/'}${media.url}`;

    navigator.clipboard.writeText(streamUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-2xl bg-[#09090b] border border-white/10 p-4 md:p-6 shadow-2xl text-white space-y-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle OLED Ambient Red Glow */}
        <div
          className="absolute -top-24 -right-24 w-60 h-60 rounded-full pointer-events-none opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #E50914 0%, transparent 70%)' }}
        />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E50914] to-[#990000] flex items-center justify-center shadow-lg shadow-red-900/40">
              <Cast className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">
                  Diffuser & Caster
                </h3>
                <span className="text-[9px] font-mono font-bold bg-red-950/80 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full">
                  MULTI-DISPOSITIFS
                </span>
              </div>
              <p className="text-xs text-[#A1A1A6] truncate max-w-xs md:max-w-sm">
                {media.title || 'Flux multimédia NOVASTREAM'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Cast Notification if currently casting */}
        {isCasting && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/70 via-teal-950/60 to-black/80 border border-emerald-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Diffusion en cours</span>
                    <span className="text-emerald-400 font-mono text-[11px]">
                      • {activeDeviceName || 'Écran connecté'}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-200/70">
                    Protocole : {castType === 'chromecast' ? 'Google Cast' : castType === 'airplay' ? 'AirPlay 2' : 'Écran sans fil'}
                  </span>
                </div>
              </div>

              <button
                onClick={async () => {
                  await stopCasting();
                }}
                className="px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Arrêter le Cast</span>
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 space-y-2">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMsg}</div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-amber-500/20">
              <span className="text-[10px] text-amber-300 font-medium mr-1">Alternatives :</span>
              {onOpenDuo && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenDuo();
                  }}
                  className="px-2 py-0.5 rounded bg-purple-900/80 hover:bg-purple-800 text-purple-200 text-[10px] font-bold transition flex items-center gap-1 border border-purple-500/30"
                >
                  <Smartphone className="w-3 h-3 text-purple-300" />
                  <span>Mode Duo (Scan QR TV)</span>
                </button>
              )}
              <button
                onClick={handleRemotePlayback}
                className="px-2 py-0.5 rounded bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 text-[10px] font-bold transition"
              >
                Smart TV / Miracast
              </button>
              <button
                onClick={handleAirPlay}
                className="px-2 py-0.5 rounded bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 text-[10px] font-bold transition"
              >
                AirPlay 2
              </button>
            </div>
          </div>
        )}

        {/* Target Devices Selection List */}
        <div className="space-y-2.5">
          <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-white/50 block">
            Sélectionner un protocole de diffusion
          </label>

          {/* Option 1: Google Cast / Chromecast */}
          <button
            onClick={handleGoogleCast}
            disabled={isConnecting}
            className="w-full p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-red-500/40 transition-all flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-red-950/50 border border-red-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Cast className="w-5 h-5 text-[#E50914]" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Chromecast & Google TV</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${capabilities.googleCast ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-white/10 text-white/70'}`}>
                    {capabilities.googleCast ? 'Chrome / Edge' : 'Chromium'}
                  </span>
                </div>
                <p className="text-xs text-[#A1A1A6] truncate">
                  Google TV, Chromecast Ultra/HD, Android TV, Nest Hub
                </p>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-[#E50914] text-white text-xs font-bold group-hover:bg-[#ff1a26] transition flex items-center gap-1 flex-shrink-0 ml-2 shadow-sm shadow-red-950">
              <span>Caster</span>
            </div>
          </button>

          {/* Option 2: Smart TVs & Écrans sans fil (W3C Remote Playback API) */}
          <button
            onClick={handleRemotePlayback}
            disabled={isConnecting}
            className="w-full p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-indigo-500/40 transition-all flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-indigo-950/50 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Tv className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Smart TV & Écran sans fil</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-900/40 text-indigo-300">
                    Miracast / DLNA
                  </span>
                </div>
                <p className="text-xs text-[#A1A1A6] truncate">
                  Samsung Tizen, LG webOS, Sony, Hisense, Miracast
                </p>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1 flex-shrink-0 ml-2 shadow-sm">
              <span>Connecter</span>
            </div>
          </button>

          {/* Option 3: Apple TV & AirPlay (Affiché ou priorisé sur Safari/Apple) */}
          <button
            onClick={handleAirPlay}
            disabled={isConnecting}
            className="w-full p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-cyan-500/40 transition-all flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Airplay className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>AirPlay 2 & Apple TV</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-900/40 text-cyan-300">
                    Apple
                  </span>
                </div>
                <p className="text-xs text-[#A1A1A6] truncate">
                  Apple TV 4K/HD, Mac, TV compatibles AirPlay 2
                </p>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1 flex-shrink-0 ml-2 shadow-sm">
              <span>AirPlay</span>
            </div>
          </button>

          {/* Option 4: NOVASTREAM Duo Multi-Screen */}
          {onOpenDuo && (
            <button
              onClick={() => {
                onClose();
                onOpenDuo();
              }}
              className="w-full p-3.5 rounded-xl bg-gradient-to-r from-purple-950/40 to-black/60 border border-purple-500/30 hover:border-purple-400/60 transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-purple-900/40 border border-purple-400/40 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Smartphone className="w-5 h-5 text-purple-300" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>NOVASTREAM Duo (Smart TV & PC)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-900 text-purple-300">
                      Télécommande
                    </span>
                  </div>
                  <p className="text-xs text-[#A1A1A6] truncate">
                    Ouvrez NOVASTREAM sur n'importe quel écran et pilotez avec votre smartphone
                  </p>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1 flex-shrink-0 ml-2">
                <span>Duo</span>
              </div>
            </button>
          )}
        </div>

        {/* Network link & instructions */}
        <div className="pt-2 border-t border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#A1A1A6]">
            <span className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-white/50" />
              <span>Assurez-vous d'être sur le même réseau Wi-Fi local</span>
            </span>

            <button
              onClick={handleCopyStreamUrl}
              className="hover:text-white text-[11px] font-mono flex items-center gap-1 transition"
              title="Copier le lien direct du flux pour VLC / Kodi / Smart IPTV"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Lien copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copier lien de flux</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
