import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Play,
  Clock,
  TrendingUp,
  Star,
  Search,
  Plus,
  Radio,
  Tv,
  Film,
  Tv2,
  Sparkles,
  Link2,
  Globe,
  Layers,
  CheckCircle2,
  Shield,
  ArrowRight
} from 'lucide-react';
import { useAppStore, type MediaItem, type MediaType, dedupeSources } from '../store/useAppStore';
import { ContentCard } from '../components/common/ContentCard';
import { AddSourceModal } from '../components/common/AddSourceModal';
import { VPNBadge } from '../components/common/VPNBadge';
import { NovaLogo } from '../components/common/NovaLogo';
import { useAudioStore } from '../store/useAudioStore';

export function Home() {
  const navigate = useNavigate();
  const { sources, favorites, continueWatching, loadDemoSources, addSource, addPortalPack, vpnEnabled } = useAppStore();
  const { playTrack } = useAudioStore();

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastInfo, setToastInfo] = useState<string | null>(null);

  const cleanSources = useMemo(() => dedupeSources(sources), [sources]);

  const filteredSources = useMemo(() => {
    if (!search.trim()) return cleanSources;
    const query = search.toLowerCase();
    return cleanSources.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        (s.group && s.group.toLowerCase().includes(query)) ||
        (s.description && s.description.toLowerCase().includes(query))
    );
  }, [cleanSources, search]);

  const liveChannels = useMemo(
    () => filteredSources.filter((s) => s.type === 'live'),
    [filteredSources]
  );
  const movies = useMemo(
    () => filteredSources.filter((s) => s.type === 'movie'),
    [filteredSources]
  );
  const seriesList = useMemo(
    () => filteredSources.filter((s) => s.type === 'series'),
    [filteredSources]
  );
  const radios = useMemo(
    () => filteredSources.filter((s) => s.type === 'radio'),
    [filteredSources]
  );
  const favoriteItems = useMemo(() => {
    const favSet = new Set(favorites);
    return cleanSources.filter((s) => favSet.has(s.id));
  }, [cleanSources, favorites]);

  const continueItems = useMemo(() => {
    if (!continueWatching || Object.keys(continueWatching).length === 0) return [];
    const map = new Map<string, MediaItem>();
    for (let i = 0; i < cleanSources.length; i++) {
      map.set(cleanSources[i].id, cleanSources[i]);
    }
    return Object.entries(continueWatching)
      .map(([id, progress]) => {
        const item = map.get(id);
        return item ? { item, progress } : null;
      })
      .filter(Boolean) as { item: MediaItem; progress: number }[];
  }, [continueWatching, cleanSources]);

  const handleMediaClick = (item: MediaItem) => {
    if (item.type === 'radio') {
      playTrack(item);
    } else if (item.type === 'live') {
      navigate(`/tv/${item.id}`);
    } else if (item.type === 'series') {
      navigate(`/series/${item.id}`);
    } else {
      navigate(`/movies/${item.id}`);
    }
  };

  const handlePortalLaunch = (domain: string, type: MediaType) => {
    const typeTitles: Record<MediaType, string> = {
      live: 'TV en direct',
      movie: 'Films VOD',
      series: 'Séries TV',
      radio: 'Radios Web'
    };
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const cleanId = `portal-${cleanDomain}-${type}`;
    const targetHost = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
    const item: MediaItem = {
      id: cleanId,
      type,
      title: `${targetHost.toUpperCase()} (${typeTitles[type]})`,
      url: `https://${targetHost}`,
      group: 'Portails Multimédia',
      category: type === 'radio' ? 'music' : type === 'movie' ? 'cinema' : 'general',
      description: `Accès direct ${typeTitles[type]} depuis le portail ${targetHost}.`
    };
    addSource(item);
    handleMediaClick(item);
  };

  return (
    <div className="p-4 md:p-8 pb-28 md:pb-12 space-y-6 md:space-y-8 max-w-7xl mx-auto">
      {/* Hero Banner */}
      <div className="relative rounded-2xl md:rounded-3xl overflow-hidden glass-strong border border-white/[0.08] shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-red-950/40 via-black/80 to-zinc-950/60 pointer-events-none" />
        <div className="relative p-5 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/30 text-[10px] md:text-[11px] font-semibold text-red-200">
                <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#E50914]" />
                <span>Hub Multimédia Cosmique & Universel</span>
              </div>
              <VPNBadge />
            </div>
            <div className="py-1">
              <NovaLogo size="xl" showText={true} />
            </div>
            <p className="text-xs md:text-sm text-[#A1A1A6] leading-relaxed">
              Expérience cinéma OLED : TV en direct, films VOD, séries et radios haute fidélité sans interruption.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#F40612] text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-950/50 transition-all tv-focusable active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un flux</span>
              </button>

              <button
                onClick={loadDemoSources}
                className="px-4 py-2 rounded-xl glass hover:bg-white/10 text-white/90 font-medium text-[10px] md:text-xs flex items-center gap-2 border border-white/10 transition tv-focusable"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Démos</span>
              </button>
            </div>
          </div>

          {/* Quick Counter Badges */}
          <div className="grid grid-cols-3 gap-2 w-full md:w-auto flex-shrink-0">
            <div className="glass p-2.5 rounded-xl text-center border border-purple-500/20">
              <Tv className="w-3.5 h-3.5 md:w-4 md:h-4 mx-auto mb-1 text-purple-400" />
              <div className="text-sm md:text-base font-black text-white">{liveChannels.length}</div>
              <div className="text-[8px] md:text-[9px] text-white/50 uppercase font-medium">Chaînes</div>
            </div>
            <div className="glass p-2.5 rounded-xl text-center border border-cyan-500/20">
              <Film className="w-3.5 h-3.5 md:w-4 md:h-4 mx-auto mb-1 text-cyan-400" />
              <div className="text-sm md:text-base font-black text-white">{movies.length}</div>
              <div className="text-[8px] md:text-[9px] text-white/50 uppercase font-medium">VOD</div>
            </div>
            <div className="glass p-2.5 rounded-xl text-center border border-indigo-500/20">
              <Radio className="w-3.5 h-3.5 md:w-4 md:h-4 mx-auto mb-1 text-indigo-400" />
              <div className="text-sm md:text-base font-black text-white">{radios.length}</div>
              <div className="text-[8px] md:text-[9px] text-white/50 uppercase font-medium">Radios</div>
            </div>
          </div>
        </div>
      </div>

      {/* Swiss VPN One-Tap Banner */}
      <div
        onClick={() => navigate('/vpn')}
        className="cursor-pointer p-4 md:p-5 rounded-2xl glass-strong border border-emerald-500/30 hover:border-emerald-400/60 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/20 to-transparent pointer-events-none" />
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-950 to-teal-950 border border-emerald-500/40 flex items-center justify-center text-xl flex-shrink-0 shadow-md">
            🇨🇭
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white group-hover:text-emerald-300 transition-colors">
                Bouclier VPN Suisse Intégré
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                  vpnEnabled
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    : 'bg-white/5 text-white/50 border-white/10'
                }`}
              >
                {vpnEnabled ? '● 1 TAP CHIFFRÉ' : 'DÉCONNECTÉ'}
              </span>
            </div>
            <p className="text-xs text-white/70 mt-0.5 leading-relaxed">
              « Un tap, et votre connexion est chiffrée : au café, à l'hôtel, dans le train. Changez de pays, passez les blocages. Serveurs suisses, pas de logs, pas de bridage. »
            </p>
          </div>
        </div>

        <button className="relative z-10 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 shadow-md shadow-emerald-950/40">
          <span>Ouvrir VPN</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* NOVASTREAM Duo Multi-Screen Banner */}
      <div
        onClick={() => navigate('/duo')}
        className="cursor-pointer p-4 md:p-5 rounded-2xl glass-strong border border-indigo-500/30 hover:border-cyan-400/60 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/30 via-purple-950/20 to-transparent pointer-events-none" />
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-900 via-purple-900 to-cyan-900 border border-indigo-400/40 flex items-center justify-center text-xl flex-shrink-0 shadow-md">
            📲
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white group-hover:text-red-400 transition-colors">
                NOVASTREAM Duo • Continuité Multi-Écrans
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border bg-indigo-950/80 text-cyan-300 border-indigo-400/40">
                2 ÉCRANS • 1 IMAGE
              </span>
            </div>
            <p className="text-xs text-white/80 mt-0.5 leading-relaxed font-medium italic">
              « Commencez un film sur le téléphone, continuez sur la télé. Deux écrans, une image, et c'est le téléphone qui pilote. »
            </p>
          </div>
        </div>

        <button className="relative z-10 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 shadow-md shadow-indigo-950/40">
          <span>Lancer Duo</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Global Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une chaîne, un film, une série, une radio..."
          className="w-full pl-12 pr-4 py-3 rounded-2xl glass-strong border border-white/10 text-white placeholder-white/40 focus:border-purple-500 focus:bg-black/40 outline-none text-sm transition shadow-lg"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/50 hover:text-white"
          >
            Effacer
          </button>
        )}
      </div>

      {/* Notification Toast */}
      {toastInfo && (
        <div className="p-3.5 rounded-2xl glass-strong border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2.5 shadow-xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-medium">{toastInfo}</span>
        </div>
      )}

      {/* Portails Multimédia Connectés (vavoo.to, voltop.net, kool.ws, oha.to, huhu.to, vavoo.top) */}
      {!search && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold text-white">Portails Multimédia Spéciaux</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/browser')}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-900/40 transition"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Ouvrir le Navigateur Intégré</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[
              { domain: 'vavoo.to', label: 'VAVOO', desc: 'Portail média universel & TV interactive' },
              { domain: 'oha.to', label: 'OHA', desc: 'Portail de streaming TV, films et séries' },
              { domain: 'huhu.to', label: 'HUHU', desc: 'Catalogue TV direct et chaînes en ligne' },
              { domain: 'kool.ws', label: 'KOOL', desc: 'Portail web de divertissement multi-formats' },
              { domain: 'voltop.net', label: 'VOLTOP', desc: 'Flux TV interactifs et médias en continu' },
              { domain: 'vavoo.top', label: 'VAVOO TOP', desc: 'Portail alternatif direct pour web & Smart TV' }
            ].map(({ domain, label, desc }) => (
              <div
                key={domain}
                className="glass rounded-2xl p-4 flex flex-col justify-between border border-white/10 hover:border-cyan-500/40 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-sm text-white group-hover:text-cyan-300 transition-colors font-mono">
                      {label}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 font-mono">
                      {domain}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mb-3">{desc}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="grid grid-cols-4 gap-1 text-[11px]">
                    <button
                      onClick={() => handlePortalLaunch(domain, 'live')}
                      className="py-1.5 px-1 rounded-lg bg-white/5 hover:bg-purple-600/50 text-white font-medium text-center transition flex flex-col items-center gap-0.5"
                      title="Lancer TV Direct sur ce domaine"
                    >
                      <Tv className="w-3.5 h-3.5 text-purple-400" />
                      <span>TV</span>
                    </button>
                    <button
                      onClick={() => handlePortalLaunch(domain, 'movie')}
                      className="py-1.5 px-1 rounded-lg bg-white/5 hover:bg-cyan-600/50 text-white font-medium text-center transition flex flex-col items-center gap-0.5"
                      title="Lancer Films sur ce domaine"
                    >
                      <Film className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Films</span>
                    </button>
                    <button
                      onClick={() => handlePortalLaunch(domain, 'series')}
                      className="py-1.5 px-1 rounded-lg bg-white/5 hover:bg-indigo-600/50 text-white font-medium text-center transition flex flex-col items-center gap-0.5"
                      title="Lancer Séries sur ce domaine"
                    >
                      <Tv2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Séries</span>
                    </button>
                    <button
                      onClick={() => handlePortalLaunch(domain, 'radio')}
                      className="py-1.5 px-1 rounded-lg bg-white/5 hover:bg-amber-600/50 text-white font-medium text-center transition flex flex-col items-center gap-0.5"
                      title="Lancer Radios sur ce domaine"
                    >
                      <Radio className="w-3.5 h-3.5 text-amber-400" />
                      <span>Radios</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      onClick={() => navigate(`/browser?domain=${domain}`)}
                      className="py-1.5 px-2 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-[10px] font-bold text-cyan-200 flex items-center justify-center gap-1 border border-cyan-400/30 transition"
                      title="Ouvrir dans le navigateur dédié"
                    >
                      <Globe className="w-3 h-3 text-cyan-400" />
                      <span>Navigateur</span>
                    </button>

                    <button
                      onClick={() => {
                        addPortalPack(domain);
                        setToastInfo(`Pack complet ${domain.toUpperCase()} (TV, Films, Séries, Radios) activé dans votre bibliothèque !`);
                        setTimeout(() => setToastInfo(null), 3500);
                      }}
                      className="py-1.5 px-2 rounded-lg glass hover:bg-purple-600/30 text-[10px] font-semibold text-purple-200 flex items-center justify-center gap-1 transition border border-purple-500/20"
                    >
                      <Layers className="w-3 h-3 text-purple-400" />
                      <span>Pack (4 sections)</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reprendre la lecture */}
      {continueItems.length > 0 && !search && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Reprendre la lecture</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {continueItems.slice(0, 5).map(({ item, progress }, idx) => (
              <ContentCard
                key={`${item.id}-cont-${idx}`}
                item={item}
                progress={progress}
                onClick={() => handleMediaClick(item)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Mes Favoris */}
      {favoriteItems.length > 0 && !search && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h2 className="text-xl font-bold text-white">Favoris</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {favoriteItems.map((item, idx) => (
              <ContentCard
                key={`${item.id}-fav-${idx}`}
                item={item}
                onClick={() => handleMediaClick(item)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Chaînes TV en direct */}
      {liveChannels.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-bold text-white">TV en direct</h2>
            </div>
            <button
              onClick={() => navigate('/tv')}
              className="text-xs text-purple-300 hover:text-purple-200 font-medium"
            >
              Voir tout ({liveChannels.length}) →
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {liveChannels.slice(0, 5).map((item, idx) => (
              <ContentCard
                key={`${item.id}-live-${idx}`}
                item={item}
                onClick={() => handleMediaClick(item)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Films & VOD */}
      {movies.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold text-white">Films VOD</h2>
            </div>
            <button
              onClick={() => navigate('/movies')}
              className="text-xs text-cyan-300 hover:text-cyan-200 font-medium"
            >
              Voir tout ({movies.length}) →
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {movies.slice(0, 5).map((item, idx) => (
              <ContentCard
                key={`${item.id}-mov-${idx}`}
                item={item}
                onClick={() => handleMediaClick(item)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Séries TV */}
      {seriesList.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tv2 className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-white">Séries TV</h2>
            </div>
            <button
              onClick={() => navigate('/series')}
              className="text-xs text-indigo-300 hover:text-indigo-200 font-medium"
            >
              Voir tout ({seriesList.length}) →
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {seriesList.slice(0, 5).map((item, idx) => (
              <ContentCard
                key={`${item.id}-ser-${idx}`}
                item={item}
                onClick={() => handleMediaClick(item)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Radios en direct */}
      {radios.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-bold text-white">Radios en streaming</h2>
            </div>
            <button
              onClick={() => navigate('/radio')}
              className="text-xs text-indigo-300 hover:text-indigo-200 font-medium"
            >
              Voir tout ({radios.length}) →
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {radios.slice(0, 5).map((item, idx) => (
              <ContentCard
                key={`${item.id}-rad-${idx}`}
                item={item}
                onClick={() => handleMediaClick(item)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {filteredSources.length === 0 && (
        <div className="text-center py-20 glass-strong rounded-3xl p-8 border border-white/10">
          <div className="text-6xl mb-4">📺</div>
          <h3 className="text-xl font-bold text-white mb-2">Aucun contenu trouvé</h3>
          <p className="text-white/60 text-sm max-w-md mx-auto mb-6">
            Ajoutez un flux HLS (m3u8), un lien direct ou rechargez les sources de démonstration.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl font-semibold text-sm transition"
            >
              Ajouter une source
            </button>
            <button
              onClick={loadDemoSources}
              className="px-5 py-2.5 glass hover:bg-white/10 rounded-xl font-medium text-sm transition text-white/90"
            >
              Charger les démos
            </button>
          </div>
        </div>
      )}

      {/* Add Source Modal */}
      <AddSourceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdded={(newItem) => handleMediaClick(newItem)}
      />
    </div>
  );
}

export default Home;
