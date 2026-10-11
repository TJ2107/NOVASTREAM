import React, { useRef, useEffect, useState } from 'react';
import {
  Tv,
  Wifi,
  Smartphone,
  Play,
  Pause,
  Volume2,
  VolumeX,
  FastForward,
  Rewind,
  Maximize2,
  Minimize2,
  Sparkles,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useDuoStore } from '../../store/useDuoStore';
import { useAppStore, type MediaItem } from '../../store/useAppStore';
import { VideoPlayer } from '../player/VideoPlayer';

interface Props {
  fullScreenPage?: boolean;
}

export function DuoTVDisplay({ fullScreenPage = false }: Props) {
  const {
    activeMedia,
    playback,
    isPaired,
    pairingCode,
    phoneDeviceName,
    tvDeviceName,
    lastAction,
    updateTVPlayback
  } = useDuoStore();

  const { sources } = useAppStore();
  const [hudMessage, setHudMessage] = useState<string | null>(null);
  const [isTvFullscreen, setIsTvFullscreen] = useState(false);
  const tvContainerRef = useRef<HTMLDivElement>(null);

  // Default fallback media if none selected: Big Buck Bunny Demo movie
  const effectiveMedia: MediaItem = activeMedia || {
    id: 'demo-bbb',
    name: 'Big Buck Bunny (HLS)',
    title: 'Big Buck Bunny (Full Movie)',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    type: 'movie',
    group: 'Films VOD',
    category: 'cinema',
    logo: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80',
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
    description: 'Film d\'animation en haute définition - Continuité multi-écrans Duo active.'
  };

  // Capture initial media position only on media change to prevent render loops
  const initialMediaPositionRef = useRef(playback.currentTime || 0);
  useEffect(() => {
    initialMediaPositionRef.current = playback.currentTime || 0;
  }, [effectiveMedia.url]);

  // React to remote phone commands with immediate video control & TV HUD feedback
  useEffect(() => {
    if (!lastAction) return;

    // Directly control TV video element without restarting player
    const videoEl = tvContainerRef.current?.querySelector('video');
    if (videoEl) {
      if (lastAction.type === 'play' && videoEl.paused) {
        videoEl.play().catch(() => {});
      } else if (lastAction.type === 'pause' && !videoEl.paused) {
        videoEl.pause();
      } else if (lastAction.type === 'togglePlay') {
        if (videoEl.paused) videoEl.play().catch(() => {});
        else videoEl.pause();
      } else if (lastAction.type === 'skip' && typeof lastAction.payload === 'number') {
        videoEl.currentTime = Math.max(0, videoEl.currentTime + lastAction.payload);
      } else if (lastAction.type === 'seek' && typeof lastAction.payload === 'number') {
        videoEl.currentTime = lastAction.payload;
      } else if (lastAction.type === 'volume' && typeof lastAction.payload === 'number') {
        videoEl.volume = Math.max(0, Math.min(1, lastAction.payload));
        videoEl.muted = false;
      } else if (lastAction.type === 'mute') {
        videoEl.muted = !videoEl.muted;
      }
    }

    let msg = '';
    switch (lastAction.type) {
      case 'play':
        msg = '▶️ Lecture lancée par le téléphone';
        break;
      case 'pause':
        msg = '⏸️ Pause demandée par le téléphone';
        break;
      case 'togglePlay':
        msg = playback.isPlaying ? '▶️ Lecture' : '⏸️ Pause';
        break;
      case 'skip':
        msg = lastAction.payload > 0 ? `⏩ +${lastAction.payload}s` : `⏪ ${lastAction.payload}s`;
        break;
      case 'seek': {
        const mins = Math.floor(lastAction.payload / 60);
        const secs = Math.floor(lastAction.payload % 60);
        msg = `📍 Saut à ${mins}:${secs.toString().padStart(2, '0')}`;
        break;
      }
      case 'volume':
        msg = `🔊 Volume : ${Math.round(lastAction.payload * 100)}%`;
        break;
      case 'mute':
        msg = playback.isMuted ? '🔇 Son coupé par le téléphone' : '🔊 Son réactivé';
        break;
      case 'fullscreen':
        toggleTvFullscreen();
        msg = '⛶ Bascule plein écran TV';
        break;
      case 'cast':
        msg = `📲 Nouveau flux transféré depuis ${phoneDeviceName}`;
        break;
      default:
        break;
    }

    if (msg) {
      setHudMessage(msg);
      const timer = setTimeout(() => setHudMessage(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [lastAction]);

  const toggleTvFullscreen = () => {
    if (!tvContainerRef.current) return;
    if (!document.fullscreenElement) {
      tvContainerRef.current.requestFullscreen().then(() => setIsTvFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsTvFullscreen(false)).catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={tvContainerRef}
      className={`relative w-full rounded-3xl overflow-hidden glass-strong border-2 border-indigo-500/30 shadow-2xl flex flex-col bg-black ${
        fullScreenPage ? 'min-h-[600px] h-full flex-1' : 'aspect-video min-h-[380px]'
      }`}
    >
      {/* TV Bezel / Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 p-3.5 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <div className="px-2.5 py-1 rounded-full bg-indigo-950/90 border border-indigo-400/40 flex items-center gap-1.5 shadow-md">
            <Tv className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] font-black tracking-wider text-indigo-200 font-mono">
              {tvDeviceName.toUpperCase()}
            </span>
          </div>

          {isPaired ? (
            <div className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center gap-1 text-[10px] font-mono text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Piloté par : {phoneDeviceName}</span>
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 flex items-center gap-1 text-[10px] font-mono text-amber-300">
              <span>Code Duo : {pairingCode}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={toggleTvFullscreen}
            className="p-2 rounded-xl glass hover:bg-white/10 text-white/80 hover:text-white transition"
            title="Plein écran TV"
          >
            {isTvFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main TV Video Canvas */}
      <div className="relative w-full h-full flex-1 flex items-center justify-center bg-black">
        <VideoPlayer
          src={effectiveMedia.url}
          title={effectiveMedia.title}
          poster={effectiveMedia.poster || effectiveMedia.logo}
          initialTime={initialMediaPositionRef.current}
          isPlaying={playback.isPlaying}
          autoPlay={playback.isPlaying}
          onProgress={(time) => {
            updateTVPlayback({ currentTime: time });
          }}
        />

        {/* Real-time Phone HUD Overlay (Notification toasts when controlled by mobile) */}
        {hudMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-5 py-2.5 rounded-2xl bg-indigo-950/90 border border-indigo-400/50 text-white font-bold text-xs md:text-sm shadow-2xl backdrop-blur-md flex items-center gap-2.5 animate-bounce">
            <Smartphone className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>{hudMessage}</span>
          </div>
        )}

        {/* TV Pairing Badge & QR code teaser when not paired */}
        {!isPaired && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400">
              <Tv className="w-8 h-8" />
            </div>

            <div className="space-y-1 max-w-md">
              <h3 className="text-xl font-black text-white">Écran Téléviseur prêt pour Duo</h3>
              <p className="text-xs text-white/60">
                Commencez votre film sur le téléphone et transférez-le ici en 1 tap avec ce code de synchronisation :
              </p>
            </div>

            <div className="px-6 py-3 rounded-2xl bg-black/60 border-2 border-indigo-400 text-3xl font-black text-cyan-300 font-mono tracking-widest shadow-xl">
              {pairingCode}
            </div>

            <p className="text-[11px] text-white/40">
              Ouvrez le mode Téléphone sur un autre écran ou utilisez le simulateur Duo ci-contre.
            </p>
          </div>
        )}
      </div>

      {/* TV Bottom Status Banner */}
      <div className="p-3 bg-[#08081a] border-t border-indigo-500/20 flex flex-wrap items-center justify-between gap-3 text-xs z-20">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
          <span className="font-bold text-white truncate">{effectiveMedia.title}</span>
          <span className="text-[10px] text-white/40 font-mono hidden sm:inline">
            ({formatTime(playback.currentTime)} / {formatTime(playback.duration)})
          </span>
        </div>

        <div className="flex items-center gap-3 text-white/60 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-emerald-300">
            <Wifi className="w-3.5 h-3.5" /> Synchronisé en direct
          </span>
          <span className="hidden md:inline">• {playback.quality}</span>
        </div>
      </div>
    </div>
  );
}
