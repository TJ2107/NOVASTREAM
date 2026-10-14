import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Hls from 'hls.js';
import {
  Maximize2,
  Minimize2,
  PictureInPicture2,
  Volume2,
  VolumeX,
  FastForward,
  Rewind,
  Play,
  Pause,
  AlertTriangle,
  RefreshCw,
  Sliders,
  ExternalLink,
  Sparkles,
  Globe,
  Shield,
  ShieldCheck,
  Smartphone,
  Cast
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { SUPPORTED_STREAMING_PORTALS } from '../../services/UrlResolver';
import { DuoPairingModal } from '../duo/DuoPairingModal';
import { CastModal } from '../common/CastModal';
import { useCast } from '../../hooks/useCast';

interface Props {
  src: string;
  type?: 'hls' | 'dash' | 'mp4' | 'iframe';
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  isPlaying?: boolean;
  initialTime?: number;
  onProgress?: (time: number, duration?: number) => void;
  onEnded?: () => void;
  alternativeUrls?: string[];
}

export function VideoPlayer({
  src,
  type = 'hls',
  poster,
  title,
  autoPlay = true,
  isPlaying,
  initialTime = 0,
  onProgress,
  onEnded,
  alternativeUrls
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const initialTimeRef = useRef(initialTime);
  const autoPlayRef = useRef(autoPlay);
  const lastProgressCallRef = useRef<number>(0);

  useEffect(() => {
    initialTimeRef.current = initialTime;
    autoPlayRef.current = autoPlay;
    lastProgressCallRef.current = 0;
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isPlaying === undefined) return;
    if (isPlaying && video.paused) {
      video.play().catch(() => {});
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }
  }, [isPlaying]);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [qualities, setQualities] = useState<{ height: number; index: number; name?: string }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 is Auto
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const [isDuoModalOpen, setIsDuoModalOpen] = useState(false);
  const [isCastModalOpen, setIsCastModalOpen] = useState(false);

  const { isCasting, activeDeviceName, stopCasting } = useCast(videoRef.current);

  const { volume, setVolume, loadDemoSources, vpnEnabled, vpnServer, toggleVPN, setIsInterfaceVisible } = useAppStore();

  useEffect(() => {
    return () => setIsInterfaceVisible(true);
  }, [setIsInterfaceVisible]);

  const streamCandidates = useMemo(() => [src, ...(alternativeUrls || [])], [src, alternativeUrls]);
  const [activeStreamIndex, setActiveStreamIndex] = useState(0);

  useEffect(() => {
    setActiveStreamIndex(0);
  }, [src]);

  const effectiveSrc = streamCandidates[activeStreamIndex] || src;

  const isPortalDomain = SUPPORTED_STREAMING_PORTALS.some((p) => effectiveSrc.includes(p));
  const isDirectHls = effectiveSrc.includes('.m3u8');
  const isDirectVideo = effectiveSrc.includes('.mp4') || effectiveSrc.includes('.webm') || effectiveSrc.includes('.mkv') || effectiveSrc.includes('.avi');
  const isDirectAudio = effectiveSrc.includes('.mp3') || effectiveSrc.includes('.aac') || effectiveSrc.includes('.ogg');
  const isWebPage = isPortalDomain || (!isDirectHls && !isDirectVideo && !isDirectAudio && (effectiveSrc.startsWith('http://') || effectiveSrc.startsWith('https://')));

  const isIframe = useIframeFallback || type === 'iframe' || isWebPage || effectiveSrc.includes('youtube.com/embed') || effectiveSrc.includes('player.twitch.tv');

  // Ensure all streams route through the server-side dynamic CORS & Anti-403 Proxy
  const targetStreamUrl = effectiveSrc.startsWith('/api/proxy')
    ? effectiveSrc
    : effectiveSrc.startsWith('http')
    ? `/api/proxy?url=${encodeURIComponent(effectiveSrc)}`
    : effectiveSrc;

  const initializePlayer = useCallback(async () => {
    const video = videoRef.current;
    if (!video || isIframe) return;

    setErrorMessage(null);
    setIsBuffering(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHlsSource = type === 'hls' || src.includes('.m3u8') || (!src.includes('.mp4') && !src.includes('.webm') && !src.includes('.mkv'));

    if (isHlsSource && Hls.isSupported()) {
      let networkRetryCount = 0;
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        manifestLoadingTimeOut: 15000,
        manifestLoadingMaxRetry: 6,
        levelLoadingTimeOut: 15000,
        levelLoadingMaxRetry: 6,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6,
        xhrSetup: (xhr, url) => {
          // If any URL escaped proxy rewriting, ensure it routes through /api/proxy
          if ((url.startsWith('http://') || url.startsWith('https://')) && !url.includes('/api/proxy')) {
            xhr.open('GET', `/api/proxy?url=${encodeURIComponent(url)}`, true);
          }
        }
      });
      hlsRef.current = hls;

      hls.loadSource(targetStreamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsBuffering(false);
        networkRetryCount = 0;
        const levels = data.levels.map((lvl, index) => ({
          height: lvl.height,
          index,
          name: lvl.height ? `${lvl.height}p` : `Niveau ${index + 1}`
        }));
        setQualities(levels);

        const t0 = initialTimeRef.current;
        if (t0 > 0 && Number.isFinite(t0)) {
          video.currentTime = t0;
        }

        if (autoPlayRef.current) {
          video.play().catch(() => {
            video.muted = true;
            setMuted(true);
            video.play().catch(() => {});
          });
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setCurrentQuality(data.level);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              networkRetryCount++;
              if (networkRetryCount <= 2) {
                hls.startLoad();
              } else if (activeStreamIndex < streamCandidates.length - 1) {
                // Auto-switch to next available server
                hls.destroy();
                hlsRef.current = null;
                setActiveStreamIndex((prev) => prev + 1);
              } else {
                // Fallback to native HLS playback if available (Safari / Apple devices)
                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                  video.src = targetStreamUrl;
                  video.play().catch(() => {});
                } else {
                  setIsBuffering(false);
                  setErrorMessage('Flux distant momentanément inaccessible. Basculez sur un autre serveur ou activez le VPN.');
                  hls.destroy();
                }
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setIsBuffering(false);
              setErrorMessage('Erreur lors du décodage du flux vidéo.');
              hls.destroy();
              break;
          }
        }
      });
      return;
    }

    // Native HLS for Safari iOS/macOS or Direct MP4/WebM video
    const t0 = initialTimeRef.current;
    if (video.canPlayType('application/vnd.apple.mpegurl') && isHlsSource) {
      video.src = targetStreamUrl;
      if (t0 > 0) video.currentTime = t0;
      if (autoPlayRef.current) video.play().catch(() => {});
      setIsBuffering(false);
    } else {
      video.src = targetStreamUrl;
      if (t0 > 0) video.currentTime = t0;
      if (autoPlayRef.current) video.play().catch(() => {});
      setIsBuffering(false);
    }
  }, [type, isIframe, targetStreamUrl]);

  useEffect(() => {
    initializePlayer();
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [initializePlayer]);

  // Volume sync
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  // Mouse idle detection for controls fade-out
  useEffect(() => {
    let timeout: any;
    const handleActivity = () => {
      setShowControls(true);
      setIsInterfaceVisible(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (playing) {
          setShowControls(false);
          setIsInterfaceVisible(false);
        }
      }, 3500);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleActivity);
      container.addEventListener('touchstart', handleActivity);
    }

    return () => {
      clearTimeout(timeout);
      container?.removeEventListener('mousemove', handleActivity);
      container?.removeEventListener('touchstart', handleActivity);
    };
  }, [playing]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'k':
        case 'K':
          togglePlay();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case 'p':
        case 'P':
          togglePiP();
          break;
        case 'c':
        case 'C':
          setIsCastModalOpen(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playing, volume]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    const nextMuted = !muted;
    v.muted = nextMuted;
    setMuted(nextMuted);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setFullscreen(false)).catch(() => {});
    }
  };

  const togglePiP = async () => {
    try {
      const v = videoRef.current;
      if (!v) return;
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await v.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('PiP not available:', e);
    }
  };

  const skip = (sec: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + sec));
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    v.currentTime = pos * duration;
  };

  const handleQualityChange = (levelIdx: number) => {
    try {
      if (hlsRef.current) {
        hlsRef.current.currentLevel = levelIdx;
        setCurrentQuality(levelIdx);
      }
    } catch (e) {
      console.warn('Quality change error:', e);
    }
    setShowSettings(false);
  };

  const handleSpeedChange = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
    setShowSettings(false);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const h = Math.floor(m / 60);
    if (h > 0) {
      const remM = m % 60;
      return `${h}:${remM < 10 ? '0' : ''}${remM}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // If iframe stream (YouTube, Twitch, or external web portal)
  if (isIframe) {
    const matchedPortal = SUPPORTED_STREAMING_PORTALS.find((p) => src.includes(p));

    return (
      <div className="relative w-full h-full min-h-[360px] bg-black rounded-2xl overflow-hidden flex flex-col">
        {/* Portal & Web Player Header Bar */}
        <div className="bg-[#0b0b22] px-4 py-3 flex items-center justify-between border-b border-purple-500/20 text-xs gap-3">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            {matchedPortal ? (
              <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 font-mono text-[10px] font-bold flex items-center gap-1 flex-shrink-0">
                <Globe className="w-3 h-3 text-cyan-400" />
                {matchedPortal.toUpperCase()}
              </span>
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
            )}
            <span className="font-semibold truncate text-white/95 text-xs sm:text-sm">
              {title || (matchedPortal ? `Portail ${matchedPortal}` : 'Lecteur Web Intégré')}
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            {useIframeFallback && (
              <button
                onClick={() => setUseIframeFallback(false)}
                className="px-2.5 py-1.5 rounded-lg glass hover:bg-white/10 text-white/70 hover:text-white transition text-xs font-medium"
              >
                Retour direct
              </button>
            )}
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-950/50 transition transform active:scale-95 border border-cyan-400/40"
              title="Plein écran externe / Ouvrir dans un nouvel onglet"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-200" />
              <span className="hidden sm:inline">Plein écran externe / Ouvrir dans un nouvel onglet</span>
              <span className="sm:hidden">Ouvrir dans un nouvel onglet</span>
            </a>
          </div>
        </div>

        {/* Helpful Tip Banner for restricted sites (Google, YouTube, etc.) */}
        <div className="bg-gradient-to-r from-blue-950/70 via-[#0d102d] to-purple-950/70 px-4 py-2 flex items-center justify-between border-b border-white/5 text-[11px] text-white/80">
          <div className="flex items-center gap-2 min-w-0 truncate">
            <span className="text-amber-400 text-xs">💡</span>
            <span className="truncate">
              Si ce site (ex. Google, YouTube) bloque l'affichage direct dans un cadre, utilisez le bouton ci-dessus pour y accéder instantanément.
            </span>
          </div>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-300 hover:text-white font-semibold flex-shrink-0 ml-3 underline"
          >
            Accéder directement &rarr;
          </a>
        </div>

        {/* Interactive Web Frame with full media permissions */}
        <iframe
          src={effectiveSrc}
          className="w-full flex-1 border-0 min-h-[500px]"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write; display-capture"
          allowFullScreen
          title={title || 'Player'}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[320px] bg-black group select-none overflow-hidden flex items-center justify-center rounded-2xl shadow-2xl"
    >
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full max-h-[85vh] object-contain cursor-pointer"
        onClick={togglePlay}
        onPlay={() => {
          setPlaying(true);
          setIsInterfaceVisible(false);
        }}
        onPause={() => {
          setPlaying(false);
          setIsInterfaceVisible(true);
          if (onProgress && videoRef.current) {
            const t = videoRef.current.currentTime;
            const dur = videoRef.current.duration;
            lastProgressCallRef.current = t;
            onProgress(t, Number.isFinite(dur) && dur > 0 ? dur : undefined);
          }
        }}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsInterfaceVisible(false);
        }}
        onError={() => {
          setIsBuffering(false);
          setErrorMessage('Erreur du lecteur vidéo : flux inaccessible ou non décodable.');
        }}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          const dur = e.currentTarget.duration;
          setCurrentTime(t);
          if (onProgress && Math.abs(t - lastProgressCallRef.current) >= 3) {
            lastProgressCallRef.current = t;
            onProgress(t, Number.isFinite(dur) && dur > 0 ? dur : undefined);
          }
        }}
        onDurationChange={(e) => setDuration(e.currentTarget.duration || 0)}
        onEnded={() => {
          setPlaying(false);
          onEnded?.();
        }}
        playsInline
      />

      {/* Buffering loader */}
      {isBuffering && !errorMessage && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full border-4 border-red-500/20 border-t-[#E50914] animate-spin" />
        </div>
      )}

      {/* Error state overlay */}
      {errorMessage && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
          <AlertTriangle className="w-14 h-14 text-amber-400 mb-3" />
          <h3 className="text-xl font-bold text-white mb-2">Impossible de charger ce flux</h3>
          <p className="text-white/70 text-xs md:text-sm max-w-lg mb-6 leading-relaxed">
            {errorMessage}
          </p>

          <div className="flex gap-3 flex-wrap justify-center max-w-md">
            <button
              onClick={initializePlayer}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-semibold flex items-center gap-2 transition text-white shadow-lg shadow-purple-900/40"
            >
              <RefreshCw className="w-4 h-4" /> Réessayer
            </button>

            <button
              onClick={() => {
                toggleVPN();
                setTimeout(() => initializePlayer(), 400);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-600 hover:to-emerald-600 rounded-xl text-xs font-semibold flex items-center gap-2 transition text-white shadow-lg border border-emerald-400/30"
              title="Contournez les blocages FAI avec le serveur suisse (1 tap)"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>{vpnEnabled ? 'Changer serveur VPN Suisse' : 'Activer VPN Suisse (1 Tap)'}</span>
            </button>

            <button
              onClick={() => {
                loadDemoSources();
                setTimeout(() => initializePlayer(), 400);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-xs font-semibold flex items-center gap-2 transition text-white shadow-lg"
            >
              <Sparkles className="w-4 h-4" /> Recharger flux démo 100% actifs
            </button>

            <button
              onClick={() => setUseIframeFallback(true)}
              className="px-4 py-2.5 glass hover:bg-white/10 rounded-xl text-xs font-medium flex items-center gap-2 transition text-white/90"
            >
              <Globe className="w-4 h-4 text-cyan-400" /> Mode Iframe
            </button>

            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 rounded-xl text-xs font-semibold flex items-center gap-2 transition text-white shadow-lg shadow-cyan-900/40"
              title="Plein écran externe / Ouvrir dans un nouvel onglet"
            >
              <ExternalLink className="w-4 h-4 text-cyan-200" />
              <span>Plein écran externe / Ouvrir dans un nouvel onglet</span>
            </a>
          </div>

          <div className="mt-6 text-[11px] text-white/40 max-w-md">
            💡 Astuce : Les flux en ligne publics changent fréquemment d'adresse ou bloquent le navigateur (CORS). Utilisez l'onglet « Bibliothèque » pour coller vos propres flux IPTV / HLS directs.
          </div>
        </div>
      )}

      {/* Central big Play/Pause icon click feedback */}
      <button
        onClick={togglePlay}
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-[#E50914]/85 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95 shadow-2xl accent-glow ${
          showControls || !playing ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-label={playing ? 'Pause' : 'Lecture'}
      >
        {playing ? <Pause className="w-9 h-9" /> : <Play className="w-9 h-9 ml-1 text-white" />}
      </button>

      {/* Overlay UI Controls */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/80 flex flex-col justify-between p-4 md:p-6 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="w-2.5 h-2.5 rounded-full bg-[#E50914] animate-pulse" />
            <h2 className="font-bold text-sm md:text-base truncate drop-shadow text-white">{title || 'NOVASTREAM Player'}</h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-white/70">
            {/* 1-Tap VPN Shield */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleVPN();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold transition border ${
                vpnEnabled
                  ? 'bg-emerald-950/80 border-emerald-400/50 text-emerald-300 shadow-sm'
                  : 'bg-black/40 border-white/20 text-white/50 hover:text-white'
              }`}
              title={
                vpnEnabled
                  ? `VPN actif (${vpnServer.flag} ${vpnServer.city}) - Cliquez pour basculer`
                  : 'VPN inactif - Cliquez pour activer en 1 tap'
              }
            >
              {vpnEnabled ? (
                <>
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>{vpnServer.flag} VPN CH</span>
                </>
              ) : (
                <>
                  <Shield className="w-3 h-3 text-amber-400" />
                  <span>1-TAP VPN</span>
                </>
              )}
            </button>

            {/* Stream Server Switcher */}
            {streamCandidates.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveStreamIndex((prev) => (prev + 1) % streamCandidates.length);
                }}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold transition border bg-cyan-950/70 border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-300 shadow-sm"
                title="Changer de serveur / miroir de diffusion"
              >
                <RefreshCw className="w-3 h-3 text-cyan-400" />
                <span>FLUX {activeStreamIndex + 1}/{streamCandidates.length}</span>
              </button>
            )}

            {/* Cast to TV / Chromecast button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCastModalOpen(true);
              }}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold transition border shadow-sm ${
                isCasting
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300 shadow-emerald-950/50'
                  : 'bg-red-950/80 border-red-500/40 text-red-300 hover:text-white hover:border-red-400'
              }`}
              title="Diffuser / Caster sur TV, Chromecast ou AirPlay (C)"
            >
              <Cast className={`w-3 h-3 ${isCasting ? 'text-emerald-400 animate-pulse' : 'text-[#E50914]'}`} />
              <span>{isCasting ? (activeDeviceName || 'CAST ACTIF') : 'CAST TV'}</span>
            </button>

            {/* Duo Cast to TV button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDuoModalOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold transition border bg-indigo-950/80 border-indigo-400/50 text-indigo-300 hover:text-white hover:border-indigo-300 shadow-sm"
              title="Duo : Continuer ce film sur la télé (le téléphone pilote)"
            >
              <Smartphone className="w-3 h-3 text-cyan-400" />
              <span>DUO TV</span>
            </button>

            {/* External Fullscreen / Open in New Tab Button */}
            {src && (
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold transition border bg-cyan-950/80 border-cyan-400/40 text-cyan-300 hover:text-white hover:border-cyan-300 shadow-sm"
                title="Plein écran externe / Ouvrir dans un nouvel onglet"
              >
                <ExternalLink className="w-3 h-3 text-cyan-400" />
                <span className="hidden sm:inline">NOUVEL ONGLET</span>
              </a>
            )}

            {duration > 0 ? (
              <span>VOD</span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-red-500/80 text-white font-bold tracking-wider text-[10px]">
                DIRECT
              </span>
            )}
          </div>
        </div>

        {/* Bottom Bar: Timeline + Actions */}
        <div className="space-y-3">
          {/* Timeline Bar (for VOD or recorded streams) */}
          {duration > 0 && (
            <div
              onClick={handleSeek}
              className="relative h-2 bg-white/20 hover:h-3 rounded-full cursor-pointer transition-all group/bar"
            >
              <div
                className="absolute left-0 top-0 bottom-0 bg-[#E50914] rounded-full shadow-[0_0_8px_rgba(229,9,20,0.6)]"
                style={{ width: `${Math.min(100, (currentTime / duration) * 100)}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg opacity-0 group-hover/bar:opacity-100 transition-opacity"
                style={{ left: `${Math.min(100, (currentTime / duration) * 100)}%` }}
              />
            </div>
          )}

          {/* Controls row */}
          <div className="flex items-center justify-between gap-2 text-white">
            {/* Left controls */}
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={togglePlay}
                className="p-2 rounded-lg hover:bg-white/10 transition tv-focusable"
                title={playing ? 'Pause (Espace)' : 'Lecture (Espace)'}
              >
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              <button
                onClick={() => skip(-10)}
                className="p-2 rounded-lg hover:bg-white/10 transition tv-focusable"
                title="Reculer de 10s (←)"
              >
                <Rewind className="w-4 h-4" />
              </button>

              <button
                onClick={() => skip(10)}
                className="p-2 rounded-lg hover:bg-white/10 transition tv-focusable"
                title="Avancer de 10s (→)"
              >
                <FastForward className="w-4 h-4" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-1.5 group/vol">
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-lg hover:bg-white/10 transition tv-focusable"
                  title="Couper / Activer son (M)"
                >
                  {muted || volume === 0 ? (
                    <VolumeX className="w-5 h-5 text-red-400" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={muted ? 0 : volume}
                  onChange={(e) => {
                    const newVol = parseFloat(e.target.value);
                    setVolume(newVol);
                    if (muted) {
                      setMuted(false);
                      if (videoRef.current) videoRef.current.muted = false;
                    }
                  }}
                  className="w-16 md:w-20 accent-purple-500 h-1 cursor-pointer bg-white/20 rounded-lg hidden sm:block"
                />
              </div>

              {/* Timestamp */}
              <div className="text-xs font-mono text-white/80 hidden sm:block">
                {formatTime(currentTime)} {duration > 0 && `/ ${formatTime(duration)}`}
              </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-1.5 md:gap-2">
              {/* Settings button */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded-lg hover:bg-white/10 transition tv-focusable"
                  title="Paramètres de flux"
                >
                  <Sliders className="w-4 h-4" />
                </button>

                {showSettings && (
                  <div className="absolute bottom-10 right-0 w-48 glass-strong rounded-xl p-3 shadow-2xl border border-purple-500/30 text-xs space-y-3 z-40">
                    <div>
                      <span className="font-semibold text-white/70 block mb-1">Vitesse</span>
                      <div className="grid grid-cols-4 gap-1">
                        {[0.75, 1, 1.25, 1.5].map((rate) => (
                          <button
                            key={rate}
                            onClick={() => handleSpeedChange(rate)}
                            className={`px-1.5 py-1 rounded text-center font-mono ${
                              playbackRate === rate ? 'bg-purple-600 text-white' : 'glass hover:bg-white/10'
                            }`}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    </div>

                    {qualities.length > 0 && (
                      <div>
                        <span className="font-semibold text-white/70 block mb-1">Qualité vidéo</span>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          <button
                            onClick={() => handleQualityChange(-1)}
                            className={`w-full text-left px-2 py-1 rounded ${
                              currentQuality === -1 ? 'bg-purple-600 text-white' : 'hover:bg-white/10'
                            }`}
                          >
                            Auto
                          </button>
                          {qualities.map((q) => (
                            <button
                              key={q.index}
                              onClick={() => handleQualityChange(q.index)}
                              className={`w-full text-left px-2 py-1 rounded font-mono ${
                                currentQuality === q.index ? 'bg-purple-600 text-white' : 'hover:bg-white/10'
                              }`}
                            >
                              {q.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cast to TV / Chromecast / AirPlay */}
              <button
                onClick={() => setIsCastModalOpen(true)}
                className={`p-2 rounded-lg hover:bg-white/10 transition tv-focusable relative ${
                  isCasting ? 'text-emerald-400' : 'text-white/80 hover:text-white'
                }`}
                title="Diffuser / Caster sur TV, Chromecast ou AirPlay (C)"
              >
                <Cast className="w-4 h-4" />
                {isCasting && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>

              {/* Duo Screen Cast */}
              <button
                onClick={() => setIsDuoModalOpen(true)}
                className="p-2 rounded-lg hover:bg-white/10 transition tv-focusable text-cyan-400 hover:text-cyan-300"
                title="Duo : Envoyer sur la télé"
              >
                <Smartphone className="w-4 h-4" />
              </button>

              {/* Picture in Picture */}
              <button
                onClick={togglePiP}
                className="p-2 rounded-lg hover:bg-white/10 transition tv-focusable"
                title="Picture-in-Picture (P)"
              >
                <PictureInPicture2 className="w-4 h-4" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg hover:bg-white/10 transition tv-focusable"
                title="Plein écran (F)"
              >
                {fullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cast Modal (Chromecast, Smart TV, AirPlay) */}
      <CastModal
        isOpen={isCastModalOpen}
        onClose={() => setIsCastModalOpen(false)}
        videoElement={videoRef.current}
        media={{
          url: targetStreamUrl,
          title: title || 'Flux NOVASTREAM',
          poster: poster,
          isLive: duration === 0,
          currentTime
        }}
        onOpenDuo={() => setIsDuoModalOpen(true)}
      />

      {/* Duo Pairing / Handoff Modal */}
      <DuoPairingModal
        isOpen={isDuoModalOpen}
        onClose={() => setIsDuoModalOpen(false)}
        currentMedia={{
          id: src,
          title: title || 'Média en cours',
          url: src,
          type: 'movie',
          poster: poster
        }}
        currentTime={currentTime}
      />
    </div>
  );
}
