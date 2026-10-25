import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Globe,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  ExternalLink,
  Maximize2,
  Tv,
  Film,
  Tv2,
  Radio,
  Plus,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Shield,
  ShieldCheck,
  X
} from 'lucide-react';
import { useAppStore, type MediaType } from '../store/useAppStore';
import { DnsHelpModal } from '../components/common/DnsHelpModal';

interface PortalInfo {
  domain: string;
  name: string;
  desc: string;
  badgeColor: string;
  ipHint?: string;
}

const PORTAL_LIST: PortalInfo[] = [
  { domain: 'vavoo.to', name: 'VAVOO', desc: 'Portail IPTV & multimédia universel', badgeColor: 'border-pink-500/40 text-pink-300', ipHint: '131.123.43.89' },
  { domain: 'vavoo.top', name: 'VAVOO TOP', desc: 'Miroir alternatif actif (souvent non bloqué par les FAI)', badgeColor: 'border-purple-500/40 text-purple-300', ipHint: '80.96.112.16' },
  { domain: 'oha.to', name: 'OHA', desc: 'Portail de streaming TV, films et séries', badgeColor: 'border-cyan-500/40 text-cyan-300', ipHint: '131.123.43.217' },
  { domain: 'oha.cx', name: 'OHA CX', desc: 'Miroir alternatif actif OHA', badgeColor: 'border-cyan-500/40 text-cyan-300', ipHint: '131.123.43.218' },
  { domain: 'huhu.to', name: 'HUHU', desc: 'Catalogue TV direct et chaînes en ligne', badgeColor: 'border-emerald-500/40 text-emerald-300', ipHint: '131.123.43.88' },
  { domain: 'huhu.bz', name: 'HUHU BZ', desc: 'Miroir alternatif actif HUHU', badgeColor: 'border-emerald-500/40 text-emerald-300', ipHint: '131.123.43.89' },
  { domain: 'kool.ws', name: 'KOOL', desc: 'Portail web de divertissement multi-formats', badgeColor: 'border-amber-500/40 text-amber-300', ipHint: '80.96.112.128' },
  { domain: 'voltop.net', name: 'VOLTOP', desc: 'Flux TV interactifs et médias en continu', badgeColor: 'border-indigo-500/40 text-indigo-300', ipHint: '131.123.43.89' }
];

export function PortalBrowser() {
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const navigate = useNavigate();
  const { addPortalPack, addSource, tvMode, vpnEnabled, vpnServer, toggleVPN } = useAppStore();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initial domain from URL query params or default to huhu.bz
  const queryDomain = searchParams.get('url') || searchParams.get('domain') || 'huhu.bz';
  const queryCategory = (searchParams.get('category') as MediaType) || 'live';

  const [currentDomain, setCurrentDomain] = useState<string>(queryDomain);
  const [inputUrl, setInputUrl] = useState<string>(queryDomain);
  const [activeCategory, setActiveCategory] = useState<MediaType | 'portal'>(queryCategory || 'portal');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDnsHelp, setShowDnsHelp] = useState(false);

  // Sync state if URL query params change
  useEffect(() => {
    const d = searchParams.get('domain') || searchParams.get('url');
    if (d && d !== currentDomain) {
      setCurrentDomain(d);
      setInputUrl(d);
    }
  }, [searchParams, currentDomain]);

  const fullUrl = useMemo(() => {
    const raw = currentDomain.trim();
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw;
    }
    return `https://${raw}`;
  }, [currentDomain]);

  const activePortalInfo = useMemo(() => {
    return PORTAL_LIST.find((p) => fullUrl.includes(p.domain)) || {
      domain: currentDomain,
      name: currentDomain.toUpperCase(),
      desc: 'Portail Multimédia Web',
      badgeColor: 'border-cyan-500/40 text-cyan-300'
    };
  }, [fullUrl, currentDomain]);

  const handleNavigateDomain = (domain: string, category: MediaType | 'portal' = 'portal') => {
    setCurrentDomain(domain);
    setInputUrl(domain);
    setActiveCategory(category);
    navigate(`?domain=${encodeURIComponent(domain)}&category=${encodeURIComponent(category)}`, { replace: true });
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 800);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    
    // Support full URLs
    let urlToNavigate = inputUrl.trim();
    if (!urlToNavigate.startsWith('http://') && !urlToNavigate.startsWith('https://')) {
      urlToNavigate = `https://${urlToNavigate}`;
    }
    
    handleNavigateDomain(urlToNavigate, 'portal');
  };

  const handleReload = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      const src = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = src;
          setIsLoading(false);
        }
      }, 200);
    }
  };

  const handleFullscreen = () => {
    const c = containerRef.current;
    if (!c) return;
    if (!document.fullscreenElement) {
      c.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleAddPack = () => {
    addPortalPack(activePortalInfo.domain);
    setToastMessage(`Pack complet ${activePortalInfo.name} ajouté (TV Direct, Films, Séries, Radios) !`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [isTopBarRetracted, setIsTopBarRetracted] = useState(false);

  const handleSendToApp = (type: MediaType) => {
    const typeTitles: Record<MediaType, string> = {
      live: 'TV en direct',
      movie: 'Films VOD',
      series: 'Séries TV',
      radio: 'Radios Web'
    };
    const cleanHost = activePortalInfo.domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
    const item = {
      id: `portal-${cleanHost.replace(/[^a-zA-Z0-9]/g, '-')}-${type}`,
      type,
      title: `${activePortalInfo.name} (${typeTitles[type]})`,
      url: fullUrl,
      group: 'Portails Multimédia',
      category: type === 'radio' ? ('music' as const) : type === 'movie' ? ('cinema' as const) : ('general' as const),
      description: `Accès direct ${typeTitles[type]} depuis le portail ${cleanHost}.`
    };
    addSource(item);

    // Retract address bar & header to maximize viewing space as requested
    setIsTopBarRetracted(true);

    if (type === 'live') {
      navigate(`/tv/${item.id}`);
    } else if (type === 'series') {
      navigate(`/series/${item.id}`);
    } else if (type === 'movie') {
      navigate(`/movies/${item.id}`);
    } else {
      navigate('/radio');
    }
  };

  return (
    <div
      ref={containerRef}
      className={`h-[calc(100vh-4rem)] md:h-screen w-full flex flex-col bg-[#070716] text-white select-none relative overflow-hidden ${
        tvMode ? 'tv-mode' : ''
      }`}
    >
      {/* Retraction toggle floating tab when retracted */}
      {isTopBarRetracted && (
        <button
          type="button"
          onClick={() => setIsTopBarRetracted(false)}
          className="absolute top-2 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-cyan-600/90 hover:bg-cyan-500 text-white text-[10px] font-bold shadow-lg border border-cyan-400/50 flex items-center gap-1.5 transition cursor-pointer animate-bounce"
          title="Afficher la barre d'adresse et le header"
        >
          <span>▼ Afficher la barre d'adresse & le header</span>
        </button>
      )}

      {/* Top Browser Command Bar (Retractable upwards) */}
      <div className={`glass-strong border-b border-purple-500/20 px-3 py-2.5 flex flex-col gap-2 z-20 shadow-xl flex-shrink-0 transition-all duration-300 ease-in-out ${
        isTopBarRetracted ? '-translate-y-full opacity-0 pointer-events-none h-0 py-0 overflow-hidden border-0' : 'translate-y-0 opacity-100'
      }`}>
        <div className="flex items-center justify-between gap-2.5">
          {/* Brand & History Controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl glass hover:bg-white/10 text-white/80 hover:text-white transition"
              title="Retour à l'accueil"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleReload}
              className={`p-2 rounded-xl glass hover:bg-white/10 text-white/80 hover:text-white transition ${
                isLoading ? 'animate-spin text-cyan-400' : ''
              }`}
              title="Recharger le portail"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-white/10">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-extrabold text-xs tracking-wider text-white font-mono">
                NAVIGATEUR PORTAILS
              </span>
            </div>
          </div>

          {/* Interactive URL Input Bar */}
          <form onSubmit={handleUrlSubmit} className="flex-1 max-w-2xl relative">
            <div className="relative flex items-center">
              <Globe className="absolute left-3 w-4 h-4 text-cyan-400 pointer-events-none" />
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Entrez une URL (ex: google.com, wikipedia.org, etc.)"
                className="w-full pl-9 pr-24 py-2 rounded-xl bg-black/50 border border-purple-500/30 text-white placeholder-white/30 text-xs md:text-sm font-mono focus:border-cyan-400 outline-none transition shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition"
              >
                Aller
              </button>
            </div>
          </form>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* 1-Tap Swiss VPN Shield Button */}
            <button
              onClick={toggleVPN}
              className={`px-2.5 py-1.5 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold border ${
                vpnEnabled
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300 shadow-sm'
                  : 'glass border-white/10 text-white/60 hover:text-white'
              }`}
              title="« Un tap, et votre connexion est chiffrée : au café, à l'hôtel, dans le train. Changez de pays, passez les blocages. Serveurs suisses, pas de logs, pas de bridage. »"
            >
              <Shield className={`w-3.5 h-3.5 ${vpnEnabled ? 'text-emerald-400' : 'text-white/50'}`} />
              <span className="hidden sm:inline">
                {vpnEnabled ? `${vpnServer.flag} VPN Chiffré` : '1-Tap VPN'}
              </span>
            </button>

            <button
              onClick={handleAddPack}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md transition"
              title="Installer ce domaine dans toutes les 4 catégories"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Pack Complet</span>
            </button>

            <button
              onClick={handleFullscreen}
              className="p-2 rounded-xl glass hover:bg-white/10 text-white/80 hover:text-white transition"
              title="Plein écran"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl glass hover:bg-white/10 text-cyan-400 hover:text-cyan-300 transition"
              title="Ouvrir dans un nouvel onglet externe"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* 2nd Row: Quick Domain Switchers + 4 Categories Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5">
          {/* Quick Domain Pills */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider mr-1 hidden sm:inline">
              Miroirs :
            </span>
            {PORTAL_LIST.map((p) => {
              const isActive = fullUrl.includes(p.domain);
              return (
                <button
                  key={p.domain}
                  onClick={() => handleNavigateDomain(p.domain, activeCategory)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all whitespace-nowrap border ${
                    isActive
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-900/30 font-bold scale-105'
                      : 'glass hover:bg-white/10 text-white/70 hover:text-white border-white/5'
                  }`}
                  title={`${p.name} (${p.domain})`}
                >
                  {p.domain}
                </button>
              );
            })}
          </div>

          {/* 4 Multi-dimensional Categories Router */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider mr-1 hidden md:inline">
              Diffuser vers :
            </span>

            <button
              onClick={() => handleSendToApp('live')}
              className="px-2.5 py-1 rounded-lg glass hover:bg-purple-600/40 border border-purple-500/30 text-purple-200 text-xs font-medium flex items-center gap-1 transition"
              title="Ouvrir dans le lecteur TV en direct"
            >
              <Tv className="w-3.5 h-3.5 text-purple-400" />
              <span>TV</span>
            </button>

            <button
              onClick={() => handleSendToApp('movie')}
              className="px-2.5 py-1 rounded-lg glass hover:bg-cyan-600/40 border border-cyan-500/30 text-cyan-200 text-xs font-medium flex items-center gap-1 transition"
              title="Ouvrir dans le lecteur Films"
            >
              <Film className="w-3.5 h-3.5 text-cyan-400" />
              <span>Films</span>
            </button>

            <button
              onClick={() => handleSendToApp('series')}
              className="px-2.5 py-1 rounded-lg glass hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-200 text-xs font-medium flex items-center gap-1 transition"
              title="Ouvrir dans le catalogue Séries"
            >
              <Tv2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Séries</span>
            </button>

            <button
              onClick={() => handleSendToApp('radio')}
              className="px-2.5 py-1 rounded-lg glass hover:bg-amber-600/40 border border-amber-500/30 text-amber-200 text-xs font-medium flex items-center gap-1 transition"
              title="Ouvrir dans la section Radios"
            >
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              <span>Radios</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-24 right-4 z-40 p-3 rounded-xl glass-strong border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 shadow-2xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* DNS Diagnostic & Help Modal */}
      {showDnsHelp && (
        <DnsHelpModal
          onClose={() => setShowDnsHelp(false)}
          onReload={handleReload}
          handleNavigateDomain={handleNavigateDomain}
        />
      )}

      {/* Main Interactive Browser Viewport */}
      <div className="flex-1 w-full h-full relative bg-black flex flex-col overflow-hidden">
        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-cyan-400 to-indigo-500 animate-pulse z-30" />
        )}

        {/* Portal Information Hint Bar */}
        <div className="bg-[#09091e] px-4 py-1.5 flex items-center justify-between text-[11px] border-b border-white/5 text-white/60">
          <div className="flex items-center gap-2 min-w-0 truncate">
            <span className="text-cyan-400 font-mono font-bold">{activePortalInfo.domain}</span>
            <span>—</span>
            <span className="truncate">{activePortalInfo.desc}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowDnsHelp(true)}
              className="text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1 transition"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Erreur IP ? Voir l'aide DNS</span>
            </button>
          </div>
        </div>

        {/* Full-Feature Web Viewframe (Proxied through /proxy if HTTP to bypass Mixed Content) */}
        <iframe
          ref={iframeRef}
          key={fullUrl}
          src={fullUrl.startsWith('http://') && typeof window !== 'undefined' && window.location.protocol === 'https:' ? `/proxy?url=${encodeURIComponent(fullUrl)}` : fullUrl}
          className="w-full flex-1 border-0 bg-black min-h-0"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write; display-capture"
          allowFullScreen
          title={`Portail ${activePortalInfo.name}`}
        />
      </div>
    </div>
  );
}

export default PortalBrowser;
