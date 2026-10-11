import React, { useState } from 'react';
import {
  Sliders,
  Volume2,
  VolumeX,
  Play,
  Trash2,
  RotateCcw,
  Shield,
  Smartphone,
  Tv,
  CheckCircle2,
  Sparkles,
  Zap,
  Settings as SettingsIcon,
  Activity,
  Radio,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { VPNBadge } from '../components/common/VPNBadge';
import { DnsHelpModal } from '../components/common/DnsHelpModal';

export function SettingsPage() {
  const {
    volume,
    setVolume,
    playerEngine,
    setPlayerEngine,
    audioBoost,
    setAudioBoost,
    audioMode,
    setAudioMode,
    audioEqualizer,
    setAudioEqualizer,
    clearHistory,
    resetAll,
    history,
    sources,
    tvMode,
    setTVMode
  } = useAppStore();

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showDnsHelp, setShowDnsHelp] = useState(false);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleClearHistory = () => {
    if (window.confirm('Voulez-vous vraiment vider tout l\'historique de lecture ?')) {
      clearHistory();
      showToast('Historique de lecture vidé avec succès !');
    }
  };

  const handleResetFactory = () => {
    if (window.confirm('Attention : Cette action va réinitialiser tous les réglages, les listes et restaurer les sources d\'origine. Continuer ?')) {
      resetAll();
      showToast('Réinitialisation aux réglages d\'usine effectuée !');
    }
  };

  return (
    <div className="p-4 md:p-8 pb-28 md:pb-12 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-[#FF5A5F]" />
            <span>Paramètres & Moteur Audio</span>
          </h1>
          <p className="text-white/60 text-xs md:text-sm mt-1">
            Configurez votre lecteur multimédia, ajustez les préréglages audio et gérez vos données locales.
          </p>
        </div>
        <VPNBadge compact />
      </div>

      {/* DNS Help Modal */}
      {showDnsHelp && <DnsHelpModal onClose={() => setShowDnsHelp(false)} />}

      {/* Toast Notification */}
      {statusMessage && (
        <div className="p-3.5 rounded-2xl glass-strong border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-3 shadow-2xl animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="font-medium">{statusMessage}</span>
        </div>
      )}

      {/* Section 1: Audio & Volume Management */}
      <div className="glass-strong rounded-3xl p-6 border border-white/10 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Système de Réglage des Sons & Volume</h2>
            <p className="text-xs text-white/50">Contrôle maître du volume, amplification et préréglages acoustiques.</p>
          </div>
        </div>

        {/* Master Volume Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-white/80 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-purple-400" /> Volume Général (Master)
            </span>
            <span className="font-mono text-purple-300 font-bold bg-purple-600/20 px-2.5 py-1 rounded-lg border border-purple-500/30">
              {Math.round(volume * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
              className="p-2.5 rounded-xl glass hover:bg-white/10 text-white transition"
              title="Couper / Activer le son"
            >
              {volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF5A5F]"
            />
          </div>
        </div>

        {/* Audio Boost Toggle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl glass border border-white/5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block">Amplification Audio (+200%)</span>
              <span className="text-[10px] text-white/40 block">Booste les flux faibles ou mal enregistrés</span>
            </div>
            <button
              onClick={() => setAudioBoost(!audioBoost)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                audioBoost
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'glass text-white/70 hover:text-white'
              }`}
            >
              {audioBoost ? 'ACTIVÉ' : 'Désactivé'}
            </button>
          </div>

          {/* Audio Channels Mode */}
          <div className="p-4 rounded-2xl glass border border-white/5 space-y-2">
            <span className="text-xs font-bold text-white block">Mode Spatial / Canaux Audio</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'stereo', label: 'Stéréo HD' },
                { id: 'surround', label: 'Surround 5.1' },
                { id: 'mono', label: 'Mono / Voix' },
                { id: 'bass_boost', label: 'Bass Boost' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setAudioMode(m.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition ${
                    audioMode === m.id
                      ? 'bg-purple-600 text-white shadow'
                      : 'glass text-white/60 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Equalizer presets */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold text-white/80 block">Égaliseur Acoustique (EQ)</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'flat', label: 'Neutre (Flat)' },
              { id: 'cinema', label: 'Cinéma & Films' },
              { id: 'voice', label: 'Voix & Dialogues' },
              { id: 'music', label: 'Musique & Live' }
            ].map((eq) => (
              <button
                key={eq.id}
                onClick={() => setAudioEqualizer(eq.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition ${
                  audioEqualizer === eq.id
                    ? 'bg-[#FF5A5F] text-white shadow-md'
                    : 'glass text-white/60 hover:text-white'
                }`}
              >
                {eq.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2: Player Engine Choice */}
      <div className="glass-strong rounded-3xl p-6 border border-white/10 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold">
            <Play className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Choix du Lecteur Multimédia (Engine)</h2>
            <p className="text-xs text-white/50">Sélectionnez le moteur de lecture adapté à vos flux HLS, IPTV ou VOD.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              id: 'hls.js',
              title: 'HLS.js Engine (Recommandé)',
              desc: 'Idéal pour les flux M3U8, direct TV et VOD multi-débit avec prise en charge CORS intégrée.'
            },
            {
              id: 'native',
              title: 'HTML5 Native Player',
              desc: 'Lecteur natif ultra-léger pour les fichiers MP4, WebM et formats directs compatibles.'
            },
            {
              id: 'proxy',
              title: 'Proxy CORS / HTTPS-to-HTTP',
              desc: 'Route automatiquement les flux non sécurisés HTTP via le proxy serveur pour contourner les blocages Mixed Content.'
            },
            {
              id: 'iframe',
              title: 'Iframe Embed Fallback',
              desc: 'Mode iframe universel pour les portails web externes et intégrations iFrame tierces.'
            }
          ].map((engine) => (
            <div
              key={engine.id}
              onClick={() => {
                setPlayerEngine(engine.id as any);
                showToast(`Moteur de lecteur défini : ${engine.title}`);
              }}
              className={`p-4 rounded-2xl glass cursor-pointer transition-all border ${
                playerEngine === engine.id
                  ? 'border-cyan-500 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
                  : 'border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-white">{engine.title}</span>
                {playerEngine === engine.id && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                    ACTIF
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed">{engine.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Data Management & Factory Reset */}
      <div className="glass-strong rounded-3xl p-6 border border-white/10 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center font-bold">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Gestion des Données & Réinitialisation</h2>
            <p className="text-xs text-white/50">Nettoyez votre historique ou restaurez l'application à son état d'origine.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl glass border border-white/5 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-xs font-bold text-white mb-1">Historique de Lecture ({history.length} entrées)</h3>
              <p className="text-[11px] text-white/50">Efface l'historique des vidéos et chaînes récemment consultées.</p>
            </div>
            <button
              onClick={handleClearHistory}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center justify-center gap-2 transition border border-white/10"
            >
              <Trash2 className="w-4 h-4 text-amber-400" />
              <span>Vider l'historique</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl glass border border-red-500/20 flex flex-col justify-between space-y-4 bg-red-950/10">
            <div>
              <h3 className="text-xs font-bold text-red-300 mb-1">Réinitialisation Usine</h3>
              <p className="text-[11px] text-white/50">Efface toutes vos listes personnalisées, réglages et restaure les démos.</p>
            </div>
            <button
              onClick={handleResetFactory}
              className="px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition border border-red-500/40"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Réinitialiser aux réglages d'usine</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 4: Assistance */}
      <div className="glass-strong rounded-3xl p-6 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Assistance</h2>
              <p className="text-xs text-white/50">Besoin d'aide avec la configuration DNS ou les connexions ?</p>
            </div>
          </div>
          <button
            onClick={() => setShowDnsHelp(true)}
            className="px-4 py-2.5 rounded-xl glass hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 transition flex items-center gap-2 text-xs font-semibold border border-amber-500/30"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Ouvrir l'Aide DNS</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
