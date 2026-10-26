import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Tv,
  ArrowLeft,
  Plus,
  Radio,
  SlidersHorizontal,
  Maximize2,
  Calendar,
  Grid2X2,
  Sparkles
} from 'lucide-react';
import { useAppStore, type MediaItem } from '../store/useAppStore';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { ContentCard } from '../components/common/ContentCard';
import { AddSourceModal } from '../components/common/AddSourceModal';
import { VPNBadge } from '../components/common/VPNBadge';
import { EPGGuide } from '../components/tv/EPGGuide';

const CATEGORIES = ['Toutes', 'Afrique & Congo', 'Actualités', 'Généraliste', 'Sport', 'Cinéma', 'Musique', 'Enfants', 'Documentaire'];

export function LiveTV() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { sources, tvMode } = useAppStore();
  const channels = useMemo(() => sources.filter((s) => s.type === 'live'), [sources]);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [viewMode, setViewMode] = useState<'grid' | 'epg'>('grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const guideRef = useRef<HTMLDivElement>(null);

  // Active channel
  const currentChannel = useMemo(() => {
    if (!id) return null;
    return channels.find((c) => c.id === id) || null;
  }, [id, channels]);

  const currentChannelIndex = useMemo(() => {
    if (!currentChannel) return -1;
    return channels.findIndex((c) => c.id === currentChannel.id);
  }, [currentChannel, channels]);

  // Keyboard navigation & zapping when watching a channel
  useEffect(() => {
    if (!id || channels.length === 0) return;

    const handleZapping = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'n') {
        e.preventDefault();
        const nextIdx = (currentChannelIndex + 1) % channels.length;
        navigate(`/tv/${channels[nextIdx].id}`);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'p') {
        e.preventDefault();
        const prevIdx = (currentChannelIndex - 1 + channels.length) % channels.length;
        navigate(`/tv/${channels[prevIdx].id}`);
      } else if (e.key === 'Escape') {
        navigate('/tv');
      }
    };

    window.addEventListener('keydown', handleZapping);
    return () => window.removeEventListener('keydown', handleZapping);
  }, [id, channels, currentChannelIndex, navigate]);

  // Scroll active channel into view in guide bar
  useEffect(() => {
    if (guideRef.current && currentChannel) {
      const activeBtn = guideRef.current.querySelector(`[data-channel-id="${currentChannel.id}"]`);
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentChannel]);

  const PAGE_SIZE = 36;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Filter channels in browse view
  const filteredChannels = useMemo(() => {
    return channels.filter((c) => {
      const matchSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.group && c.group.toLowerCase().includes(search.toLowerCase()));
      const matchCat =
        selectedCategory === 'Toutes' ||
        c.group?.toLowerCase().includes(selectedCategory.toLowerCase());
      return matchSearch && matchCat;
    });
  }, [channels, search, selectedCategory]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, selectedCategory]);

  const displayedChannels = useMemo(() => {
    return filteredChannels.slice(0, visibleCount);
  }, [filteredChannels, visibleCount]);

  // View: Live Player with interactive channel guide
  if (id && currentChannel) {
    return (
      <div className="h-screen w-full flex flex-col bg-[#000000] text-white overflow-hidden relative">
        {/* Top Control Bar with Quick EPG and Multi-View Actions */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-white/[0.08] glass-strong z-20 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/tv')}
              className="p-2 rounded-xl glass hover:bg-white/10 text-white/70 hover:text-white transition"
              title="Retour aux chaînes"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E50914] animate-pulse flex-shrink-0" />
              <span className="font-black text-sm md:text-base text-white truncate">
                {currentChannel.title}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950/80 text-[#E50914] border border-[#E50914]/30 font-mono font-bold hidden sm:inline">
                EN DIRECT
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/multiview')}
              className="px-3 py-1.5 rounded-xl glass hover:bg-white/10 text-xs font-semibold text-white/80 hover:text-white flex items-center gap-1.5 transition border border-white/10"
              title="Basculer vers le mode mosaïque (2 à 4 chaînes en même temps)"
            >
              <Grid2X2 className="w-3.5 h-3.5 text-[#E50914]" />
              <span className="hidden sm:inline">Mosaïque</span>
            </button>

            <VPNBadge compact />
          </div>
        </div>

        {/* Video Player */}
        <div className="flex-1 w-full relative bg-black flex items-center justify-center overflow-hidden">
          <VideoPlayer
            src={currentChannel.url}
            alternativeUrls={currentChannel.alternativeUrls}
            headers={currentChannel.headers}
            poster={currentChannel.logo}
            title={currentChannel.title}
            autoPlay
            onEnded={() => {
              const nextIdx = (currentChannelIndex + 1) % channels.length;
              navigate(`/tv/${channels[nextIdx].id}`);
            }}
          />
        </div>

        {/* Bottom Interactive Quick Zapping Bar */}
        <div className="h-16 border-t border-white/[0.08] glass-strong px-4 flex items-center gap-2 z-20 flex-shrink-0">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider mr-2 hidden sm:inline flex-shrink-0">
            Zapping Rapide :
          </span>

          <div ref={guideRef} className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            {channels.map((chan, idx) => {
              const isActive = chan.id === currentChannel.id;
              return (
                <button
                  key={`${chan.id}-${idx}`}
                  data-channel-id={chan.id}
                  onClick={() => navigate(`/tv/${chan.id}`)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-[#E50914] text-white shadow-lg shadow-red-950/50 scale-105 border border-red-500/50'
                      : 'glass text-white/70 hover:text-white hover:bg-white/10'
                  } ${tvMode ? 'tv-focusable' : ''}`}
                >
                  <span className="font-mono text-[10px] text-white/50">{idx + 1}.</span>
                  {chan.logo ? (
                    <img src={chan.logo} alt="" className="w-4 h-4 object-contain rounded" />
                  ) : (
                    <Tv className="w-3.5 h-3.5" />
                  )}
                  <span className="truncate max-w-[140px]">{chan.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-28 md:pb-12 space-y-6 max-w-7xl mx-auto">
      {/* Header and View Mode Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <span>📺 TV en direct</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-red-950/80 text-[#E50914] font-mono border border-red-500/30">
              {channels.length} chaînes
            </span>
          </h1>
          <p className="text-[#A1A1A6] text-xs md:text-sm mt-1">
            Diffusion haute fidélité, grille EPG en temps réel et mode multi-écrans simultané.
          </p>
        </div>

        {/* Action Controls & Navigation Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Switcher: Grille vs Guide EPG vs Multi-View */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/60 border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'grid'
                  ? 'bg-[#E50914] text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Chaînes</span>
            </button>

            <button
              onClick={() => setViewMode('epg')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'epg'
                  ? 'bg-[#E50914] text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Guide EPG</span>
            </button>

            <button
              onClick={() => navigate('/multiview')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-white/70 hover:text-white hover:bg-white/5 transition"
              title="Ouvrir le mode Mosaïque (2 à 4 chaînes simultanées)"
            >
              <Grid2X2 className="w-3.5 h-3.5 text-[#E50914]" />
              <span className="hidden sm:inline">Mosaïque</span>
            </button>
          </div>

          <VPNBadge compact />

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#E50914] hover:bg-[#F40612] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-950/40 transition flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter</span>
          </button>
        </div>
      </div>

      {/* Render according to active View Mode */}
      {viewMode === 'epg' ? (
        <EPGGuide
          channels={channels}
          onSelectChannel={(channel) => navigate(`/tv/${channel.id}`)}
        />
      ) : (
        <>
          {/* Search bar & Categories filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#E50914] text-white shadow-lg shadow-red-950/40 border border-red-500/40'
                      : 'glass text-white/70 hover:text-white hover:bg-white/10'
                  } ${tvMode ? 'tv-focusable' : ''}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une chaîne..."
                className="w-full pl-10 pr-4 py-2 rounded-xl glass border border-white/10 text-white placeholder-white/40 text-xs focus:border-[#E50914] outline-none"
              />
            </div>
          </div>

          {/* Channels Grid */}
          {filteredChannels.length === 0 ? (
            <div className="text-center py-20 glass-strong rounded-3xl p-8 border border-white/[0.08]">
              <div className="text-5xl mb-3">📡</div>
              <h3 className="text-lg font-bold text-white mb-2">Aucune chaîne trouvée</h3>
              <p className="text-[#A1A1A6] text-xs max-w-sm mx-auto mb-5">
                Essayez un autre mot-clé ou ajoutez une liste M3U / URL de flux HLS.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-5 py-2.5 bg-[#E50914] hover:bg-[#F40612] rounded-xl text-sm font-semibold text-white transition"
              >
                Ajouter un flux TV
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                {displayedChannels.map((channel, idx) => (
                  <ContentCard
                    key={`${channel.id}-${idx}`}
                    item={channel}
                    onClick={() => navigate(`/tv/${channel.id}`)}
                  />
                ))}
              </div>

              {visibleCount < filteredChannels.length && (
                <div className="flex justify-center pt-8 pb-4">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-purple-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-red-950/40 transition transform active:scale-95"
                  >
                    <span>Afficher plus de chaînes ({filteredChannels.length - visibleCount} restantes)</span>
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Add Modal */}
      <AddSourceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={(newItem) => navigate(`/tv/${newItem.id}`)}
      />
    </div>
  );
}

export default LiveTV;
