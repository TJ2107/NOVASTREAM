import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Film,
  Search,
  ArrowLeft,
  Plus,
  Play,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { ContentCard } from '../components/common/ContentCard';
import { AddSourceModal } from '../components/common/AddSourceModal';
import { VPNBadge } from '../components/common/VPNBadge';

export function Movies() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { sources, continueWatching, updateProgress, tvMode } = useAppStore();

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const movies = useMemo(
    () => sources.filter((s) => s.type === 'movie' || s.type === 'series'),
    [sources]
  );

  const currentMovie = useMemo(() => {
    if (!id) return null;
    return movies.find((m) => m.id === id) || null;
  }, [id, movies]);

  const filteredMovies = useMemo(() => {
    if (!search.trim()) return movies;
    const q = search.toLowerCase();
    return movies.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.group && m.group.toLowerCase().includes(q)) ||
        (m.description && m.description.toLowerCase().includes(q))
    );
  }, [movies, search]);

  // Auto-hide top control bar after a delay
  const [showTopBar, setShowTopBar] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowTopBar(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Player view for movie/series
  if (id && currentMovie) {
    const savedTime = continueWatching[currentMovie.id] || 0;

    return (
      <div className="h-screen w-full bg-black flex flex-col relative select-none">
        {/* Floating Top Bar - Auto-hiding */}
        <div 
          className={`absolute top-4 left-4 z-40 flex items-center gap-3 transition-opacity duration-500 ${showTopBar ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onMouseEnter={() => setShowTopBar(true)}
          onTouchStart={() => setShowTopBar(true)}
        >
          <button
            onClick={() => navigate('/movies')}
            className="p-2.5 rounded-xl glass-strong hover:bg-white/20 text-white shadow-xl transition-all flex items-center gap-2 tv-focusable"
            title="Retour au catalogue (Échap)"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-xs font-semibold hidden sm:inline">Catalogue Vidéo</span>
          </button>

          <div className="glass-strong px-3 py-1.5 rounded-xl border border-white/10 hidden sm:flex items-center gap-2 text-xs">
            <span className="font-bold text-white">{currentMovie.title}</span>
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
            src={currentMovie.url}
            type={
              currentMovie.url.includes('.m3u8')
                ? 'hls'
                : currentMovie.url.includes('.mp4') || currentMovie.url.includes('.webm')
                ? 'mp4'
                : 'iframe'
            }
            title={currentMovie.title}
            poster={currentMovie.poster || currentMovie.logo}
            initialTime={savedTime}
            autoPlay
            onProgress={(time) => {
              if (time > 5) {
                updateProgress(currentMovie.id, time);
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
            <span>🎬 Films</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-600/20 text-cyan-400 font-mono border border-cyan-500/30">
              {movies.length}
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
              className="w-full pl-10 pr-4 py-2 rounded-xl glass-strong border border-white/10 text-white placeholder-white/40 text-xs md:text-sm focus:border-cyan-500 outline-none"
            />
          </div>

          <VPNBadge compact />

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs md:text-sm font-semibold flex items-center gap-2 transition flex-shrink-0 shadow-lg shadow-purple-900/30"
          >
            <Plus className="w-4 h-4" />
            <span>Ajout</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {filteredMovies.length === 0 ? (
        <div className="text-center py-20 glass-strong rounded-3xl p-8 border border-white/10">
          <div className="text-5xl mb-3">🍿</div>
          <h3 className="text-lg font-bold text-white mb-2">Aucun contenu trouvé</h3>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-sm font-semibold text-white transition"
          >
            Ajouter une vidéo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredMovies.map((movie, idx) => (
            <ContentCard
              key={`${movie.id}-${idx}`}
              item={movie}
              progress={continueWatching[movie.id]}
              onClick={() => navigate(`/movies/${movie.id}`)}
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      <AddSourceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={(newItem) => navigate(`/movies/${newItem.id}`)}
      />
    </div>
  );
}

export default Movies;
