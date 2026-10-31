import React, { useMemo } from 'react';
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
  X,
  Disc,
  Activity,
  Zap,
  RotateCcw,
  Check,
  Power,
  ShieldCheck
} from 'lucide-react';
import { useAppStore, type MediaItem } from '../../store/useAppStore';
import { useAudioStore, SPATIAL_PRESETS, type SpatialPreset } from '../../store/useAudioStore';

// Helper to format time in mm:ss
function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

interface SpatialAudioPlayerProps {
  isOpen?: boolean;
  onClose?: () => void;
  embedded?: boolean;
}

export function SpatialAudioPlayer({ isOpen = true, onClose, embedded = false }: SpatialAudioPlayerProps) {
  const { sources } = useAppStore();
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    togglePlay,
    playTrack,
    close: closeGlobalAudio,
    setVolume,
    toggleMute,
    seek,
    isSpatialEnabled,
    activePresetId,
    stereoWidth,
    bassGain,
    trebleGain,
    setSpatialEnabled,
    applyPreset,
    setStereoWidth,
    setBassGain,
    setTrebleGain
  } = useAudioStore();

  const radioAndMusicItems = useMemo(
    () => sources.filter((s) => s.type === 'radio' || s.type === 'live'),
    [sources]
  );

  const activePreset = useMemo(
    () => SPATIAL_PRESETS.find((p) => p.id === activePresetId) || SPATIAL_PRESETS[0],
    [activePresetId]
  );

  const isLiveStream = useMemo(() => {
    return currentTrack ? currentTrack.type === 'radio' || currentTrack.type === 'live' : true;
  }, [currentTrack]);

  // Handle local audio file upload (MP3, WAV, AAC, M4A, FLAC)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileUrl = URL.createObjectURL(file);
      playTrack({
        id: 'local-file-' + Date.now(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        url: fileUrl,
        type: 'radio'
      });
    } catch (err) {
      console.warn('[Spatial Audio] Impossible d\'ouvrir le fichier MP3 sélectionné:', err);
    }
  };

  // Quit / Close player completely
  const handleQuitPlayer = () => {
    closeGlobalAudio();
    if (onClose) onClose();
  };

  if (!isOpen && !embedded) return null;

  const content = (
    <div className="w-full max-w-5xl bg-[#080812] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl p-3.5 xs:p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 text-white shadow-2xl relative overflow-hidden select-none max-h-[92vh] sm:max-h-[90vh] flex flex-col">
      {/* Mobile Sheet Drag Indicator Bar */}
      <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto -mt-1 mb-1 sm:hidden flex-shrink-0 cursor-grab active:bg-white/40 transition-colors" />

      {/* Background ambient glowing red & purple aura */}
      <div className="absolute top-0 right-0 w-80 h-80 sm:w-96 sm:h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 sm:w-96 sm:h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Scrollable interior for small mobile viewports */}
      <div className="overflow-y-auto overscroll-contain pr-0.5 sm:pr-1 space-y-4 sm:space-y-6 flex-1 custom-scrollbar">
        {/* Header Bar */}
        <div className="flex flex-row items-center justify-between gap-2.5 border-b border-white/10 pb-3 sm:pb-4 relative z-10">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-red-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-red-950/50 shrink-0">
              <Headphones className={`w-4 h-4 sm:w-6 sm:h-6 text-white ${isPlaying ? 'animate-pulse' : ''}`} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm xs:text-base sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="truncate">🎧 Studio Audio 3D</span>
                <span className="text-[9px] sm:text-[10px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-500/40 shrink-0">
                  WEBAUDIO 60 FPS
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-white/60 truncate hidden xs:block">
                Console acoustique & immersion spatiale en temps réel
              </p>
            </div>
          </div>

          {/* Action buttons (Header: Quitter & Close) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handleQuitPlayer}
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 min-h-[38px] sm:min-h-[40px]"
              title="Quitter et fermer le lecteur audio"
            >
              <Power className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden xs:inline">Quitter</span>
            </button>

            {onClose && (
              <button
                onClick={handleQuitPlayer}
                className="p-2 rounded-xl glass hover:bg-white/10 text-white/70 hover:text-white transition min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center cursor-pointer active:scale-95"
                title="Fermer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Studio Deck Main Grid: 2 columns on Desktop / Tablet, stacked on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 relative z-10">
          {/* Left Column: Vinyl Turntable & Track Info */}
          <div className="lg:col-span-5 glass-strong rounded-2xl p-3.5 sm:p-5 border border-white/10 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-xl bg-gradient-to-b from-[#120822] via-[#0b0614] to-[#05030a]">
            {/* Vinyl Disc or Station Logo */}
            <div className="relative my-1.5 sm:my-2 flex items-center justify-center">
              {/* Spinning Aura Glow */}
              <div
                className={`absolute inset-0 rounded-full bg-gradient-to-tr from-red-600/30 via-purple-600/30 to-indigo-600/30 blur-xl transition-opacity ${
                  isPlaying ? 'opacity-100' : 'opacity-20'
                }`}
              />

              <div
                className={`relative w-24 h-24 xs:w-28 xs:h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full bg-[#050508] border-3 sm:border-4 border-white/15 p-1.5 sm:p-2 shadow-2xl flex items-center justify-center ${
                  isPlaying ? 'animate-spin' : ''
                }`}
                style={{ animationDuration: '12s' }}
              >
                {/* Vinyl Grooves Effect */}
                <div className="absolute inset-1.5 sm:inset-2 rounded-full border border-white/10 pointer-events-none" />
                <div className="absolute inset-3.5 sm:inset-4 rounded-full border border-white/5 pointer-events-none" />
                <div className="absolute inset-6 sm:inset-7 rounded-full border border-white/10 pointer-events-none" />

                {/* Center Record Label */}
                <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-red-600 to-purple-700 p-1 flex items-center justify-center shadow-inner relative z-10 overflow-hidden">
                  {currentTrack?.logo ? (
                    <img src={currentTrack.logo} alt="" className="w-full h-full object-contain rounded-full" />
                  ) : (
                    <Disc className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                  )}
                </div>
              </div>
            </div>

            {/* Track Details */}
            <div className="w-full space-y-1 my-1.5 sm:my-2">
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-white/60 font-mono flex-wrap">
                <span className={isPlaying ? 'text-emerald-400 font-bold' : ''}>
                  {isPlaying ? '● EN LECTURE' : 'EN PAUSE'}
                </span>
                <span>·</span>
                <span>{isLiveStream ? 'FLUX DIRECT' : 'PISTE LOCALE'}</span>
                <span>·</span>
                <span>HD 128 KBPS</span>
              </div>
              <h3 className="text-sm xs:text-base sm:text-lg font-black text-white truncate px-2">
                {currentTrack ? currentTrack.title : 'Aucune station sélectionnée'}
              </h3>
              <p className="text-[11px] sm:text-xs text-white/50 truncate max-w-xs mx-auto">
                {currentTrack
                  ? currentTrack.description || 'Radio en diffusion continue'
                  : 'Sélectionnez une station dans la liste ci-dessous'}
              </p>

              {/* Status Badges */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 text-[9px] sm:text-[10px] font-mono border border-emerald-500/40">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Web Audio Actif</span>
                </span>
                {isSpatialEnabled ? (
                  <span className="px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 text-[9px] sm:text-[10px] font-mono border border-purple-500/40">
                    {activePreset.name} (Basses +{bassGain}dB)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[9px] sm:text-[10px] font-mono border border-white/15">
                    Effets 3D Coupés (Direct)
                  </span>
                )}
              </div>
            </div>

            {/* Time & Progress Bar */}
            <div className="w-full mt-1.5 sm:mt-2 space-y-1">
              <div className="flex justify-between items-center text-[10px] sm:text-xs font-mono text-white/70">
                <span>{isLiveStream ? 'DIRECT' : formatTime(currentTime)}</span>
                <span>{isLiveStream ? 'LIVE' : formatTime(duration)}</span>
              </div>
              <div className="py-1">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  disabled={isLiveStream || !currentTrack}
                  onChange={(e) => seek(parseFloat(e.target.value))}
                  className="w-full accent-red-500 h-2 bg-white/15 rounded-lg cursor-pointer disabled:opacity-40"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Master Transport Controls & WebAudio Spatial Engine */}
          <div className="lg:col-span-7 glass-strong rounded-2xl p-3.5 sm:p-5 border border-white/10 space-y-3.5 sm:space-y-5 bg-gradient-to-b from-white/[0.03] to-black/60 shadow-xl flex flex-col justify-between">
            {/* Main Playback & Master Volume Bar */}
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-2xl bg-black/40 border border-white/10">
              {/* Play/Pause Button */}
              <button
                onClick={() => {
                  if (currentTrack) {
                    togglePlay();
                  } else if (radioAndMusicItems.length > 0) {
                    playTrack(radioAndMusicItems[0]);
                  }
                }}
                className="w-full xs:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 min-h-[44px] sm:min-h-[46px] cursor-pointer bg-gradient-to-r from-red-600 via-purple-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white shadow-lg shadow-red-950/50 active:scale-95 shrink-0"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                ) : (
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
                )}
                <span>{isPlaying ? 'Mettre en Pause' : 'Lancer l\'Écoute'}</span>
              </button>

              {/* Volume Control Slider (Real-time Web Audio Gain) */}
              <div className="flex items-center gap-2 sm:gap-3 w-full xs:w-auto justify-between xs:justify-end flex-1 max-w-full xs:max-w-[260px] sm:max-w-none">
                <button
                  onClick={toggleMute}
                  className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition shrink-0 min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center cursor-pointer active:scale-95"
                  title={isMuted ? 'Activer le son' : 'Couper le son'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                <div className="flex items-center flex-1 py-1">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full xs:w-24 sm:w-32 md:w-36 accent-red-500 h-2 bg-white/15 rounded-lg cursor-pointer"
                    title="Réglage du volume sonore"
                  />
                </div>

                <span className="text-xs font-mono font-bold text-white/80 w-9 sm:w-10 text-right shrink-0">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>
            </div>

            {/* WebAudio Spatial Controls & 3D Presets */}
            <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-red-950/30 to-black/60 border border-purple-500/30 space-y-3 sm:space-y-4">
              {/* Spatial Switch Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-extrabold text-white truncate">Son spatial 3D Virtuel</span>
                </div>

                <label className="flex items-center gap-2 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isSpatialEnabled}
                    onChange={(e) => setSpatialEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 sm:w-11 h-5 sm:h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-red-600 peer-checked:to-purple-600 relative" />
                  <span
                    className={`text-[10px] sm:text-xs font-bold font-mono hidden xs:inline ${
                      isSpatialEnabled ? 'text-emerald-400' : 'text-white/40'
                    }`}
                  >
                    {isSpatialEnabled ? 'Activé' : 'Désactivé'}
                  </span>
                </label>
              </div>

              {/* Presets Bar */}
              {isSpatialEnabled && (
                <div className="space-y-2.5 sm:space-y-3 pt-2 border-t border-white/10 animate-fade-in">
                  <span className="text-[9px] sm:text-[10px] font-mono text-white/60 uppercase tracking-wider block">
                    Modes d'immersion acoustique 3D (Égaliseur instantané)
                  </span>
                  {/* Responsive grid for 5 presets: 2 cols on mobile with 5th spanning, 3 cols on xs, 5 cols on desktop */}
                  <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2 [&>*:nth-child(5)]:col-span-2 xs:[&>*:nth-child(5)]:col-span-1">
                    {SPATIAL_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => applyPreset(preset)}
                        className={`p-1.5 sm:p-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 sm:gap-1 border cursor-pointer min-h-[44px] active:scale-95 touch-manipulation ${
                          activePresetId === preset.id
                            ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-900/50 scale-[1.02]'
                            : 'bg-white/[0.04] text-white/70 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-sm sm:text-base">{preset.icon}</span>
                        <span className="text-[9px] sm:text-[10px] truncate max-w-full">{preset.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Fine Tuning Sliders: Largeur Stéréo, Basses, Aigus */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 pt-1 text-xs">
                    {/* Stereo Width */}
                    <div className="bg-black/30 p-2 sm:p-2.5 rounded-xl border border-white/5 space-y-1">
                      <div className="flex justify-between text-[10px] sm:text-[11px] text-white/70">
                        <span>Largeur Stéréo</span>
                        <span className="font-mono text-purple-300 font-bold">{Math.round(stereoWidth * 100)}%</span>
                      </div>
                      <div className="py-1">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={stereoWidth}
                          onChange={(e) => setStereoWidth(parseFloat(e.target.value))}
                          className="w-full accent-purple-500 h-2 bg-white/15 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Bass Boost */}
                    <div className="bg-black/30 p-2 sm:p-2.5 rounded-xl border border-white/5 space-y-1">
                      <div className="flex justify-between text-[10px] sm:text-[11px] text-white/70">
                        <span>Basses (100 Hz)</span>
                        <span className="font-mono text-red-300 font-bold">
                          {bassGain > 0 ? `+${bassGain}` : bassGain} dB
                        </span>
                      </div>
                      <div className="py-1">
                        <input
                          type="range"
                          min="-12"
                          max="12"
                          step="1"
                          value={bassGain}
                          onChange={(e) => setBassGain(parseFloat(e.target.value))}
                          className="w-full accent-red-500 h-2 bg-white/15 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Treble Boost */}
                    <div className="bg-black/30 p-2 sm:p-2.5 rounded-xl border border-white/5 space-y-1">
                      <div className="flex justify-between text-[10px] sm:text-[11px] text-white/70">
                        <span>Aigus (8 kHz)</span>
                        <span className="font-mono text-amber-300 font-bold">
                          {trebleGain > 0 ? `+${trebleGain}` : trebleGain} dB
                        </span>
                      </div>
                      <div className="py-1">
                        <input
                          type="range"
                          min="-12"
                          max="12"
                          step="1"
                          value={trebleGain}
                          onChange={(e) => setTrebleGain(parseFloat(e.target.value))}
                          className="w-full accent-amber-500 h-2 bg-white/15 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Import MP3 & Station Select Dropdown & Quitter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-2.5 pt-2 border-t border-white/10">
              <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full sm:w-auto flex-1">
                <label className="px-3.5 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 text-xs font-bold cursor-pointer transition flex items-center justify-center gap-2 border border-purple-500/40 shadow-sm active:scale-95 min-h-[40px] shrink-0">
                  <Upload className="w-4 h-4 text-purple-300 shrink-0" />
                  <span>Importer MP3 / WAV</span>
                  <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
                </label>

                {radioAndMusicItems.length > 0 && (
                  <select
                    value={currentTrack?.id || ''}
                    onChange={(e) => {
                      const selected = radioAndMusicItems.find((r) => r.id === e.target.value);
                      if (selected) {
                        playTrack(selected);
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white/90 text-xs font-mono outline-none w-full xs:flex-1 sm:max-w-xs truncate min-h-[40px] cursor-pointer"
                  >
                    <option value="">-- Changer de station radio --</option>
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
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-red-950/80 hover:bg-red-600 text-red-200 hover:text-white border border-red-500/40 font-extrabold text-xs transition flex items-center justify-center gap-2 min-h-[40px] cursor-pointer shadow-md active:scale-95 shrink-0"
              >
                <Power className="w-4 h-4 shrink-0" />
                <span>Quitter le lecteur</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footnote */}
        <p className="text-[10px] sm:text-[11px] text-white/50 leading-relaxed pt-2 border-t border-white/10 font-sans italic text-center sm:text-left">
          Traitement spatial Web Audio en temps réel : égaliseur 3 bandes, compresseur de dynamique, élargissement panoramique stéréo et contrôle de gain direct.
        </p>
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 overflow-y-auto animate-fade-in">
      {/* Click outside to close backdrop on desktop */}
      <div className="hidden sm:block absolute inset-0 -z-10" onClick={onClose} />
      {content}
    </div>
  );
}
export default SpatialAudioPlayer;
