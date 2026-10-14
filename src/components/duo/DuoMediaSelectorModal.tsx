import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Globe,
  Tv,
  Film,
  Tv2,
  Radio,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Layers,
  Play
} from 'lucide-react';
import { useAppStore, type MediaItem, type MediaType } from '../../store/useAppStore';
import { SUPPORTED_STREAMING_PORTALS } from '../../services/UrlResolver';

interface DuoMediaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (item: MediaItem) => void;
  title?: string;
  activeMediaId?: string;
}

const PRESET_PORTALS = [
  { domain: 'vavoo.to', label: 'VAVOO', desc: 'Portail média universel & TV interactive', icon: '📺' },
  { domain: 'oha.to', label: 'OHA', desc: 'Portail de streaming TV, films et séries', icon: '🎬' },
  { domain: 'huhu.to', label: 'HUHU', desc: 'Catalogue TV direct et chaînes en ligne', icon: '📡' },
  { domain: 'kool.ws', label: 'KOOL', desc: 'Portail web de divertissement multi-formats', icon: '⚡' },
  { domain: 'voltop.net', label: 'VOLTOP', desc: 'Flux TV interactifs et médias en continu', icon: '🌐' },
  { domain: 'vavoo.top', label: 'VAVOO TOP', desc: 'Portail alternatif direct pour web & Smart TV', icon: '🚀' },
  { domain: 'youtube.com', label: 'YouTube', desc: 'Recherche et vidéos en streaming', icon: '▶️' },
  { domain: 'google.com', label: 'Google', desc: 'Recherche web et navigation directe', icon: '🔍' }
];

export function DuoMediaSelectorModal({
  isOpen,
  onClose,
  onSelectMedia,
  title = 'Changer le flux sur la TV',
  activeMediaId
}: DuoMediaSelectorModalProps) {
  const { sources, addSource } = useAppStore();
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'portals' | 'live' | 'movie' | 'series' | 'radio'>('all');
  const [customUrl, setCustomUrl] = useState('');

  // Portals transformed into MediaItems
  const portalItems = useMemo<MediaItem[]>(() => {
    return PRESET_PORTALS.map((p) => ({
      id: `portal-${p.domain.replace(/[^a-zA-Z0-9]/g, '-')}`,
      type: 'live',
      title: `${p.label} (${p.domain})`,
      url: p.domain.startsWith('http') ? p.domain : `https://${p.domain}`,
      group: 'Portails & Sites Web',
      category: 'general',
      description: p.desc
    }));
  }, []);

  // Combined sources (library sources + predefined web portals)
  const allMediaItems = useMemo<MediaItem[]>(() => {
    // Avoid duplicates if portal items are already in sources
    const existingIds = new Set(sources.map((s) => s.id));
    const nonDuplicatedPortals = portalItems.filter((p) => !existingIds.has(p.id));
    return [...nonDuplicatedPortals, ...sources];
  }, [sources, portalItems]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: allMediaItems.length,
      portals: portalItems.length,
      live: allMediaItems.filter((s) => s.type === 'live' && !s.group?.includes('Portail')).length,
      movie: allMediaItems.filter((s) => s.type === 'movie').length,
      series: allMediaItems.filter((s) => s.type === 'series').length,
      radio: allMediaItems.filter((s) => s.type === 'radio').length
    };
  }, [allMediaItems, portalItems]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return allMediaItems.filter((item) => {
      // Tab filter
      if (selectedTab === 'portals') {
        const isPortal =
          item.group?.includes('Portail') ||
          SUPPORTED_STREAMING_PORTALS.some((p) => item.url.includes(p)) ||
          item.url.includes('youtube.com') ||
          item.url.includes('google.com');
        if (!isPortal) return false;
      } else if (selectedTab !== 'all') {
        if (item.type !== selectedTab) return false;
      }

      // Search filter
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.group && item.group.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.url.toLowerCase().includes(q)
      );
    });
  }, [allMediaItems, selectedTab, search]);

  const handleLaunchCustomUrl = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = customUrl.trim();
    if (!trimmed) return;

    let targetUrl = trimmed;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    try {
      const parsed = new URL(targetUrl);
      const host = parsed.hostname;
      const isVideo = targetUrl.includes('.m3u8') || targetUrl.includes('.mp4');

      const newItem: MediaItem = {
        id: `site-${host.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now().toString(36)}`,
        type: isVideo ? 'live' : 'live',
        title: host.toUpperCase(),
        url: targetUrl,
        group: isVideo ? 'Flux Direct' : 'Portails & Sites Web',
        category: 'general',
        description: `Diffusion directe du site web ${host}`
      };

      addSource(newItem);
      onSelectMedia(newItem);
      setCustomUrl('');
      onClose();
    } catch {
      // Invalid URL
    }
  };

  const handleItemClick = (item: MediaItem) => {
    onSelectMedia(item);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in select-none">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-3xl glass-strong border border-indigo-500/40 shadow-2xl flex flex-col overflow-hidden bg-[#0a0a1a]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-cyan-300">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>{title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-cyan-300 border border-indigo-500/40 font-mono">
                  {allMediaItems.length} disponibles
                </span>
              </h3>
              <p className="text-xs text-white/60">
                Sélectionnez une chaîne, un film, une série ou lancez un portail / site web sur la TV
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Custom URL Input Bar */}
        <div className="p-3 sm:p-4 bg-indigo-950/30 border-b border-white/10 flex-shrink-0">
          <form onSubmit={handleLaunchCustomUrl} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Globe className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="Entrez un site ou un flux (ex: google.com, youtube.com, vavoo.to, ou .m3u8)..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-white/40 focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={!customUrl.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md flex-shrink-0"
            >
              <span>Lancer ce site sur la TV</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Search & Tabs */}
        <div className="p-3 sm:p-4 border-b border-white/10 space-y-3 flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une chaîne, un film, une radio, ou un portail..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-white/30 focus:border-indigo-400 focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white"
              >
                Effacer
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-bold">
            <button
              onClick={() => setSelectedTab('all')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 flex-shrink-0 ${
                selectedTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'glass text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Tout ({counts.all})</span>
            </button>

            <button
              onClick={() => setSelectedTab('portals')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 flex-shrink-0 ${
                selectedTab === 'portals'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'glass text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Globe className="w-3 h-3 text-cyan-300" />
              <span>Portails & Sites Web ({counts.portals})</span>
            </button>

            <button
              onClick={() => setSelectedTab('live')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 flex-shrink-0 ${
                selectedTab === 'live'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'glass text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Tv className="w-3 h-3 text-red-300" />
              <span>TV en Direct ({counts.live})</span>
            </button>

            <button
              onClick={() => setSelectedTab('movie')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 flex-shrink-0 ${
                selectedTab === 'movie'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'glass text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Film className="w-3 h-3 text-cyan-300" />
              <span>Films VOD ({counts.movie})</span>
            </button>

            <button
              onClick={() => setSelectedTab('series')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 flex-shrink-0 ${
                selectedTab === 'series'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'glass text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Tv2 className="w-3 h-3 text-purple-300" />
              <span>Séries TV ({counts.series})</span>
            </button>

            <button
              onClick={() => setSelectedTab('radio')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 flex-shrink-0 ${
                selectedTab === 'radio'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'glass text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Radio className="w-3 h-3 text-amber-300" />
              <span>Radios ({counts.radio})</span>
            </button>
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Quick preset portals cards when 'portals' or 'all' is selected and no search */}
          {(selectedTab === 'portals' || (selectedTab === 'all' && !search)) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider">
                <Globe className="w-3.5 h-3.5" />
                <span>Portails & Navigateur Web Prêts à l'Emploi</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {PRESET_PORTALS.map((portal) => (
                  <button
                    key={portal.domain}
                    onClick={() => {
                      const item: MediaItem = {
                        id: `portal-${portal.domain.replace(/[^a-zA-Z0-9]/g, '-')}`,
                        type: 'live',
                        title: `${portal.label} (${portal.domain})`,
                        url: `https://${portal.domain}`,
                        group: 'Portails & Sites Web',
                        category: 'general',
                        description: portal.desc
                      };
                      handleItemClick(item);
                    }}
                    className="p-3 rounded-2xl glass hover:border-cyan-400/50 hover:bg-cyan-950/30 transition text-left flex flex-col justify-between border border-white/10 group"
                  >
                    <div>
                      <div className="text-xl mb-1">{portal.icon}</div>
                      <span className="font-black text-xs text-white block group-hover:text-cyan-300 transition">
                        {portal.label}
                      </span>
                      <span className="text-[10px] text-white/50 block font-mono">
                        {portal.domain}
                      </span>
                    </div>
                    <span className="mt-2 text-[9px] text-cyan-400 font-bold flex items-center gap-1">
                      <span>Caster sur TV</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* List of items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-white/60">
              <span>Résultats ({filteredItems.length})</span>
            </div>

            {filteredItems.length === 0 ? (
              <div className="text-center py-12 glass rounded-2xl p-6 border border-white/5">
                <Globe className="w-8 h-8 mx-auto text-white/30 mb-2" />
                <p className="text-sm font-bold text-white">Aucun flux ou site trouvé</p>
                <p className="text-xs text-white/50 mt-1">
                  Essayez une autre recherche ou collez directement l'URL ci-dessus.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredItems.map((item) => {
                  const isActive = activeMediaId === item.id;
                  const isWebSite =
                    item.group?.includes('Portail') ||
                    SUPPORTED_STREAMING_PORTALS.some((p) => item.url.includes(p)) ||
                    item.url.includes('google.com') ||
                    item.url.includes('youtube.com');

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`p-3 rounded-2xl glass transition text-left flex items-center gap-3 border ${
                        isActive
                          ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-950/30'
                          : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-xl glass p-1 flex items-center justify-center flex-shrink-0 bg-black/50 border border-white/10">
                        {item.logo || item.poster ? (
                          <img
                            src={item.poster || item.logo}
                            alt=""
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : isWebSite ? (
                          <Globe className="w-5 h-5 text-cyan-400" />
                        ) : item.type === 'radio' ? (
                          <Radio className="w-5 h-5 text-amber-400" />
                        ) : (
                          <Tv className="w-5 h-5 text-indigo-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white truncate block">
                            {item.title}
                          </span>
                          {isActive && (
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                              isWebSite
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                                : item.type === 'live'
                                ? 'bg-red-950 text-red-300 border border-red-500/30'
                                : item.type === 'movie'
                                ? 'bg-blue-950 text-blue-300 border border-blue-500/30'
                                : item.type === 'series'
                                ? 'bg-purple-950 text-purple-300 border border-purple-500/30'
                                : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {isWebSite ? 'SITE WEB' : item.type.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-white/50 truncate">
                            {item.group || 'Général'}
                          </span>
                        </div>
                      </div>

                      <div className="w-7 h-7 rounded-lg glass flex items-center justify-center flex-shrink-0 text-white/40 hover:text-cyan-300 transition">
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
