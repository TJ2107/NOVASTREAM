import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, X, Radio, Waves, Cast, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioStore } from '../../store/useAudioStore';
import { RadioVisualizerModal } from '../radio/RadioVisualizerModal';
import { SpatialAudioPlayer } from './SpatialAudioPlayer';
import { CastModal } from '../common/CastModal';
import { secureUrl } from '../../services/secureStream';

export function AudioPlayer() {
  const location = useLocation();
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    togglePlay,
    close,
    setVolume,
    toggleMute,
    resume,
    pause,
    setCurrentTime,
    setDuration,
    requestedSeekTime,
    clearSeek,
    isSpatialEnabled,
    bassGain,
    trebleGain,
    stereoWidth,
    activePresetId
  } = useAudioStore();

  const audioRef = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Web Audio API Nodes refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const trebleFilterRef = useRef<BiquadFilterNode | null>(null);
  const pannerNodeRef = useRef<StereoPannerNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const [webAudioReady, setWebAudioReady] = useState(false);

  const [loadError, setLoadError] = useState(false);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const [isSpatialSheetOpen, setIsSpatialSheetOpen] = useState(false);
  const [isCastModalOpen, setIsCastModalOpen] = useState(false);
  const [useProxy, setUseProxy] = useState(true); // Default to true for CORS Web Audio support
  const [corsMode, setCorsMode] = useState<'anonymous' | undefined>('anonymous');
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

  const isLocalFile = useMemo(() => {
    return !!rawUrl && (rawUrl.startsWith('blob:') || rawUrl.startsWith('data:'));
  }, [rawUrl]);

  // Proxy remote audio streams to guarantee CORS headers for Web Audio API
  const resolvedUrl = useMemo(() => {
    if (!rawUrl) return '';
    if (isLocalFile) return rawUrl;
    if (useProxy) return `/proxy?url=${encodeURIComponent(rawUrl)}`;
    return secureUrl(rawUrl);
  }, [rawUrl, useProxy, isLocalFile]);

  // Reset candidate index when track ID changes
  useEffect(() => {
    setCandidateIndex(0);
    setUseProxy(true);
    setCorsMode('anonymous');
    setLoadError(false);
  }, [currentTrack?.id]);

  // Initialize Web Audio API chain
  const initWebAudio = useCallback(() => {
    if (!audioRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = audioCtxRef.current || new AudioCtx();
      audioCtxRef.current = ctx;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      if (!sourceNodeRef.current) {
        // Media Element Source
        const source = ctx.createMediaElementSource(audioRef.current);
        sourceNodeRef.current = source;

        // Bass Filter (Low Shelf 100 Hz)
        const bass = ctx.createBiquadFilter();
        bass.type = 'lowshelf';
        bass.frequency.value = 100;
        bass.gain.value = isSpatialEnabled ? bassGain : 0;
        bassFilterRef.current = bass;

        // Treble Filter (High Shelf 8000 Hz)
        const treble = ctx.createBiquadFilter();
        treble.type = 'highshelf';
        treble.frequency.value = 8000;
        treble.gain.value = isSpatialEnabled ? trebleGain : 0;
        trebleFilterRef.current = treble;

        // Stereo Panner (Width)
        const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        if (panner) {
          panner.pan.value = isSpatialEnabled ? (stereoWidth - 0.5) * 0.8 : 0;
        }
        pannerNodeRef.current = panner;

        // Dynamics Compressor
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = isSpatialEnabled ? -24 : 0;
        compressor.knee.value = 12;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;
        compressorRef.current = compressor;

        // Master Gain Node (Controlled by Volume slider)
        const gain = ctx.createGain();
        gain.gain.value = isMuted ? 0 : volume;
        gainNodeRef.current = gain;

        // Audio Chain Routing: source -> bass -> treble -> (panner) -> compressor -> gain -> destination
        if (panner) {
          source.connect(bass);
          bass.connect(treble);
          treble.connect(panner);
          panner.connect(compressor);
          compressor.connect(gain);
          gain.connect(ctx.destination);
        } else {
          source.connect(bass);
          bass.connect(treble);
          treble.connect(compressor);
          compressor.connect(gain);
          gain.connect(ctx.destination);
        }

        setWebAudioReady(true);
      }
    } catch (e) {
      console.warn('[Web Audio] Initialization warning, direct fallback active:', e);
    }
  }, [bassGain, trebleGain, stereoWidth, isSpatialEnabled, volume, isMuted]);

  // Resume Web Audio Context on user gestures
  const resumeAudioContext = useCallback(() => {
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
  }, []);

  // Update volume & mute in real-time across both Web Audio GainNode & HTMLAudioElement
  useEffect(() => {
    const effectiveVol = isMuted ? 0 : volume;
    if (gainNodeRef.current && audioCtxRef.current) {
      try {
        gainNodeRef.current.gain.setValueAtTime(effectiveVol, audioCtxRef.current.currentTime);
      } catch {
        gainNodeRef.current.gain.value = effectiveVol;
      }
    }
    if (audioRef.current) {
      audioRef.current.volume = effectiveVol;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Update Bass EQ in real-time
  useEffect(() => {
    if (bassFilterRef.current && audioCtxRef.current) {
      const val = isSpatialEnabled ? bassGain : 0;
      try {
        bassFilterRef.current.gain.setValueAtTime(val, audioCtxRef.current.currentTime);
      } catch {
        bassFilterRef.current.gain.value = val;
      }
    }
  }, [bassGain, isSpatialEnabled]);

  // Update Treble EQ in real-time
  useEffect(() => {
    if (trebleFilterRef.current && audioCtxRef.current) {
      const val = isSpatialEnabled ? trebleGain : 0;
      try {
        trebleFilterRef.current.gain.setValueAtTime(val, audioCtxRef.current.currentTime);
      } catch {
        trebleFilterRef.current.gain.value = val;
      }
    }
  }, [trebleGain, isSpatialEnabled]);

  // Update Stereo Width / Panner in real-time
  useEffect(() => {
    if (pannerNodeRef.current && audioCtxRef.current) {
      const panVal = isSpatialEnabled ? (stereoWidth - 0.5) * 0.8 : 0;
      try {
        pannerNodeRef.current.pan.setValueAtTime(panVal, audioCtxRef.current.currentTime);
      } catch {
        pannerNodeRef.current.pan.value = panVal;
      }
    }
  }, [stereoWidth, isSpatialEnabled]);

  // Update Dynamics Compressor when preset changes
  useEffect(() => {
    if (compressorRef.current && audioCtxRef.current) {
      const val = isSpatialEnabled ? -24 : 0;
      try {
        compressorRef.current.threshold.setValueAtTime(val, audioCtxRef.current.currentTime);
      } catch {
        compressorRef.current.threshold.value = val;
      }
    }
  }, [activePresetId, isSpatialEnabled]);

  // Handle stream error recovery
  const handleAudioError = useCallback(() => {
    console.warn('[AudioPlayer] Audio tag error encountered. Trying fallback...');
    // If proxy with CORS was used, try direct mode without CORS
    if (useProxy && corsMode === 'anonymous') {
      console.log('[AudioPlayer] Fallback: Retrying stream without strict CORS...');
      setCorsMode(undefined);
      return;
    }
    // If alternative stream candidates exist, switch to next candidate
    if (candidateIndex + 1 < candidates.length) {
      console.log(`[AudioPlayer] Fallback: Trying alternative stream #${candidateIndex + 2}`);
      setCandidateIndex((prev) => prev + 1);
      setUseProxy(true);
      setCorsMode('anonymous');
      return;
    }
    setLoadError(true);
  }, [useProxy, corsMode, candidateIndex, candidates.length]);

  // Load and attach media source
  useEffect(() => {
    if (!currentTrack || !audioRef.current || !resolvedUrl) return;
    setLoadError(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const audio = audioRef.current;

    // Initialize Web Audio on media load
    initWebAudio();

    if (resolvedUrl.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(resolvedUrl);
      hls.attachMedia(audio);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        resumeAudioContext();
        if (isPlaying) {
          audio.play().catch(() => {});
        }
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          handleAudioError();
        }
      });
    } else {
      audio.src = resolvedUrl;
      resumeAudioContext();
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
  }, [resolvedUrl, initWebAudio, resumeAudioContext, handleAudioError]);

  // Play / Pause synchronization
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      resumeAudioContext();
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, resumeAudioContext]);

  // Seek synchronization
  useEffect(() => {
    if (requestedSeekTime !== null && audioRef.current) {
      audioRef.current.currentTime = requestedSeekTime;
      clearSeek();
    }
  }, [requestedSeekTime, clearSeek]);

  // Hide the floating bottom mini-player when user is on the /radio page
  // because the large Spatial Audio deck already displays all controls!
  const isRadioPage = location.pathname === '/radio';

  if (!currentTrack) return null;

  return (
    <>
      <AnimatePresence>
        {!isRadioPage && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-[72px] sm:bottom-20 md:bottom-6 right-2 left-2 md:left-auto md:right-6 md:w-96 z-40 glass-strong rounded-2xl p-2.5 sm:p-3 shadow-2xl border border-white/15 bg-black/90 backdrop-blur-2xl select-none"
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

              {/* Station Title & Status: opens the responsive Studio Player Sheet */}
              <div
                onClick={() => setIsSpatialSheetOpen(true)}
                className="flex-1 min-w-0 cursor-pointer py-0.5 group"
                title="Agrandir la feuille du lecteur Studio 3D"
              >
                <div className="font-extrabold text-xs sm:text-sm truncate text-white group-hover:text-red-300 transition-colors">
                  {currentTrack.title}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#E50914] font-mono font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] animate-ping shrink-0" />
                  <span className="truncate">{loadError ? 'Flux indisponible' : isSpatialEnabled ? 'SON SPATIAL 3D' : 'RADIO EN DIRECT'}</span>
                </div>
              </div>

              {/* Volume Slider directly in mini player for desktop */}
              <div className="hidden lg:flex items-center gap-1.5">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-16 accent-red-500 h-1 bg-white/20 rounded cursor-pointer"
                  title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                />
              </div>

              {/* Responsive Touch Controls */}
              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                {/* 3D Studio Spatial Audio Sheet Trigger */}
                <button
                  onClick={() => setIsSpatialSheetOpen(true)}
                  className="p-1.5 sm:p-2 text-purple-300 hover:text-white rounded-lg hover:bg-white/10 transition min-w-[34px] min-h-[34px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center cursor-pointer active:scale-95"
                  title="Ouvrir la feuille du lecteur Studio 3D"
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </button>

                {/* Waves Visualizer Modal Trigger */}
                <button
                  onClick={() => setIsVisualizerOpen(true)}
                  className="hidden xs:flex p-1.5 sm:p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition min-w-[34px] min-h-[34px] sm:min-w-[36px] sm:min-h-[36px] items-center justify-center cursor-pointer active:scale-95"
                  title="Ouvrir le visualiseur d'ondes"
                >
                  <Waves className="w-4 h-4 text-[#E50914]" />
                </button>

                {/* Cast Modal Trigger */}
                <button
                  onClick={() => setIsCastModalOpen(true)}
                  className="hidden sm:flex p-1.5 sm:p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition min-w-[36px] min-h-[36px] items-center justify-center cursor-pointer active:scale-95"
                  title="Diffuser la radio sur TV / Enceinte Wi-Fi / Cast"
                >
                  <Cast className="w-4 h-4 text-[#E50914]" />
                </button>

                {/* Play / Pause Primary Button */}
                <button
                  onClick={togglePlay}
                  className="p-2 sm:p-2.5 rounded-full bg-[#E50914] hover:bg-[#F40612] text-white transition shadow-md tv-focusable active:scale-95 min-w-[36px] min-h-[36px] sm:min-w-[38px] sm:min-h-[38px] flex items-center justify-center cursor-pointer"
                  title={isPlaying ? 'Pause' : 'Lecture'}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
                </button>

                {/* Mute Button */}
                <button
                  onClick={toggleMute}
                  className="p-1.5 sm:p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition tv-focusable min-w-[34px] min-h-[34px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center cursor-pointer active:scale-95"
                  title={isMuted ? 'Activer le son' : 'Couper le son'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                </button>

                {/* Close Mini Bar */}
                <button
                  onClick={close}
                  className="p-1.5 sm:p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition tv-focusable min-w-[34px] min-h-[34px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center cursor-pointer active:scale-95"
                  title="Fermer le lecteur radio"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global authoritative audio tag with Web Audio nodes attached */}
      <audio
        ref={audioRef}
        crossOrigin={isLocalFile ? undefined : corsMode}
        preload="auto"
        onPlay={() => {
          resume();
          resumeAudioContext();
        }}
        onPause={() => pause()}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration || 0);
          }
        }}
        onEnded={() => pause()}
        onError={handleAudioError}
      />

      {/* Responsive Studio Audio Player Bottom Sheet */}
      <SpatialAudioPlayer
        isOpen={isSpatialSheetOpen}
        onClose={() => setIsSpatialSheetOpen(false)}
      />

      {/* Fullscreen Radio Visualizer Modal */}
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
