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
  Waves,
  Sliders,
  Headphones,
  Heart,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAppStore, type MediaItem } from '../store/useAppStore';
import { useAudioStore } from '../store/useAudioStore';
import { AddSourceModal } from '../components/common/AddSourceModal';
import { VPNBadge } from '../components/common/VPNBadge';
import { RadioVisualizerModal } from '../components/radio/RadioVisualizerModal';
import { SpatialAudioPlayer } from '../components/player/SpatialAudioPlayer';
import { SUPPORTED_STREAMING_PORTALS } from '../services/UrlResolver';

export function RadioPage() {
  const { sources, favorites, toggleFavorite, tvMode } = useAppStore();
  const { currentTrack, isPlaying, playTrack, togglePlay } = useAudioStore();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const [isSpatialPlayerOpen, setIsSpatialPlayerOpen] = useState(false);
  const [showEmbeddedDeck, setShowEmbeddedDeck] = useState(true);

  const stations = useMemo(() => sources.filter((s) => s.type === 'radio'), [sources]);

  // Extract unique categories/groups for filter tabs
  const categories = useMemo(() => {
    const set = new Set<string>();
    stations.forEach((s) => {
      if (s.group) set.add(s.group);
    });
    return Array.from(set);
  }, [stations]);

  const PAGE_SIZE = 36;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredStations = useMemo(() => {
    return stations.filter((s) => {
      // Category filter
      if (selectedCategory === 'favorites') {
        if (!favorites.includes(s.id)) return false;
      } else if (selectedCategory !== 'all') {
        if (s.group !== selectedCategory) return false;
      }

      // Search query
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        (s.group && s.group.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
      );
    });
  }, [stations, search, selectedCategory, favorites]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, selectedCategory]);

  const displayedStations = useMemo(() => {
    return filteredStations.slice(0, visibleCount);
  }, [filteredStations, visibleCount]);

  const handleStationClick = (station: MediaItem) => {
    if (currentTrack?.id === station.id) {
      togglePlay();
    } else {
      playTrack(station);
    }
  };

  return (
    <div className="p-3 sm:p-6 md:p-8 pb-36 md:pb-28 space-y-6 max-w-7xl mx-auto select-none">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-lg md:text-xl font-black text-white flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-gradient-to-tr from-red-600 via-purple-600 to-indigo-600 shadow-lg shadow-red-950/40">
              📻
            </span>
            <span>Lecteur Audio & Radios 3D</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-red-950 text-[#E50914] font-mono font-bold border border-red-500/30">
              {stations.length} stations
            </span>
          </h1>
          <p className="text-white/60 text-xs sm:text-sm mt-1">
            Écoute continue en arrière-plan, traitement spatial WebAudio et ondes interactives à 60 FPS.
          </p>
        </div>

        {/* Top Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Embedded Deck */}
          <button
            onClick={() => setShowEmbeddedDeck(!showEmbeddedDeck)}
            className="px-3 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition border border-purple-500/40 shadow-md cursor-pointer active:scale-95 min-h-[40px]"
            title={showEmbeddedDeck ? 'Masquer la console audio' : 'Afficher la console audio'}
          >
            <Sliders className="w-4 h-4 text-purple-300" />
            <span>{showEmbeddedDeck ? 'Masquer Console' : 'Afficher Console'}</span>
            {showEmbeddedDeck ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Visualizer Trigger Button */}
          <button
            onClick={() => setIsVisualizerOpen(true)}
            className="px-3 py-2 rounded-xl glass hover:bg-white/10 text-white text-xs font-bold flex items-center gap-1.5 transition border border-white/10 hover:border-[#E50914]/50 shadow-sm cursor-pointer min-h-[40px]"
            title="Lancer le visualiseur d'ondes plein écran"
          >
            <Activity className="w-4 h-4 text-[#E50914] animate-pulse" />
            <span className="hidden sm:inline">Visualiseur</span>
          </button>

          <VPNBadge compact />

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#E50914] hover:bg-[#F40612] text-white text-xs font-extrabold flex items-center gap-1.5 transition shadow-md shadow-red-950/50 cursor-pointer min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter</span>
          </button>
        </div>
      </div>

      {/* Embedded Studio Spatial Audio Deck */}
      {showEmbeddedDeck && (
        <div className="animate-fade-in">
          <SpatialAudioPlayer embedded={true} isOpen={true} />
        </div>
      )}

      {/* Filter Segmented Control Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 min-h-[38px] ${
              selectedCategory === 'all'
                ? 'bg-red-600 text-white shadow-md shadow-red-950/40'
                : 'glass text-white/70 hover:text-white'
            }`}
          >
            Toutes ({stations.length})
          </button>

          {favorites.length > 0 && (
            <button
              onClick={() => setSelectedCategory('favorites')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 min-h-[38px] flex items-center gap-1.5 ${
                selectedCategory === 'favorites'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'glass text-amber-300 hover:text-amber-200'
              }`}
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Favoris ({favorites.filter((id) => stations.some((s) => s.id === id)).length})</span>
            </button>
          )}

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 min-h-[38px] ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'glass text-white/70 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input Bar */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une radio..."
            className="w-full pl-10 pr-4 py-2 rounded-xl glass border border-white/10 text-white placeholder-white/40 text-xs focus:border-[#E50914] outline-none min-h-[38px]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Stations Grid */}
      {filteredStations.length === 0 ? (
        <div className="text-center py-16 glass-strong rounded-3xl p-8 border border-white/[0.08] space-y-3">
          <Music2 className="w-12 h-12 mx-auto text-red-400/50" />
          <h3 className="text-base font-bold text-white">Aucune radio trouvée</h3>
          <p className="text-white/60 text-xs max-w-sm mx-auto">
            Aucun résultat ne correspond à votre recherche ou catégorie.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('all');
            }}
            className="px-4 py-2 bg-[#E50914] hover:bg-[#F40612] rounded-xl text-xs font-bold text-white transition cursor-pointer"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
          {displayedStations.map((station) => {
            const isCurrent = currentTrack?.id === station.id;
            const isFav = favorites.includes(station.id);

            return (
              <div
                key={station.id}
                onClick={() => handleStationClick(station)}
                className={`p-3.5 rounded-2xl glass-strong border transition-all cursor-pointer group flex items-center justify-between gap-3 relative overflow-hidden ${
                  isCurrent
                    ? 'border-[#E50914] shadow-[0_0_20px_rgba(229,9,20,0.35)] bg-red-950/30'
                    : 'border-white/[0.08] hover:border-white/25 hover:bg-white/[0.06]'
                } ${tvMode ? 'tv-focusable' : ''}`}
              >
                {/* Logo & Title */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl glass p-1.5 flex items-center justify-center flex-shrink-0 bg-black/60 group-hover:scale-105 transition-transform border border-white/10 relative">
                    {station.logo ? (
                      <img src={station.logo} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <Radio className="w-5 h-5 text-white/50" />
                    )}

                    {/* Live Equalizer Overlay when active */}
                    {isCurrent && isPlaying && (
                      <div className="absolute inset-0 bg-black/70 flex items-end justify-center gap-0.5 p-1 rounded-xl">
                        {[40, 80, 50, 95].map((h, i) => (
                          <div
                            key={i}
                            className="w-1 bg-red-500 rounded-full animate-pulse"
                            style={{ height: `${h}%`, animationDelay: `${i * 120}ms` }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-extrabold text-xs text-white truncate group-hover:text-red-300 transition-colors">
                      {station.title}
                    </h4>
                    <span className="text-[10px] text-white/50 block truncate font-mono mt-0.5">
                      {station.group || 'Généraliste'}
                    </span>
                  </div>
                </div>

                {/* Right Action Cluster */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Favorite Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(station.id);
                    }}
                    className={`p-1.5 rounded-lg transition ${
                      isFav ? 'text-amber-400' : 'text-white/20 hover:text-white/60'
                    }`}
                    title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                  </button>

                  {/* Play Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStationClick(station);
                    }}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition flex-shrink-0 min-w-[36px] min-h-[36px] cursor-pointer ${
                      isCurrent && isPlaying
                        ? 'bg-[#E50914] text-white shadow-md'
                        : 'glass hover:bg-white/20 text-white/80 hover:text-white'
                    }`}
                  >
                    {isCurrent && isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5 fill-current" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Load More */}
      {visibleCount < filteredStations.length && (
        <div className="flex justify-center pt-6 pb-4">
          <button
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-purple-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-xl shadow-red-950/40 transition transform active:scale-95 cursor-pointer"
          >
            <span>Afficher plus de radios ({filteredStations.length - visibleCount} restantes)</span>
          </button>
        </div>
      )}

      {/* Add Station Modal */}
      <AddSourceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={(newItem) => playTrack(newItem)}
      />

      {/* Radio Wave Visualizer Modal */}
      <RadioVisualizerModal
        isOpen={isVisualizerOpen}
        onClose={() => setIsVisualizerOpen(false)}
      />

      {/* Spatial Audio Standalone Modal */}
      <SpatialAudioPlayer
        isOpen={isSpatialPlayerOpen}
        onClose={() => setIsSpatialPlayerOpen(false)}
      />
    </div>
  );
}

export default RadioPage;
