import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Library as LibraryIcon,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Download,
  Upload,
  Play,
  Sparkles,
  RefreshCw,
  FileText,
  AlertCircle,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import { useAppStore, type MediaType, type MediaItem } from '../store/useAppStore';
import { useAudioStore } from '../store/useAudioStore';
import { AddSourceModal } from '../components/common/AddSourceModal';
import { VPNBadge } from '../components/common/VPNBadge';

export function Library() {
  const navigate = useNavigate();
  const {
    sources,
    removeSource,
    exportPlaylists,
    importPlaylists,
    addMultipleSources,
    loadDemoSources,
    resetAll,
    clearHistory
  } = useAppStore();
  const { playTrack } = useAudioStore();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    return sources.filter((item) => {
      const matchType = filterType === 'all' || item.type === filterType;
      const matchSearch =
        !search.trim() ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.url.toLowerCase().includes(search.toLowerCase()) ||
        (item.group && item.group.toLowerCase().includes(search.toLowerCase()));
      return matchType && matchSearch;
    });
  }, [sources, filterType, search]);

  const handleExport = () => {
    const jsonStr = exportPlaylists();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `streambox-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Configuration exportée au format JSON !');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (Array.isArray(parsed.sources)) {
          addMultipleSources(parsed.sources);
          setStatusMessage(`${parsed.sources.length} sources importées avec succès !`);
        } else if (Array.isArray(parsed)) {
          addMultipleSources(parsed);
          setStatusMessage(`${parsed.length} sources importées avec succès !`);
        } else {
          setStatusMessage('Format JSON invalide.');
        }
      } catch (err) {
        setStatusMessage('Erreur lors de la lecture du fichier JSON.');
      }
      setTimeout(() => setStatusMessage(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePlayItem = (item: MediaItem) => {
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

  return (
    <div className="p-4 md:p-8 pb-28 md:pb-12 space-y-6 max-w-7xl mx-auto">
      {/* Header and Quick Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
            <span>📚 Gestion de la Bibliothèque</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-600/20 text-purple-400 font-mono border border-purple-500/30">
              {sources.length} éléments
            </span>
          </h1>
          <p className="text-white/60 text-[10px] md:text-xs mt-1">
            Gérez vos flux multimédia, importez des listes ou sauvegardez votre configuration.
          </p>
        </div>

        {/* Global Toolbar buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <VPNBadge compact />

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-semibold flex items-center gap-1.5 transition shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter une source</span>
          </button>

          <button
            onClick={handleExport}
            className="px-3 py-1.5 rounded-xl glass hover:bg-white/10 text-white text-[10px] font-medium flex items-center gap-1 transition"
            title="Exporter votre bibliothèque au format JSON"
          >
            <Download className="w-3 h-3 text-cyan-400" />
            <span>Exporter JSON</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl glass hover:bg-white/10 text-white text-[10px] font-medium flex items-center gap-1 transition"
            title="Importer une sauvegarde JSON"
          >
            <Upload className="w-3 h-3 text-indigo-400" />
            <span>Importer JSON</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportFile}
            className="hidden"
          />

          <button
            onClick={loadDemoSources}
            className="px-2.5 py-1.5 rounded-xl glass hover:bg-white/10 text-white/70 hover:text-white text-[10px] transition"
            title="Recharger les sources de démonstration"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <div className="p-2 rounded-xl glass-strong border border-purple-500/40 text-[10px] text-purple-200 flex items-center gap-2 shadow-xl animate-fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl glass-strong border border-white/10 text-[10px] text-white placeholder-white/40 focus:border-purple-500 outline-none"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Tout' },
            { id: 'live', label: '📺 TV' },
            { id: 'movie', label: '🎬 Films' },
            { id: 'series', label: '🍿 Séries' },
            { id: 'radio', label: '📻 Radios' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1 rounded-xl text-[10px] font-semibold whitespace-nowrap transition-all ${
                filterType === tab.id
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'glass text-white/70 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))
        }
        </div>
      </div>

      {/* List Table of Media Sources */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 glass-strong rounded-3xl p-6 border border-white/10">
          <FileText className="w-10 h-10 mx-auto mb-2 text-white/30" />
          <h3 className="text-sm font-bold text-white mb-1">Aucun résultat</h3>
          <p className="text-white/60 text-[10px] max-w-xs mx-auto mb-4">
            Aucun élément ne correspond à votre filtre actuel.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-[10px] font-semibold text-white transition"
          >
            Ajouter une nouvelle source
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="glass rounded-xl p-2 flex items-center gap-3 hover:border-purple-500/30 transition-all group"
            >
              {/* Media Thumbnail */}
              <div
                onClick={() => handlePlayItem(item)}
                className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#12122b] to-[#080818] border border-white/10 flex items-center justify-center flex-shrink-0 cursor-pointer overflow-hidden group-hover:scale-105 transition-transform"
              >
                {item.logo || item.poster ? (
                  <img
                    src={item.logo || item.poster}
                    alt=""
                    className="w-full h-full object-contain p-0.5"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-sm">
                    {item.type === 'live' ? '📺' : item.type === 'radio' ? '📻' : '🎬'}
                  </span>
                )}
              </div>

              {/* Title & Metadata */}
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handlePlayItem(item)}>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold truncate text-white group-hover:text-purple-300 transition-colors">
                    {item.title}
                  </h4>
                  <span className="text-[9px] px-1.5 py-0 rounded-full bg-white/5 border border-white/10 text-white/60 font-mono uppercase">
                    {item.type}
                  </span>
                </div>
                <p className="text-[10px] text-white/40 truncate font-mono mt-0.5">{item.url}</p>
                {item.group && (
                  <span className="text-[9px] text-cyan-400 font-medium inline-block mt-0.5">
                    {item.group}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => handlePlayItem(item)}
                  className="p-1.5 rounded-lg glass hover:bg-purple-600 text-white/80 hover:text-white transition"
                  title="Lancer la lecture"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg glass hover:bg-white/10 text-white/60 hover:text-white transition"
                  title="Ouvrir le lien direct dans un nouvel onglet"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => removeSource(item.id)}
                  className="p-1.5 rounded-lg glass hover:bg-red-500/20 text-red-400 hover:text-red-300 transition"
                  title="Supprimer de la bibliothèque"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dangerous Zone: Reset / Clean */}
      <div className="pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-white/50">
        <span>NOVASTREAM ne stocke aucun média et n'héberge aucun serveur. Données stockées localement.</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (window.confirm('Voulez-vous vraiment vider tout l\'historique de lecture ?')) {
                clearHistory();
                setStatusMessage('Historique vidé avec succès !');
                setTimeout(() => setStatusMessage(null), 3000);
              }
            }}
            className="hover:text-white transition underline"
          >
            Vider l'historique
          </button>
          <button
            onClick={() => {
              if (window.confirm('Voulez-vous réinitialiser tous les réglages et sources aux valeurs d\'usine ? Cette action est irréversible.')) {
                resetAll();
                setStatusMessage('Réinitialisation aux réglages d\'usine effectuée !');
                setTimeout(() => setStatusMessage(null), 3000);
              }
            }}
            className="text-red-400 hover:text-red-300 transition underline"
          >
            Réinitialiser aux réglages d'usine
          </button>
        </div>
      </div>

      {/* Add Modal */}
      <AddSourceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}

export default Library;
