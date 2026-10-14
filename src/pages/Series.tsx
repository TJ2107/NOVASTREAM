import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Tv2,
  Search,
  ArrowLeft,
  Plus,
  Play,
  RotateCcw,
  Sparkles,
  Layers
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { ContentCard } from '../components/common/ContentCard';
import { AddSourceModal } from '../components/common/AddSourceModal';
import { VPNBadge } from '../components/common/VPNBadge';

export function Series() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { sources, continueWatching, updateProgress, tvMode } = useAppStore();

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // All series
  const seriesList = useMemo(
    () => sources.filter((s) => s.type === 'series' || (s.type === 'movie' && s.group?.toLowerCase().includes('série'))),
    [sources]
  );

  const currentSeries = useMemo(() => {
    if (!id) return null;
    return seriesList.find((s) => s.id === id) || null;
  }, [id, seriesList]);

  const PAGE_SIZE = 36;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredSeries = useMemo(() => {
    if (!search.trim()) return seriesList;
    const q = search.toLowerCase();
    return seriesList.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.group && s.group.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
    );
  }, [seriesList, search]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search]);

  const displayedSeries = useMemo(() => {
    return filteredSeries.slice(0, visibleCount);
  }, [filteredSeries, visibleCount]);

  // Auto-hide top control bar after a delay
  const [showTopBar, setShowTopBar] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowTopBar(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Player view for series
  if (id && currentSeries) {
    const savedTime = continueWatching[currentSeries.id] || 0;

    return (
      <div className="h-screen w-full bg-black flex flex-col relative select-none">
        {/* Floating Top Bar - Auto-hiding */}
        <div 
          className={`absolute top-4 left-4 z-40 flex items-center gap-3 transition-opacity duration-500 ${showTopBar ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onMouseEnter={() => setShowTopBar(true)}
          onTouchStart={() => setShowTopBar(true)}
        >
          <button
            onClick={() => navigate('/series')}
            className="p-2.5 rounded-xl glass-strong hover:bg-white/20 text-white shadow-xl transition-all flex items-center gap-2 tv-focusable"
            title="Retour au catalogue des séries (Échap)"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-xs font-semibold hidden sm:inline">Catalogue Séries</span>
          </button>

          <div className="glass-strong px-3 py-1.5 rounded-xl border border-white/10 hidden sm:flex items-center gap-2 text-xs">
            <span className="font-bold text-white">{currentSeries.title}</span>
            {savedTime > 10 && (
              <span className="text-cyan-400 font-mono text-[11px]">
                (Reprise à {Math.floor(savedTime / 60)}m)
              </span>
            )}
          </div>
        </div>

        {/* Video Player */}
        <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center">
          <VideoPlayer
            src={currentSeries.url}
            type={
              currentSeries.url.includes('.m3u8')
                ? 'hls'
                : currentSeries.url.includes('.mp4') || currentSeries.url.includes('.webm')
                ? 'mp4'
                : 'iframe'
            }
            title={currentSeries.title}
            poster={currentSeries.poster || currentSeries.logo}
            initialTime={savedTime}
            autoPlay
            onProgress={(time) => {
              if (time > 5) {
                updateProgress(currentSeries.id, time);
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-28 md:pb-12 space-y-4 md:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <span>📺 Séries</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-600/20 text-indigo-400 font-mono border border-indigo-500/30">
              {seriesList.length}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 rounded-xl glass-strong border border-white/10 text-white placeholder-white/40 text-xs md:text-sm focus:border-indigo-500 outline-none"
            />
          </div>

          <VPNBadge compact />

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs md:text-sm font-semibold flex items-center gap-2 transition flex-shrink-0 shadow-lg shadow-indigo-900/30"
          >
            <Plus className="w-4 h-4" />
            <span>Ajout</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {filteredSeries.length === 0 ? (
        <div className="text-center py-20 glass-strong rounded-3xl p-8 border border-white/10">
          <div className="text-5xl mb-3">📺</div>
          <h3 className="text-lg font-bold text-white mb-2">Aucun contenu trouvé</h3>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold text-white transition"
          >
            Ajouter une série
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {displayedSeries.map((series, idx) => (
              <ContentCard
                key={`${series.id}-${idx}`}
                item={series}
                progress={continueWatching[series.id]}
                onClick={() => navigate(`/series/${series.id}`)}
              />
            ))}
          </div>

          {visibleCount < filteredSeries.length && (
            <div className="flex justify-center pt-8 pb-4">
              <button
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-indigo-950/40 transition transform active:scale-95"
              >
                <span>Afficher plus de séries ({filteredSeries.length - visibleCount} restantes)</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* Add Modal */}
      <AddSourceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={(newItem) => navigate(`/series/${newItem.id}`)}
      />
    </div>
  );
}

export default Series;
