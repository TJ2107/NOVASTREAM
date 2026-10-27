import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, X, Radio, Activity, Waves, Cast } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioStore } from '../../store/useAudioStore';
import { RadioVisualizerModal } from '../radio/RadioVisualizerModal';
import { CastModal } from '../common/CastModal';
import { secureUrl } from '../../services/secureStream';

export function AudioPlayer() {
  const { currentTrack, isPlaying, volume, isMuted, togglePlay, close, setVolume, toggleMute, resume, pause } = useAudioStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const [isCastModalOpen, setIsCastModalOpen] = useState(false);
  const [useProxy, setUseProxy] = useState(false);
  const [candidateIndex, setCandidateIndex] = useState(0);

  // Candidate URLs list
  const candidates = useMemo(() => {
    if (!currentTrack?.url) return [];
    const list = [currentTrack.url];
    if (Array.isArray(currentTrack.alternativeUrls)) {
      currentTrack.alternativeUrls.forEach((u) => {
        if (u && !list.includes(u)) list.push(u);
      });
    }
    return list;
  }, [currentTrack]);

  const rawUrl = candidates[candidateIndex] || currentTrack?.url;

  const resolvedUrl = useMemo(() => {
    if (!rawUrl) return '';
    if (rawUrl.startsWith('blob:') || rawUrl.startsWith('data:')) return rawUrl;
    if (useProxy) return `/proxy?url=${encodeURIComponent(rawUrl)}`;
    return secureUrl(rawUrl);
  }, [rawUrl, useProxy]);

  // Reset fallback state when track ID changes
  useEffect(() => {
    setUseProxy(false);
    setCandidateIndex(0);
    setLoadError(false);
  }, [currentTrack?.id]);

  const handleAudioError = useCallback(() => {
    if (!useProxy && rawUrl && !rawUrl.startsWith('blob:') && !rawUrl.startsWith('data:')) {
      console.log('[AudioPlayer] Auto-recovering: Switching to proxy for:', rawUrl);
      setUseProxy(true);
      return;
    }
    if (candidateIndex + 1 < candidates.length) {
      console.log(`[AudioPlayer] Auto-recovering: Switching to alternative candidate #${candidateIndex + 2}`);
      setCandidateIndex((prev) => prev + 1);
      setUseProxy(false);
      return;
    }
    setLoadError(true);
  }, [useProxy, rawUrl, candidateIndex, candidates.length]);

  useEffect(() => {
    if (!currentTrack || !audioRef.current || !resolvedUrl) return;
    setLoadError(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const audio = audioRef.current;

    if (resolvedUrl.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(resolvedUrl);
      hls.attachMedia(audio);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        audio.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          handleAudioError();
        }
      });
    } else {
      audio.src = resolvedUrl;
      if (isPlaying) {
        audio.play().catch(() => {});
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [resolvedUrl, isPlaying, handleAudioError]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  if (!currentTrack) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-[72px] sm:bottom-20 md:bottom-6 right-2 left-2 md:left-auto md:right-6 md:w-96 z-40 glass-strong rounded-2xl p-2.5 sm:p-3 shadow-2xl border border-white/15 bg-black/85 backdrop-blur-2xl"
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Logo or Icon with Equalizer effect */}
            <div 
              onClick={() => setIsVisualizerOpen(true)}
              className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden glass flex-shrink-0 bg-black/70 flex items-center justify-center cursor-pointer group hover:scale-105 transition-transform border border-white/10"
              title="Ouvrir le visualiseur d'ondes"
            >
              {currentTrack.logo ? (
                <img
                  src={currentTrack.logo}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-[#E50914]" />
              )}

              {/* Live equalizer visualizer overlay */}
              {isPlaying && !loadError && (
                <div className="absolute inset-0 bg-black/60 flex items-end justify-around px-1.5 pb-1 backdrop-blur-xs">
                  {[45, 80, 60, 95].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-[#E50914] rounded-full"
                      style={{
                        height: `${h}%`,
                        animation: `pulse 0.${5 + i * 2}s ease-in-out infinite alternate`
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Station Title & Status */}
            <div 
              onClick={() => setIsVisualizerOpen(true)}
              className="flex-1 min-w-0 cursor-pointer py-0.5"
            >
              <div className="font-extrabold text-xs sm:text-sm truncate text-white hover:text-red-300 transition-colors">
                {currentTrack.title}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#E50914] font-mono font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] animate-ping" />
                <span>{loadError ? 'Flux indisponible' : 'RADIO EN DIRECT'}</span>
              </div>
            </div>

            {/* Responsive Touch Controls */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button
                onClick={() => setIsVisualizerOpen(true)}
                className="p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Ouvrir le visualiseur d'ondes"
              >
                <Waves className="w-4 h-4 text-[#E50914]" />
              </button>

              <button
                onClick={() => setIsCastModalOpen(true)}
                className="p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Diffuser la radio sur TV / Enceinte Wi-Fi / Cast"
              >
                <Cast className="w-4 h-4 text-[#E50914]" />
              </button>

              <button
                onClick={togglePlay}
                className="p-2.5 rounded-full bg-[#E50914] hover:bg-[#F40612] text-white transition shadow-md tv-focusable active:scale-95 min-w-[38px] min-h-[38px] flex items-center justify-center"
                title={isPlaying ? 'Pause' : 'Lecture'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
              </button>

              <button
                onClick={toggleMute}
                className="p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition tv-focusable min-w-[36px] min-h-[36px] flex items-center justify-center hidden sm:flex"
                title={isMuted ? 'Activer le son' : 'Couper le son'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                onClick={close}
                className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition tv-focusable min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Fermer le lecteur radio"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Audio tag */}
          <audio
            ref={audioRef}
            onPlay={() => resume()}
            onPause={() => pause()}
            onError={handleAudioError}
          />
        </motion.div>
      </AnimatePresence>

      <RadioVisualizerModal
        isOpen={isVisualizerOpen}
        onClose={() => setIsVisualizerOpen(false)}
      />

      {currentTrack && (
        <CastModal
          isOpen={isCastModalOpen}
          onClose={() => setIsCastModalOpen(false)}
          media={{
            url: currentTrack.url,
            title: currentTrack.title || 'Radio NOVASTREAM',
            poster: currentTrack.logo,
            isLive: true
          }}
        />
      )}
    </>
  );
}
