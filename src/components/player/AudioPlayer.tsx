import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, X, Radio, Activity, Waves, Cast } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioStore } from '../../store/useAudioStore';
import { RadioVisualizerModal } from '../radio/RadioVisualizerModal';
import { CastModal } from '../common/CastModal';

export function AudioPlayer() {
  const { currentTrack, isPlaying, volume, isMuted, togglePlay, close, setVolume, toggleMute, resume, pause } = useAudioStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const [isCastModalOpen, setIsCastModalOpen] = useState(false);

  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;
    setLoadError(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const audio = audioRef.current;
    const url = currentTrack.url;

    if (url.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(audio);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        audio.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setLoadError(true);
        }
      });
    } else {
      audio.src = url;
      audio.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentTrack]);

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
          className="fixed bottom-20 md:bottom-6 right-2 left-2 md:left-auto md:right-6 md:w-96 z-40 glass-strong rounded-2xl p-3 shadow-2xl border border-white/10"
        >
          <div className="flex items-center gap-3">
            {/* Logo or Icon with Equalizer effect */}
            <div 
              onClick={() => setIsVisualizerOpen(true)}
              className="relative w-12 h-12 rounded-xl overflow-hidden glass flex-shrink-0 bg-black/60 flex items-center justify-center cursor-pointer group"
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
                <Radio className="w-6 h-6 text-[#E50914]" />
              )}

              {/* Live equalizer visualizer */}
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
              className="flex-1 min-w-0 cursor-pointer"
            >
              <div className="font-bold text-xs truncate text-white hover:text-red-300 transition-colors">
                {currentTrack.title}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[#E50914] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] animate-ping" />
                <span>{loadError ? 'Flux indisponible' : 'RADIO EN DIRECT'}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsVisualizerOpen(true)}
                className="p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition"
                title="Ouvrir le visualiseur d'ondes"
              >
                <Waves className="w-4 h-4 text-[#E50914]" />
              </button>

              <button
                onClick={() => setIsCastModalOpen(true)}
                className="p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition"
                title="Diffuser la radio sur TV / Enceinte Wi-Fi / Cast"
              >
                <Cast className="w-4 h-4 text-[#E50914]" />
              </button>

              <button
                onClick={togglePlay}
                className="p-2.5 rounded-full bg-[#E50914] hover:bg-[#F40612] text-white transition shadow-md tv-focusable active:scale-95"
                title={isPlaying ? 'Pause' : 'Lecture'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />}
              </button>

              <button
                onClick={toggleMute}
                className="p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition tv-focusable"
                title={isMuted ? 'Activer le son' : 'Couper le son'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                onClick={close}
                className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition tv-focusable"
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
            onError={() => setLoadError(true)}
            crossOrigin="anonymous"
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
