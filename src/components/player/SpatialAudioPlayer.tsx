import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Sliders,
  Upload,
  Radio as RadioIcon,
  Headphones,
  Maximize2,
  X,
  Disc,
  Activity,
  Zap,
  RotateCcw,
  Check,
  Power
} from 'lucide-react';
import { useAppStore, type MediaItem } from '../../store/useAppStore';
import { useAudioStore } from '../../store/useAudioStore';
import { secureUrl } from '../../services/secureStream';

// Helper to format time in mm:ss
function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export interface SpatialPreset {
  id: string;
  name: string;
  icon: string;
  panWidth: number; // 0 to 1
  bass: number; // dB (-12 to +12)
  treble: number; // dB (-12 to +12)
  reverbGain: number; // 0 to 1
  compressorThreshold: number; // -50 to 0 dB
}

const SPATIAL_PRESETS: SpatialPreset[] = [
  {
    id: 'cinema',
    name: 'Cinéma 3D',
    icon: '🎬',
    panWidth: 0.85,
    bass: 6,
    treble: 4,
    reverbGain: 0.35,
    compressorThreshold: -24
  },
  {
    id: 'binaural',
    name: 'Binaural Casque',
    icon: '🎧',
    panWidth: 0.95,
    bass: 4,
    treble: 6,
    reverbGain: 0.2,
    compressorThreshold: -18
  },
  {
    id: 'concert',
    name: 'Salle de Concert',
    icon: '🏛️',
    panWidth: 0.75,
    bass: 3,
    treble: 2,
    reverbGain: 0.55,
    compressorThreshold: -20
  },
  {
    id: 'studio',
    name: 'Studio Master',
    icon: '🎙️',
    panWidth: 0.5,
    bass: 2,
    treble: 2,
    reverbGain: 0.1,
    compressorThreshold: -14
  },
  {
    id: 'bassboost',
    name: 'Bass Boost 3D',
    icon: '🔊',
    panWidth: 0.8,
    bass: 10,
    treble: 3,
    reverbGain: 0.25,
    compressorThreshold: -28
  }
];

interface SpatialAudioPlayerProps {
  isOpen?: boolean;
  onClose?: () => void;
  embedded?: boolean;
}

export function SpatialAudioPlayer({ isOpen = true, onClose, embedded = false }: SpatialAudioPlayerProps) {
  const { sources } = useAppStore();
  const { currentTrack, playTrack, close: closeGlobalAudio } = useAudioStore();

  const radioAndMusicItems = sources.filter((s) => s.type === 'radio' || s.type === 'live');

  // Track state
  const [activeTrack, setActiveTrack] = useState<{ title: string; url: string; logo?: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiveStream, setIsLiveStream] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Spatial Audio toggle and parameters
  const [isSpatialEnabled, setIsSpatialEnabled] = useState(true);
  const [activePreset, setActivePreset] = useState<SpatialPreset>(SPATIAL_PRESETS[0]);
  const [stereoWidth, setStereoWidth] = useState(0.85);
  const [bassGain, setBassGain] = useState(6);
  const [trebleGain, setTrebleGain] = useState(4);

  // Web Audio API Nodes refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const pannerNodeRef = useRef<StereoPannerNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const trebleFilterRef = useRef<BiquadFilterNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Determine resolved audio URL and whether crossOrigin is supported
  const resolvedAudioUrl = useMemo(() => {
    if (!activeTrack?.url) return undefined;
    if (activeTrack.url.startsWith('blob:') || activeTrack.url.startsWith('data:')) {
      return activeTrack.url;
    }
    return secureUrl(activeTrack.url);
  }, [activeTrack]);

  const isLocalFile = useMemo(() => {
    return activeTrack?.url.startsWith('blob:') || activeTrack?.url.startsWith('data:');
  }, [activeTrack]);

  // Sync with global store track if updated
  useEffect(() => {
    if (currentTrack) {
      setActiveTrack({
        title: currentTrack.title,
        url: currentTrack.url,
        logo: currentTrack.logo || currentTrack.poster
      });
      setIsLiveStream(currentTrack.type === 'radio' || currentTrack.type === 'live');
      setLoadError(null);
    }
  }, [currentTrack]);

  // Setup Web Audio API Nodes
  const initWebAudio = useCallback(() => {
    if (!audioRef.current || audioCtxRef.current) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      try {
        // Source node from audio element
        const source = ctx.createMediaElementSource(audioRef.current);
        sourceNodeRef.current = source;

        // Stereo Panner / Width Node
        const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        pannerNodeRef.current = panner;

        // Bass EQ Node (Low Shelf)
        const bass = ctx.createBiquadFilter();
        bass.type = 'lowshelf';
        bass.frequency.value = 100;
        bass.gain.value = bassGain;
        bassFilterRef.current = bass;

        // Treble EQ Node (High Shelf)
        const treble = ctx.createBiquadFilter();
        treble.type = 'highshelf';
        treble.frequency.value = 8000;
        treble.gain.value = trebleGain;
        trebleFilterRef.current = treble;

        // Dynamics Compressor
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = activePreset.compressorThreshold;
        compressor.knee.value = 12;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;
        compressorRef.current = compressor;

        // Gain Node
        const gain = ctx.createGain();
        gainNodeRef.current = gain;

        // Connect spatial processing chain
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
      } catch (nodeErr) {
        console.warn('[Spatial Audio] Web Audio node init warning, falling back to native player:', nodeErr);
      }
    } catch (e) {
      console.warn('[Spatial Audio] Web Audio API init warning:', e);
    }
  }, [bassGain, trebleGain, activePreset]);

  // Handle play/pause
  const togglePlayPause = async () => {
    if (!audioRef.current || !activeTrack) return;

    if (!audioCtxRef.current) {
      initWebAudio();
    } else if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume().catch(() => {});
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        setLoadError(null);
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err: any) {
        console.warn('[Spatial Audio] Play error:', err);
        setLoadError('Erreur de lecture du MP3/flux. Tentez de réimporter le fichier.');
      }
    }
  };

  // Quit / Close player completely
  const handleQuitPlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.suspend().catch(() => {});
    }
    setIsPlaying(false);
    setActiveTrack(null);
    closeGlobalAudio();
    if (onClose) onClose();
  };

  // Update spatial audio processing when toggle or sliders change
  useEffect(() => {
    if (!audioCtxRef.current) return;

    if (isSpatialEnabled) {
      if (bassFilterRef.current) bassFilterRef.current.gain.value = bassGain;
      if (trebleFilterRef.current) trebleFilterRef.current.gain.value = trebleGain;
      if (pannerNodeRef.current) pannerNodeRef.current.pan.value = (stereoWidth - 0.5) * 0.8;
      if (compressorRef.current) compressorRef.current.threshold.value = activePreset.compressorThreshold;
    } else {
      // Bypass spatial effects
      if (bassFilterRef.current) bassFilterRef.current.gain.value = 0;
      if (trebleFilterRef.current) trebleFilterRef.current.gain.value = 0;
      if (pannerNodeRef.current) pannerNodeRef.current.pan.value = 0;
      if (compressorRef.current) compressorRef.current.threshold.value = 0;
    }
  }, [isSpatialEnabled, bassGain, trebleGain, stereoWidth, activePreset]);

  // Preset Selection
  const applyPreset = (preset: SpatialPreset) => {
    setActivePreset(preset);
    setStereoWidth(preset.panWidth);
    setBassGain(preset.bass);
    setTrebleGain(preset.treble);
  };

  // Handle local audio file upload (MP3, WAV, AAC, M4A, FLAC)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileUrl = URL.createObjectURL(file);
      setActiveTrack({
        title: file.name.replace(/\.[^/.]+$/, ''),
        url: fileUrl
      });
      setIsLiveStream(false);
      setIsPlaying(false);
      setLoadError(null);

      // Auto play imported file after short tick
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      }, 100);
    } catch (err) {
      setLoadError("Impossible d'ouvrir le fichier MP3 sélectionné.");
    }
  };

  if (!isOpen && !embedded) return null;

  const content = (
    <div className="w-full max-w-5xl bg-[#080812] border border-white/15 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-6 text-white shadow-2xl relative overflow-hidden select-none">
      {/* Background ambient glowing red & purple aura */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-red-950/50 flex-shrink-0">
            <Headphones className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>🎧 Studio Audio Spatial 3D</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-500/40">
                WEBAUDIO 60 FPS
              </span>
            </h2>
            <p className="text-xs text-white/60">Console acoustique & traitement spatial virtuel</p>
          </div>
        </div>

        {/* Quitter le lecteur Button (Header) */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleQuitPlayer}
            className="px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 font-extrabold text-xs transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95 min-h-[40px]"
            title="Quitter et fermer le lecteur audio"
          >
            <Power className="w-4 h-4" />
            <span>Quitter le lecteur</span>
          </button>

          {onClose && (
            <button
              onClick={handleQuitPlayer}
              className="p-2 rounded-xl glass hover:bg-white/10 text-white/60 hover:text-white transition min-w-[40px] min-h-[40px] flex items-center justify-center"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Studio Deck Main Grid: 2 columns on Desktop / Tablet, stacked on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10">
        
        {/* Left Column: Vinyl Turntable & Track Info */}
        <div className="lg:col-span-5 glass-strong rounded-2xl p-5 border border-white/10 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-xl bg-gradient-to-b from-[#120822] via-[#0b0614] to-[#05030a]">
          
          {/* Vinyl Disc or Station Logo */}
          <div className="relative my-2 flex items-center justify-center">
            {/* Spinning Aura Glow */}
            <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-red-600/30 via-purple-600/30 to-indigo-600/30 blur-xl transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-20'}`} />

            <div className={`relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-[#050508] border-4 border-white/15 p-2 shadow-2xl flex items-center justify-center ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '12s' }}>
              {/* Vinyl Grooves Effect */}
              <div className="absolute inset-2 rounded-full border border-white/10 pointer-events-none" />
              <div className="absolute inset-4 rounded-full border border-white/5 pointer-events-none" />
              <div className="absolute inset-7 rounded-full border border-white/10 pointer-events-none" />

              {/* Center Record Label */}
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-red-600 to-purple-700 p-1 flex items-center justify-center shadow-inner relative z-10 overflow-hidden">
                {activeTrack?.logo ? (
                  <img src={activeTrack.logo} alt="" className="w-full h-full object-contain rounded-full" />
                ) : (
                  <Disc className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                )}
              </div>
            </div>
          </div>

          {/* Track Details */}
          <div className="w-full space-y-1 my-2">
            <div className="flex items-center justify-center gap-2 text-[11px] text-white/60 font-mono">
              <span>{isLiveStream ? '● FLUX EN DIRECT' : 'PISTE MP3'}</span>
              <span>·</span>
              <span>128 KBPS</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white truncate px-2">
              {activeTrack ? activeTrack.title : 'Aucune piste sélectionnée'}
            </h3>
            <p className="text-xs text-white/50 truncate">
              {activeTrack ? (isLiveStream ? 'Radio Streaming Haute Qualité' : 'Fichier Audio Local') : 'Choisissez une station ou un fichier MP3'}
            </p>

            {loadError && (
              <p className="text-xs text-red-400 font-mono mt-2 bg-red-950/80 p-2 rounded-xl border border-red-500/30">
                {loadError}
              </p>
            )}
          </div>

          {/* Time & Progress Bar */}
          <div className="w-full mt-2 space-y-1.5">
            <div className="flex justify-between items-center text-xs font-mono text-white/70">
              <span>{isLiveStream ? 'DIRECT' : formatTime(currentTime)}</span>
              <span>{isLiveStream ? 'LIVE' : formatTime(duration)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              disabled={isLiveStream || !activeTrack}
              onChange={(e) => {
                const newTime = parseFloat(e.target.value);
                setCurrentTime(newTime);
                if (audioRef.current) audioRef.current.currentTime = newTime;
              }}
              className="w-full accent-red-500 h-2 bg-white/15 rounded-lg cursor-pointer disabled:opacity-40"
            />
          </div>
        </div>

        {/* Right Column: Master Transport Controls & WebAudio Spatial Engine */}
        <div className="lg:col-span-7 glass-strong rounded-2xl p-5 border border-white/10 space-y-5 bg-gradient-to-b from-white/[0.03] to-black/60 shadow-xl flex flex-col justify-between">
          
          {/* Main Playback & Master Volume Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-black/40 border border-white/10">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlayPause}
              disabled={!activeTrack}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2.5 min-h-[46px] cursor-pointer ${
                activeTrack
                  ? 'bg-gradient-to-r from-red-600 via-purple-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white shadow-lg shadow-red-950/50 active:scale-95'
                  : 'bg-white/10 text-white/30 cursor-not-allowed border border-white/5'
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              <span>{isPlaying ? 'Mettre en Pause' : 'Lancer l\'Écoute'}</span>
            </button>

            {/* Volume Control Slider */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                onClick={() => {
                  setIsMuted(!isMuted);
                  if (audioRef.current) audioRef.current.muted = !isMuted;
                }}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition flex-shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center"
                title={isMuted ? 'Activer le son' : 'Couper le son'}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  setIsMuted(false);
                  if (audioRef.current) {
                    audioRef.current.volume = val;
                    audioRef.current.muted = false;
                  }
                }}
                className="w-28 sm:w-36 accent-red-500 h-2 bg-white/15 rounded-lg cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-white/80 w-8 text-right">
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>
          </div>

          {/* WebAudio Spatial Controls & 3D Presets */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-red-950/30 to-black/60 border border-purple-500/30 space-y-4">
            
            {/* Spatial Switch Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-extrabold text-white">Son spatial</span>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSpatialEnabled}
                  onChange={(e) => setIsSpatialEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-red-600 peer-checked:to-purple-600 relative" />
                <span className={`text-xs font-bold font-mono ${isSpatialEnabled ? 'text-emerald-400' : 'text-white/40'}`}>
                  {isSpatialEnabled ? 'Activé' : 'Désactivé'}
                </span>
              </label>
            </div>

            {/* Presets Bar */}
            {isSpatialEnabled && (
              <div className="space-y-3 pt-2 border-t border-white/10">
                <span className="text-[10px] font-mono text-white/60 uppercase tracking-wider block">
                  Modes d'immersion acoustique 3D
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {SPATIAL_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset)}
                      className={`p-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 border cursor-pointer min-h-[44px] ${
                        activePreset.id === preset.id
                          ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-900/50'
                          : 'bg-white/[0.04] text-white/70 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-base">{preset.icon}</span>
                      <span className="text-[10px] truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>

                {/* Fine Tuning Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] text-white/60 mb-1">
                      <span>Largeur Stéréo</span>
                      <span className="font-mono text-purple-300 font-bold">{Math.round(stereoWidth * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={stereoWidth}
                      onChange={(e) => setStereoWidth(parseFloat(e.target.value))}
                      className="w-full accent-purple-500 h-1.5 bg-white/15 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-white/60 mb-1">
                      <span>Basses (Bass)</span>
                      <span className="font-mono text-red-300 font-bold">+{bassGain} dB</span>
                    </div>
                    <input
                      type="range"
                      min="-6"
                      max="12"
                      step="1"
                      value={bassGain}
                      onChange={(e) => setBassGain(parseFloat(e.target.value))}
                      className="w-full accent-red-500 h-1.5 bg-white/15 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-white/60 mb-1">
                      <span>Aigus (Treble)</span>
                      <span className="font-mono text-amber-300 font-bold">+{trebleGain} dB</span>
                    </div>
                    <input
                      type="range"
                      min="-6"
                      max="12"
                      step="1"
                      value={trebleGain}
                      onChange={(e) => setTrebleGain(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-white/15 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Import MP3 & Station Select Dropdown */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <label className="px-3.5 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 text-xs font-bold cursor-pointer transition flex items-center gap-2 border border-purple-500/40 shadow-sm active:scale-95 min-h-[40px]">
                <Upload className="w-4 h-4 text-purple-300" />
                <span>Importer MP3 / WAV</span>
                <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
              </label>

              {radioAndMusicItems.length > 0 && (
                <select
                  onChange={(e) => {
                    const selected = radioAndMusicItems.find((r) => r.id === e.target.value);
                    if (selected) {
                      playTrack(selected);
                      setActiveTrack({ title: selected.title, url: selected.url, logo: selected.logo });
                      setIsLiveStream(true);
                      setIsPlaying(false);
                      setLoadError(null);
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white/90 text-xs font-mono outline-none max-w-[220px] sm:max-w-xs truncate min-h-[40px]"
                >
                  <option value="">-- Sélectionner une station Radio --</option>
                  {radioAndMusicItems.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Quitter le lecteur Footer Button */}
            <button
              onClick={handleQuitPlayer}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-red-950/80 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/40 font-extrabold text-xs transition flex items-center justify-center gap-2 min-h-[40px] cursor-pointer shadow-md active:scale-95"
            >
              <Power className="w-4 h-4" />
              <span>Quitter le lecteur audio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mandatory Required Footnote */}
      <p className="text-[11px] text-white/50 leading-relaxed pt-2 border-t border-white/10 font-sans italic text-center sm:text-left">
        Effet spatial simulé (largeur stéréo, ambiance, égaliseur, compresseur) ; ce n’est pas du Dolby Atmos. Pour les flux distants, le serveur doit être en HTTPS avec CORS autorisé.
      </p>

      <audio
        ref={audioRef}
        src={resolvedAudioUrl}
        crossOrigin={isLocalFile ? undefined : 'anonymous'}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration || 0);
        }}
        onEnded={() => setIsPlaying(false)}
        onError={(e) => {
          console.warn('[Spatial Audio] Audio tag error:', e);
          if (activeTrack) {
            setLoadError('Erreur de lecture du fichier MP3. Si la piste est distante, vérifiez le lien HTTPS et les accès CORS.');
            setIsPlaying(false);
          }
        }}
      />
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      {content}
    </div>
  );
}

