import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import {
  Grid2X2,
  Columns,
  LayoutGrid,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RefreshCw,
  Plus,
  ArrowLeft,
  Tv,
  Check,
  X,
  Sparkles,
  Sliders
} from 'lucide-react';
import { useAppStore, type MediaItem } from '../store/useAppStore';
import { VPNBadge } from '../components/common/VPNBadge';
import { secureUrl } from '../services/secureStream';

type LayoutMode = 'dual' | 'triple' | 'quad';

interface SlotState {
  id: number;
  channel: MediaItem | null;
  muted: boolean;
  isBuffering: boolean;
  hasError: boolean;
}

export function MultiViewPage() {
  const navigate = useNavigate();
  const { sources, tvMode } = useAppStore();
  const liveChannels = useMemo(() => sources.filter((s) => s.type === 'live'), [sources]);

  const [layout, setLayout] = useState<LayoutMode>('quad');
  const [activeAudioSlot, setActiveAudioSlot] = useState<number>(0); // Slot with audio unmuted
  const [channelPickerSlot, setChannelPickerSlot] = useState<number | null>(null);

  // Initialize slots with first 4 channels
  const [slots, setSlots] = useState<SlotState[]>([
    { id: 0, channel: liveChannels[0] || null, muted: false, isBuffering: false, hasError: false },
    { id: 1, channel: liveChannels[1] || null, muted: true, isBuffering: false, hasError: false },
    { id: 2, channel: liveChannels[2] || null, muted: true, isBuffering: false, hasError: false },
    { id: 3, channel: liveChannels[3] || null, muted: true, isBuffering: false, hasError: false }
  ]);

  // Keep slots synced if liveChannels change on initial load
  useEffect(() => {
    if (liveChannels.length > 0 && !slots[0].channel) {
      setSlots([
        { id: 0, channel: liveChannels[0] || null, muted: false, isBuffering: false, hasError: false },
        { id: 1, channel: liveChannels[1] || null, muted: true, isBuffering: false, hasError: false },
        { id: 2, channel: liveChannels[2] || null, muted: true, isBuffering: false, hasError: false },
        { id: 3, channel: liveChannels[3] || null, muted: true, isBuffering: false, hasError: false }
      ]);
    }
  }, [liveChannels]);

  // Active slots according to layout
  const visibleSlotCount = layout === 'dual' ? 2 : layout === 'triple' ? 3 : 4;
  const activeSlots = slots.slice(0, visibleSlotCount);

  // Set solo audio for a slot
  const handleSoloAudio = (slotId: number) => {
    setActiveAudioSlot(slotId);
  };

  const handleSelectChannelForSlot = (channel: MediaItem) => {
    if (channelPickerSlot === null) return;
    setSlots((prev) =>
      prev.map((slot) => (slot.id === channelPickerSlot ? { ...slot, channel, hasError: false } : slot))
    );
    setChannelPickerSlot(null);
  };

  const handleSwapChannels = (slotIdx1: number, slotIdx2: number) => {
    setSlots((prev) => {
      const copy = [...prev];
      const temp = copy[slotIdx1].channel;
      copy[slotIdx1].channel = copy[slotIdx2].channel;
      copy[slotIdx2].channel = temp;
      return copy;
    });
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#000000] text-white select-none overflow-hidden">
      {/* Top Multi-View Command Bar */}
      <div className="h-16 px-4 glass-strong border-b border-white/[0.08] flex items-center justify-between gap-4 z-20 flex-shrink-0">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/tv')}
            className="p-2 rounded-xl glass hover:bg-white/10 text-white/70 hover:text-white transition"
            title="Retour au lecteur simple"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E50914] flex items-center justify-center shadow-lg accent-glow flex-shrink-0">
              <Grid2X2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm md:text-base tracking-tight text-white">
                  MODE MOSAÏQUE (MULTI-VIEW)
                </span>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/40">
                  {visibleSlotCount} FLUX ACTIFS
                </span>
              </div>
              <span className="text-[10px] text-[#A1A1A6] hidden sm:block">
                Regardez jusqu'à 4 chaînes simultanément • 1 clic pour isoler le son d'un flux
              </span>
            </div>
          </div>
        </div>

        {/* Center: Layout Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/60 border border-white/10 shadow-inner">
          <button
            onClick={() => setLayout('dual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              layout === 'dual'
                ? 'bg-[#E50914] text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            title="2 Flux (Split)"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden md:inline">2 Écrans</span>
          </button>

          <button
            onClick={() => setLayout('triple')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              layout === 'triple'
                ? 'bg-[#E50914] text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            title="3 Flux (1 Principal + 2 Secondaires)"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">3 Écrans</span>
          </button>

          <button
            onClick={() => setLayout('quad')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              layout === 'quad'
                ? 'bg-[#E50914] text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            title="4 Flux (Mosaïque 2x2)"
          >
            <Grid2X2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">4 Écrans (2x2)</span>
          </button>
        </div>

        {/* Right Actions & VPN */}
        <div className="flex items-center gap-2">
          <VPNBadge compact />
        </div>
      </div>

      {/* Main Multi-Screen Grid Viewport */}
      <div className="flex-1 w-full h-full p-2 gap-2 bg-[#000000] overflow-hidden">
        {/* Dynamic Grid Layout */}
        <div
          className={`w-full h-full grid gap-2 ${
            layout === 'dual'
              ? 'grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1'
              : layout === 'triple'
              ? 'grid-cols-1 md:grid-cols-3 grid-rows-3 md:grid-rows-2'
              : 'grid-cols-1 sm:grid-cols-2 grid-rows-2 sm:grid-rows-2'
          }`}
        >
          {activeSlots.map((slot, index) => {
            const isAudioActive = activeAudioSlot === slot.id;
            // For triple layout: slot 0 takes 2 columns
            const spanClass =
              layout === 'triple' && index === 0 ? 'md:col-span-2 md:row-span-2' : '';

            return (
              <MultiViewSlot
                key={slot.id}
                slot={slot}
                index={index}
                spanClass={spanClass}
                isAudioActive={isAudioActive}
                onSoloAudio={() => handleSoloAudio(slot.id)}
                onChangeChannel={() => setChannelPickerSlot(slot.id)}
                onFullscreenSlot={() => {
                  if (slot.channel) navigate(`/tv/${slot.channel.id}`);
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Channel Picker Modal */}
      {channelPickerSlot !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl glass-strong border border-white/10 p-6 shadow-2xl relative space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#E50914] flex items-center justify-center">
                  <Tv className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Sélectionner la chaîne pour l'écran #{channelPickerSlot + 1}
                </h3>
              </div>
              <button
                onClick={() => setChannelPickerSlot(null)}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {liveChannels.map((chan, idx) => (
                <button
                  key={chan.id}
                  onClick={() => handleSelectChannelForSlot(chan)}
                  className="w-full p-3 rounded-2xl glass hover:bg-white/[0.08] flex items-center justify-between transition-all group text-left border border-white/5 hover:border-[#E50914]/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-white/40 w-5">{idx + 1}.</span>
                    <div className="w-10 h-10 rounded-xl bg-white/5 p-1 flex items-center justify-center flex-shrink-0">
                      {chan.logo ? (
                        <img src={chan.logo} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <Tv className="w-4 h-4 text-white/60" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-white block truncate group-hover:text-[#E50914] transition-colors">
                        {chan.title}
                      </span>
                      <span className="text-[10px] text-white/40 block truncate">
                        {chan.group || 'Chaîne live'}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-white/60 group-hover:bg-[#E50914] group-hover:text-white transition-all font-semibold">
                    Choisir
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Individual Slot Player component with Hls.js
function MultiViewSlot({
  slot,
  index,
  spanClass,
  isAudioActive,
  onSoloAudio,
  onChangeChannel,
  onFullscreenSlot
}: {
  slot: SlotState;
  index: number;
  spanClass: string;
  isAudioActive: boolean;
  onSoloAudio: () => void;
  onChangeChannel: () => void;
  onFullscreenSlot: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

  const channel = slot.channel;
  const effectiveSrc = channel ? secureUrl(channel.url) : '';

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !channel) return;

    setHasError(false);
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported() && (effectiveSrc.includes('.m3u8') || !effectiveSrc.includes('.mp4'))) {
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: true,
        xhrSetup: (xhr, url) => {
          if ((url.startsWith('http://') || url.startsWith('https://')) && !url.includes('/proxy') && !url.includes('/api/proxy')) {
            xhr.open('GET', secureUrl(url), true);
          }
        }
      });
      hlsRef.current = hls;
      hls.loadSource(effectiveSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setHasError(true);
        }
      });
    } else {
      video.src = effectiveSrc;
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel, effectiveSrc]);

  // Sync mute with isAudioActive
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isAudioActive;
    }
  }, [isAudioActive]);

  return (
    <div
      className={`relative w-full h-full rounded-2xl overflow-hidden glass-strong border ${
        isAudioActive ? 'border-[#E50914] shadow-[0_0_20px_rgba(229,9,20,0.3)]' : 'border-white/10'
      } flex flex-col justify-between group select-none ${spanClass}`}
    >
      {/* Video viewport */}
      <div className="absolute inset-0 bg-black flex items-center justify-center">
        {channel ? (
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            playsInline
            autoPlay
            muted={!isAudioActive}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <Tv className="w-10 h-10 text-white/30 mb-2" />
            <span className="text-xs text-white/60 font-medium">Emplacement libre</span>
            <button
              onClick={onChangeChannel}
              className="mt-3 px-3 py-1.5 rounded-xl bg-[#E50914] text-white text-xs font-bold"
            >
              Ajouter une chaîne
            </button>
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4 text-center">
            <span className="text-xs text-red-400 font-bold mb-2">Flux inaccessible</span>
            <button
              onClick={onChangeChannel}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white"
            >
              Changer de chaîne
            </button>
          </div>
        )}
      </div>

      {/* Top Overlay Badge & Quick Slot Indicator */}
      <div className="relative z-10 p-2.5 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/30 to-transparent">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <span className="px-2 py-0.5 rounded-md bg-black/70 text-white font-mono text-[10px] font-bold border border-white/10 flex-shrink-0">
            #{index + 1}
          </span>
          {channel && (
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              {channel.logo && (
                <img src={channel.logo} alt="" className="w-4 h-4 object-contain rounded flex-shrink-0" />
              )}
              <span className="text-xs font-black text-white truncate drop-shadow">{channel.title}</span>
            </div>
          )}
        </div>

        {/* Solo Audio Badge Indicator */}
        <button
          onClick={onSoloAudio}
          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition ${
            isAudioActive
              ? 'bg-[#E50914] text-white shadow-lg shadow-red-950/60 scale-105'
              : 'bg-black/60 text-white/60 hover:text-white border border-white/10'
          }`}
          title={isAudioActive ? 'Son Actif sur ce flux' : 'Activer le son de ce flux (Solo)'}
        >
          {isAudioActive ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-white" />
              <span>AUDIO ON</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-white/50" />
              <span>SOLO AUDIO</span>
            </>
          )}
        </button>
      </div>

      {/* Bottom Floating Control Bar on Hover */}
      <div className="relative z-10 p-2.5 flex items-center justify-between bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onChangeChannel}
          className="px-2.5 py-1 rounded-lg glass hover:bg-white/10 text-white text-[11px] font-semibold flex items-center gap-1.5 transition"
        >
          <Sliders className="w-3 h-3 text-[#E50914]" />
          <span>Changer</span>
        </button>

        <button
          onClick={onFullscreenSlot}
          className="p-1.5 rounded-lg glass hover:bg-white/10 text-white text-[11px] transition"
          title="Ouvrir cette chaîne en plein écran"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default MultiViewPage;
