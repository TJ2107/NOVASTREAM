import React, { useState } from 'react';
import {
  X,
  Plus,
  Loader2,
  Link as LinkIcon,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Tv,
  Film,
  Tv2,
  Radio,
  Globe,
  Layers
} from 'lucide-react';
import { UrlResolver, SUPPORTED_STREAMING_PORTALS } from '../../services/UrlResolver';
import { useAppStore, type MediaItem, type MediaType } from '../../store/useAppStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdded?: (item: MediaItem) => void;
}

export function AddSourceModal({ isOpen, onClose, onAdded }: Props) {
  const { addSource, addMultipleSources, loadDemoSources, addPortalPack } = useAppStore();
  const [url, setUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('live');
  const [selectedPortal, setSelectedPortal] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleResolve = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) {
      setError('Veuillez entrer une adresse URL valide.');
      return;
    }

    setIsResolving(true);
    setError(null);
    setSuccessInfo(null);

    try {
      const result: any = await UrlResolver.resolve(url.trim()).catch(() => ({ type: 'unsupported' as const, url: url.trim() }));

      // If it resolved to multiple items (e.g., M3U playlist file)
      if (result.items && result.items.length > 0) {
        addMultipleSources(result.items);
        setSuccessInfo(`Playlist importée avec succès : ${result.items.length} éléments ajoutés !`);
        setTimeout(() => {
          onClose();
        }, 1500);
        return;
      }

      const finalType = result.type !== 'unsupported' ? result.type : mediaType;
      const newItem: MediaItem = {
        id: `stream-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: finalType,
        title: customTitle.trim() || result.title || (finalType === 'series' ? 'Série TV' : finalType === 'movie' ? 'Film VOD' : finalType === 'radio' ? 'Radio Web' : 'Canal TV Direct'),
        url: result.url || url.trim(),
        logo: result.logo,
        group: result.group || (finalType === 'radio' ? 'Radio' : finalType === 'series' ? 'Séries' : finalType === 'movie' ? 'Films' : 'Personnalisé'),
        category: result.category || (finalType === 'series' || finalType === 'movie' ? 'cinema' : finalType === 'radio' ? 'music' : 'general')
      };

      addSource(newItem);
      onAdded?.(newItem);
      setSuccessInfo('Ajouté à votre bibliothèque avec succès !');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      const newItem: MediaItem = {
        id: `stream-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: mediaType,
        title: customTitle.trim() || 'Flux Personnalisé',
        url: url.trim(),
        group: mediaType === 'radio' ? 'Radio' : mediaType === 'series' ? 'Séries' : mediaType === 'movie' ? 'Films' : 'Personnalisé',
        category: mediaType === 'series' || mediaType === 'movie' ? 'cinema' : mediaType === 'radio' ? 'music' : 'general'
      };
      addSource(newItem);
      onAdded?.(newItem);
      setSuccessInfo('Ajouté à votre bibliothèque avec succès !');
      setTimeout(() => {
        onClose();
      }, 1000);
    } finally {
      setIsResolving(false);
    }
  };

  const handlePortalPackAdd = (domain: string) => {
    const items = addPortalPack(domain);
    setSuccessInfo(`Pack complet ${domain.toUpperCase()} activé (TV, Films, Séries, Radios) !`);
    if (items.length > 0) {
      onAdded?.(items[0]);
    }
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const handlePortalSelectType = (domain: string, type: MediaType) => {
    setUrl(`https://${domain}`);
    setMediaType(type);
    const domainLabel = domain.toUpperCase();
    const typeNames: Record<MediaType, string> = {
      live: 'TV en direct',
      movie: 'Films VOD',
      series: 'Séries TV',
      radio: 'Radios Web'
    };
    setCustomTitle(`${domainLabel} (${typeNames[type]})`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const items = UrlResolver.parseM3U(text);
        if (items.length > 0) {
          addMultipleSources(items);
          setSuccessInfo(`${items.length} chaînes importées depuis ${file.name} !`);
          setTimeout(() => {
            onClose();
          }, 1500);
        } else {
          setError('Aucun canal valide trouvé dans ce fichier .m3u');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl glass-strong p-6 shadow-2xl border border-purple-500/30 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Ajouter une source</h3>
              <p className="text-xs text-white/50">Flux vidéo, audio, HLS m3u8 ou portail web</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Portails Rapides (vavoo.to, voltop.net, kool.ws, oha.to, huhu.to, vavoo.top) */}
        <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-br from-purple-900/25 via-indigo-900/20 to-cyan-900/25 border border-purple-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Portails Multimédia Spéciaux</span>
            </span>
            <span className="text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
              TV • Films • Séries • Radios
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {SUPPORTED_STREAMING_PORTALS.map((portal) => (
              <button
                key={portal}
                type="button"
                onClick={() => setSelectedPortal(selectedPortal === portal ? null : portal)}
                className={`py-1.5 px-2 rounded-lg text-xs font-mono font-medium transition text-center border ${
                  selectedPortal === portal
                    ? 'bg-purple-600 text-white border-purple-400 shadow-lg'
                    : 'glass text-white/80 hover:text-white hover:bg-white/10 border-white/10'
                }`}
              >
                {portal}
              </button>
            ))}
          </div>

          {/* When a portal is clicked: Option to import pack or specific section */}
          {selectedPortal && (
            <div className="p-3 rounded-lg bg-black/40 border border-purple-500/30 space-y-2.5 animate-fade-in text-xs">
              <div className="flex items-center justify-between text-white/90">
                <span className="font-semibold text-cyan-300">Portail : {selectedPortal.toUpperCase()}</span>
                <span className="text-[10px] text-white/50">Choisissez le mode d'intégration</span>
              </div>

              {/* 1-Click All-in-One Pack button */}
              <button
                type="button"
                onClick={() => handlePortalPackAdd(selectedPortal)}
                className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold flex items-center justify-center gap-2 shadow-md transition"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Installer le Pack Complet (TV + Films + Séries + Radios)</span>
              </button>

              <div className="text-[10px] text-white/40 text-center uppercase tracking-wider font-semibold">
                ou charger uniquement une section :
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePortalSelectType(selectedPortal, 'live')}
                  className="py-1.5 px-1 rounded bg-white/5 hover:bg-purple-600/40 border border-white/10 text-white text-[11px] font-medium flex flex-col items-center gap-1 transition"
                >
                  <Tv className="w-3.5 h-3.5 text-purple-400" />
                  <span>TV Direct</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePortalSelectType(selectedPortal, 'movie')}
                  className="py-1.5 px-1 rounded bg-white/5 hover:bg-cyan-600/40 border border-white/10 text-white text-[11px] font-medium flex flex-col items-center gap-1 transition"
                >
                  <Film className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Films</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePortalSelectType(selectedPortal, 'series')}
                  className="py-1.5 px-1 rounded bg-white/5 hover:bg-indigo-600/40 border border-white/10 text-white text-[11px] font-medium flex flex-col items-center gap-1 transition"
                >
                  <Tv2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Séries</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePortalSelectType(selectedPortal, 'radio')}
                  className="py-1.5 px-1 rounded bg-white/5 hover:bg-amber-600/40 border border-white/10 text-white text-[11px] font-medium flex flex-col items-center gap-1 transition"
                >
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  <span>Radios</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content Form */}
        <form onSubmit={handleResolve} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5">
              URL du flux ou de la page
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://exemple.com/live/stream.m3u8"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-purple-500 focus:bg-white/10 outline-none text-sm transition font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                Titre (Optionnel)
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Ex: Mon Canal Favori"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-purple-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">
                Type de média
              </label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as MediaType)}
                className="w-full px-3 py-2 rounded-xl bg-[#141432] border border-white/10 text-white focus:border-purple-500 outline-none text-sm"
              >
                <option value="live">📺 TV en direct</option>
                <option value="movie">🎬 Film / VOD</option>
                <option value="series">📺 Série TV</option>
                <option value="radio">📻 Radio / Audio</option>
              </select>
            </div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successInfo && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successInfo}</span>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isResolving || !url.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-purple-900/40"
          >
            {isResolving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyse du flux en cours...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Ajouter à la bibliothèque</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-4 flex items-center gap-3">
          <div className="h-px bg-white/10 flex-1" />
          <span className="text-[11px] text-white/40 uppercase tracking-wider font-semibold">ou</span>
          <div className="h-px bg-white/10 flex-1" />
        </div>

        {/* Alternative options: M3U file upload & Demo reload */}
        <div className="grid grid-cols-2 gap-3">
          <label className="cursor-pointer flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl glass hover:bg-white/10 text-xs font-medium text-white/90 border border-white/10 transition text-center">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fichier .M3U</span>
            <input
              type="file"
              accept=".m3u,.m3u8,text/plain"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              loadDemoSources();
              setSuccessInfo('Flux de démonstration rechargés !');
              setTimeout(() => onClose(), 1200);
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl glass hover:bg-white/10 text-xs font-medium text-purple-300 border border-purple-500/20 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sources démo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
