import React, { useState, useMemo, useEffect } from 'react';
import {
  Radio,
  Search,
  Plus,
  Play,
  Pause,
  Volume2,
  Sparkles,
  Music2,
  Globe,
  ExternalLink,
  X,
  Activity,
  Waves
} from 'lucide-react';
import { useAppStore, type MediaItem } from '../store/useAppStore';
import { useAudioStore } from '../store/useAudioStore';
import { AddSourceModal } from '../components/common/AddSourceModal';
import { VPNBadge } from '../components/common/VPNBadge';
import { RadioVisualizerModal } from '../components/radio/RadioVisualizerModal';
import { SUPPORTED_STREAMING_PORTALS } from '../services/UrlResolver';

export function RadioPage() {
  const { sources, favorites, toggleFavorite, tvMode } = useAppStore();
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioStore();

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const [activePortalStation, setActivePortalStation] = useState<MediaItem | null>(null);

  const stations = useMemo(() => sources.filter((s) => s.type === 'radio'), [sources]);

  const PAGE_SIZE = 36;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredStations = useMemo(() => {
    if (!search.trim()) return stations;
    const q = search.toLowerCase();
    return stations.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.group && s.group.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
    );
  }, [stations, search]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search]);

  const displayedStations = useMemo(() => {
    return filteredStations.slice(0, visibleCount);
  }, [filteredStations, visibleCount]);

  const handleStationClick = (station: MediaItem) => {
    const isPortal = SUPPORTED_STREAMING_PORTALS.some((p) => station.url.includes(p));
    if (isPortal) {
      setActivePortalStation(station);
      return;
    }

    if (currentTrack?.id === station.id) {
      togglePlay();
    } else {
      playTrack(station);
    }
  };

  return (
    <div className="p-4 md:p-8 pb-36 md:pb-28 space-y-6 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <span>📻 Radios & Musique</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-red-950/80 text-[#E50914] font-mono border border-red-500/30">
              {stations.length} stations
            </span>
          </h1>
          <p className="text-[#A1A1A6] text-xs md:text-sm mt-1">
            Écoute continue en arrière-plan et ondes audio interactives à 60 FPS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Visualizer Trigger Button */}
          <button
            onClick={() => setIsVisualizerOpen(true)}
            className="px-3.5 py-2 rounded-xl glass hover:bg-white/10 text-white text-xs font-bold flex items-center gap-2 transition border border-white/10 hover:border-[#E50914]/50 shadow-md"
            title="Lancer le visualiseur interactif"
          >
            <Activity className="w-4 h-4 text-[#E50914] animate-pulse" />
            <span>Mode Visualiseur</span>
          </button>

          <VPNBadge compact />

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#E50914] hover:bg-[#F40612] text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-red-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter</span>
          </button>
        </div>
      </div>

      {/* Now Playing Interactive Visualizer Banner if playing */}
      {currentTrack && (
        <div
          onClick={() => setIsVisualizerOpen(true)}
          className="cursor-pointer p-4 md:p-5 rounded-2xl glass-strong border border-red-500/30 hover:border-[#E50914] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-950/40 via-black/80 to-transparent pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10 min-w-0">
            <div className="w-14 h-14 rounded-2xl glass p-2 flex items-center justify-center flex-shrink-0 bg-black/60 border border-white/10 group-hover:border-[#E50914]/60 transition-colors">
              {currentTrack.logo ? (
                <img src={currentTrack.logo} alt="" className="w-full h-full object-contain" />
              ) : (
                <Radio className="w-7 h-7 text-[#E50914]" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#E50914] text-white">
                  EN COURS D'ÉCOUTE
                </span>
                <span className="text-xs text-[#A1A1A6] font-mono hidden sm:inline">
                  • 128 kbps STEREO
                </span>
              </div>
              <h3 className="font-extrabold text-base text-white group-hover:text-red-300 transition-colors truncate mt-0.5">
                {currentTrack.title}
              </h3>
              <p className="text-xs text-white/60 truncate">
                {currentTrack.description || 'Cliquez pour ouvrir le visualiseur d\'ondes animé plein écran'}
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 flex-shrink-0">
            <div className="hidden md:flex items-end gap-1 h-6 px-3">
              {[40, 80, 50, 100, 65, 90, 45].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-[#E50914] rounded-full animate-pulse"
                  style={{ height: `${h}%`, animationDelay: `${i * 120}ms` }}
                />
              ))}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsVisualizerOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#E50914] hover:bg-[#F40612] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-red-950/40"
            >
              <Waves className="w-3.5 h-3.5" />
              <span>Ouvrir Visualiseur</span>
            </button>
          </div>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une radio par nom ou thématique..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl glass border border-white/10 text-white placeholder-white/40 text-xs focus:border-[#E50914] outline-none"
        />
      </div>

      {/* Stations Grid */}
      {filteredStations.length === 0 ? (
        <div className="text-center py-20 glass-strong rounded-3xl p-8 border border-white/[0.08]">
          <Music2 className="w-14 h-14 mx-auto mb-3 text-red-400/50" />
          <h3 className="text-lg font-bold text-white mb-2">Aucune radio trouvée</h3>
          <p className="text-[#A1A1A6] text-xs max-w-sm mx-auto mb-5">
            Ajoutez votre station préférée ou une URL de flux direct (MP3 / AAC / HLS).
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 bg-[#E50914] hover:bg-[#F40612] rounded-xl text-sm font-semibold text-white transition"
          >
            Ajouter une station
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayedStations.map((station) => {
            const isCurrent = currentTrack?.id === station.id;
            return (
              <div
                key={station.id}
                onClick={() => handleStationClick(station)}
                className={`p-4 rounded-2xl glass-strong border transition-all cursor-pointer group flex items-center justify-between gap-3 ${
                  isCurrent
                    ? 'border-[#E50914] shadow-[0_0_20px_rgba(229,9,20,0.35)] bg-red-950/20'
                    : 'border-white/[0.08] hover:border-white/20 hover:bg-white/[0.05]'
                } ${tvMode ? 'tv-focusable' : ''}`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl glass p-1.5 flex items-center justify-center flex-shrink-0 bg-black/60 group-hover:scale-105 transition-transform">
                    {station.logo ? (
                      <img src={station.logo} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <Radio className="w-5 h-5 text-white/50" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-white truncate group-hover:text-red-300 transition-colors">
                      {station.title}
                    </h4>
                    <span className="text-[10px] text-[#A1A1A6] block truncate">
                      {station.group || 'Généraliste'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStationClick(station);
                  }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition flex-shrink-0 ${
                    isCurrent && isPlaying
                      ? 'bg-[#E50914] text-white shadow-md'
                      : 'glass hover:bg-white/10 text-white/80'
                  }`}
                >
                  {isCurrent && isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5 fill-current" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {visibleCount < filteredStations.length && (
        <div className="flex justify-center pt-8 pb-4">
          <button
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-red-950/40 transition transform active:scale-95"
          >
            <span>Afficher plus de radios ({filteredStations.length - visibleCount} restantes)</span>
          </button>
        </div>
      )}

      {/* Add Modal */}
      <AddSourceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={(newItem) => playTrack(newItem)}
      />

      {/* Radio Visualizer Modal */}
      <RadioVisualizerModal
        isOpen={isVisualizerOpen}
        onClose={() => setIsVisualizerOpen(false)}
      />
    </div>
  );
}

export default RadioPage;
