import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Radio,
  Sliders,
  Sparkles,
  X,
  SkipBack,
  SkipForward,
  Waves,
  Disc3,
  Activity
} from 'lucide-react';
import { useAudioStore } from '../../store/useAudioStore';
import { useAppStore, type MediaItem } from '../../store/useAppStore';

type VisualizerStyle = 'waves' | 'pulsar' | 'vfd';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function RadioVisualizerModal({ isOpen, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentTrack, isPlaying, togglePlay, volume, setVolume, isMuted, toggleMute, playTrack } = useAudioStore();
  const { sources } = useAppStore();
  const radioStations = sources.filter((s) => s.type === 'radio');

  const [style, setStyle] = useState<VisualizerStyle>('waves');
  const [sensitivity, setSensitivity] = useState(1.2);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Station navigation
  const currentIndex = radioStations.findIndex((s) => s.id === currentTrack?.id);
  const handlePrevStation = () => {
    if (radioStations.length === 0) return;
    const prevIdx = (currentIndex - 1 + radioStations.length) % radioStations.length;
    playTrack(radioStations[prevIdx]);
  };

  const handleNextStation = () => {
    if (radioStations.length === 0) return;
    const nextIdx = (currentIndex + 1) % radioStations.length;
    playTrack(radioStations[nextIdx]);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Canvas visualizer animation loop
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;
    const barCount = 48;
    const barHeights = new Array(barCount).fill(10);
    const peakHeights = new Array(barCount).fill(10);

    const render = () => {
      // Resize dynamically to crisp display ratio
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      // Amplitude factor based on playing state & volume
      const amp = isPlaying ? (isMuted ? 0.05 : volume * sensitivity) : 0.04;
      phase += isPlaying ? 0.04 : 0.008;

      if (style === 'waves') {
        // --- 1. ONDES CINÉMA ---
        const waveCount = 4;
        for (let w = 0; w < waveCount; w++) {
          ctx.beginPath();
          const freq = 0.008 + w * 0.004;
          const offset = phase * (1 + w * 0.4);
          const waveHeight = (height * 0.22 * amp) / (w + 1);
          const centerY = height * 0.5;

          ctx.moveTo(0, centerY);
          for (let x = 0; x <= width; x += 4) {
            const y =
              centerY +
              Math.sin(x * freq + offset) * waveHeight * Math.sin((x / width) * Math.PI) +
              Math.cos(x * freq * 1.5 - offset) * (waveHeight * 0.4);
            ctx.lineTo(x, y);
          }

          if (w === 0) {
            ctx.strokeStyle = '#E50914';
            ctx.lineWidth = 4;
            ctx.shadowColor = 'rgba(229, 9, 20, 0.8)';
            ctx.shadowBlur = 24;
          } else if (w === 1) {
            ctx.strokeStyle = '#FF3B30';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = 'rgba(255, 59, 48, 0.5)';
            ctx.shadowBlur = 14;
          } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 0;
          }
          ctx.stroke();
        }

        // Horizontal baseline
        ctx.beginPath();
        ctx.moveTo(0, height * 0.5);
        ctx.lineTo(width, height * 0.5);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();

      } else if (style === 'pulsar') {
        // --- 2. PULSAR COSMIQUE ---
        const centerX = width * 0.5;
        const centerY = height * 0.5;
        const baseRadius = Math.min(width, height) * 0.22;
        const ringSegments = 64;

        // Radiating pulse aura
        ctx.save();
        ctx.translate(centerX, centerY);

        const pulseScale = 1 + Math.sin(phase * 3) * 0.06 * amp;
        ctx.scale(pulseScale, pulseScale);

        ctx.beginPath();
        for (let i = 0; i <= ringSegments; i++) {
          const angle = (i / ringSegments) * Math.PI * 2;
          const noise =
            Math.sin(angle * 7 + phase * 2) * 15 * amp +
            Math.cos(angle * 12 - phase * 3) * 10 * amp;
          const r = baseRadius + noise;
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = '#E50914';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = 'rgba(229, 9, 20, 0.9)';
        ctx.shadowBlur = 30;
        ctx.stroke();

        // Orbiting star particles
        const particleCount = 28;
        for (let p = 0; p < particleCount; p++) {
          const pAngle = (p / particleCount) * Math.PI * 2 + phase * 0.5;
          const pDist = baseRadius * 1.35 + Math.sin(phase * 4 + p) * 35 * amp;
          const pX = Math.cos(pAngle) * pDist;
          const pY = Math.sin(pAngle) * pDist;
          const pSize = 1.5 + Math.sin(phase * 2 + p) * 2;

          ctx.beginPath();
          ctx.arc(pX, pY, Math.max(1, pSize), 0, Math.PI * 2);
          ctx.fillStyle = p % 2 === 0 ? '#E50914' : '#FFFFFF';
          ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
          ctx.shadowBlur = 10;
          ctx.fill();
        }
        ctx.restore();

      } else if (style === 'vfd') {
        // --- 3. STUDIO VFD ÉGALISEUR ---
        const barWidth = Math.max(6, (width * 0.85) / barCount - 3);
        const startX = (width - barCount * (barWidth + 3)) / 2;
        const maxHeight = height * 0.55;

        for (let i = 0; i < barCount; i++) {
          // Dynamic target height based on simulated frequency bands
          const target = isPlaying
            ? (Math.sin(phase * 4 + i * 0.3) * 0.5 + 0.5) * maxHeight * amp * (1 - Math.abs(i - barCount / 2) / (barCount * 0.9)) + 12
            : 8;

          barHeights[i] += (target - barHeights[i]) * 0.22;
          if (barHeights[i] > peakHeights[i]) {
            peakHeights[i] = barHeights[i];
          } else {
            peakHeights[i] -= 1.2; // Slowly decay peak
          }

          const currentH = Math.max(4, barHeights[i]);
          const bx = startX + i * (barWidth + 3);
          const by = height * 0.7 - currentH;

          // LED Bar Gradient (Studio Red / White)
          const grad = ctx.createLinearGradient(0, height * 0.7, 0, by);
          grad.addColorStop(0, '#E50914');
          grad.addColorStop(0.7, '#FF453A');
          grad.addColorStop(1, '#FFFFFF');

          ctx.fillStyle = grad;
          ctx.shadowColor = 'rgba(229, 9, 20, 0.4)';
          ctx.shadowBlur = 8;
          ctx.fillRect(bx, by, barWidth, currentH);

          // Peak meter dot
          const peakY = height * 0.7 - peakHeights[i] - 4;
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = '#FFFFFF';
          ctx.shadowBlur = 6;
          ctx.fillRect(bx, Math.max(height * 0.15, peakY), barWidth, 2);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, style, isPlaying, volume, sensitivity, isMuted]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-2xl animate-fade-in"
    >
      <div className="w-full max-w-4xl h-[94vh] sm:h-[90vh] md:h-[82vh] rounded-2xl sm:rounded-3xl glass-strong border border-white/[0.08] flex flex-col justify-between overflow-hidden shadow-2xl relative">
        {/* Top Header Bar */}
        <div className="min-h-14 sm:h-16 px-3 sm:px-4 md:px-6 py-2 flex items-center justify-between border-b border-white/[0.08] bg-black/40 z-20 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#E50914] flex items-center justify-center shadow-lg accent-glow shrink-0">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-black text-xs sm:text-sm md:text-base text-white tracking-tight truncate">
                  VISUALISEUR ONDES
                </span>
                <span className="text-[8px] sm:text-[9px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/40 shrink-0">
                  {isPlaying ? '60 FPS' : 'PAUSE'}
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-[#A1A1A6] truncate block hidden xs:block">
                Ondes audio interactives en temps réel • Haute fidélité
              </span>
            </div>
          </div>

          {/* Style Switcher Pills & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 rounded-xl bg-black/60 border border-white/10">
              <button
                onClick={() => setStyle('waves')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold flex items-center gap-1 transition ${
                  style === 'waves'
                    ? 'bg-[#E50914] text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
                title="Ondes Cinéma"
              >
                <Waves className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Ondes</span>
              </button>

              <button
                onClick={() => setStyle('pulsar')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold flex items-center gap-1 transition ${
                  style === 'pulsar'
                    ? 'bg-[#E50914] text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
                title="Pulsar Cosmique"
              >
                <Disc3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Pulsar</span>
              </button>

              <button
                onClick={() => setStyle('vfd')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold flex items-center gap-1 transition ${
                  style === 'vfd'
                    ? 'bg-[#E50914] text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
                title="Studio VFD"
              >
                <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Studio</span>
              </button>
            </div>

            {/* Top Actions */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 sm:p-2 rounded-xl glass hover:bg-white/10 text-white/70 hover:text-white transition shrink-0 hidden xs:flex items-center justify-center min-w-[34px] min-h-[34px]"
              title="Plein écran"
            >
              <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl glass hover:bg-white/10 text-white/70 hover:text-white transition shrink-0 flex items-center justify-center min-w-[34px] min-h-[34px]"
              title="Fermer"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Central Visualizer Canvas & Station Info */}
        <div className="flex-1 w-full relative flex items-center justify-center overflow-hidden p-4">
          {/* Dynamic HTML5 Canvas */}
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

          {/* Central Overlay Album / Station Artwork */}
          <div className="relative z-10 flex flex-col items-center text-center p-3 sm:p-4 max-w-md pointer-events-none">
            <div className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-2xl sm:rounded-3xl glass p-2 sm:p-3 border border-white/20 shadow-2xl flex items-center justify-center mb-2.5 sm:mb-4 bg-black/50 accent-glow backdrop-blur-xl">
              {currentTrack?.logo ? (
                <img
                  src={currentTrack.logo}
                  alt={currentTrack.title}
                  className="w-full h-full object-contain rounded-xl sm:rounded-2xl"
                />
              ) : (
                <Radio className="w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 text-[#E50914]" />
              )}
            </div>

            <h3 className="text-base sm:text-xl md:text-2xl font-black text-white drop-shadow-lg tracking-tight truncate max-w-xs sm:max-w-md">
              {currentTrack?.title || 'Aucune radio sélectionnée'}
            </h3>
            <p className="text-[11px] sm:text-xs md:text-sm text-[#A1A1A6] mt-0.5 sm:mt-1 max-w-xs sm:max-w-sm drop-shadow truncate">
              {currentTrack?.description || 'Diffusion live en continu'}
            </p>

            <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3 font-mono text-[9px] sm:text-[10px]">
              <span className="px-2 py-0.5 rounded-full bg-black/60 border border-white/10 text-white/60">
                128 KBPS • STEREO HD
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
                ● FLUX DIRECT
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Playback & Tuning Bar */}
        <div className="p-3 sm:p-4 md:p-6 border-t border-white/[0.08] bg-black/60 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 z-20">
          {/* Sensitivity slider */}
          <div className="flex items-center gap-2 text-xs text-white/60 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#E50914] shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-mono">Sensibilité :</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={sensitivity}
              onChange={(e) => setSensitivity(parseFloat(e.target.value))}
              className="w-24 sm:w-28 accent-[#E50914] h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          {/* Central Controls: Prev / Play-Pause / Next */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={handlePrevStation}
              className="p-2 sm:p-2.5 rounded-xl glass hover:bg-white/10 text-white transition active:scale-95 min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer"
              title="Station précédente"
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={togglePlay}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#E50914] hover:bg-[#F40612] text-white flex items-center justify-center shadow-xl shadow-red-950/50 transition-all transform active:scale-95 accent-glow cursor-pointer"
              title={isPlaying ? 'Pause' : 'Lecture'}
            >
              {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5 fill-current" />}
            </button>

            <button
              onClick={handleNextStation}
              className="p-2 sm:p-2.5 rounded-xl glass hover:bg-white/10 text-white transition active:scale-95 min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer"
              title="Station suivante"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition shrink-0"
              title={isMuted ? 'Activer le son' : 'Couper le son'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full sm:w-24 accent-[#E50914] h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
