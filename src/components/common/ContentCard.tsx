import React, { useState, useEffect, memo } from 'react';
import { Play, Star, Radio } from 'lucide-react';
import { type MediaItem, useAppStore } from '../../store/useAppStore';

interface ContentCardProps {
  item: MediaItem;
  progress?: number;
  onClick: () => void;
}

export const ContentCard = memo(function ContentCard({ item, progress, onClick }: ContentCardProps) {
  const isFav = useAppStore((s) => s.favorites.includes(item.id));
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const tvMode = useAppStore((s) => s.tvMode);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    setHasError(false);
  }, [item.id, item.poster, item.logo]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(item.id);
  };

  const imageSrc = item.poster || item.logo;

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={0}
      role="button"
      className={`group cursor-pointer flex flex-col rounded-2xl p-2 transition-all duration-200 transform hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] relative will-change-transform ${
        tvMode ? 'tv-focusable' : 'glass hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-950/20'
      }`}
    >
      {/* Thumbnail Aspect Box */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-[#12122b] to-[#090918] flex items-center justify-center border border-white/5 group-hover:border-purple-500/30 transition-all">
        {imageSrc && !hasError ? (
          <img
            src={imageSrc}
            alt={item.title}
            className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            onError={() => setHasError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-800/40 to-cyan-800/40 flex items-center justify-center">
            {item.type === 'radio' ? (
              <Radio className="w-10 h-10 text-cyan-400 group-hover:scale-110 transition-transform" />
            ) : (
              <Play className="w-10 h-10 text-purple-400 group-hover:scale-110 transition-transform ml-1" />
            )}
          </div>
        )}

        {/* Hover play overlay */}
        <div className="absolute inset-0 bg-purple-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/40 shadow-xl group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 ml-0.5 fill-white" />
          </div>
        </div>

        {/* Live Badge */}
        {item.type === 'live' && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-red-600/90 text-[10px] font-black uppercase tracking-wider text-white rounded-md flex items-center gap-1 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            DIRECT
          </span>
        )}

        {/* Radio Badge */}
        {item.type === 'radio' && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-cyan-600/90 text-[10px] font-bold uppercase tracking-wider text-white rounded-md shadow-md">
            RADIO
          </span>
        )}

        {/* Favorite Icon */}
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-md transition-all ${
            isFav
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 opacity-100'
              : 'bg-black/40 text-white/40 hover:text-amber-400 opacity-0 group-hover:opacity-100'
          }`}
          title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
        </button>

        {/* Progress bar */}
        {typeof progress === 'number' && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-400"
              style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
            />
          </div>
        )}
      </div>

      {/* Title & Group */}
      <div className="mt-2.5 px-1 min-w-0">
        <h4 className="text-xs md:text-sm font-semibold truncate text-white/90 group-hover:text-purple-300 transition-colors">
          {item.title}
        </h4>
        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-white/50">
          {item.group && <span className="truncate">{item.group}</span>}
          {item.country && (
            <span className="text-[10px] px-1 py-0.2 bg-white/5 rounded border border-white/10 uppercase">
              {item.country}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
