import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Tv,
  Smartphone,
  Layers,
  Wifi,
  Sparkles,
  Share2,
  Copy,
  Check,
  RotateCcw,
  Play,
  ArrowRight,
  ShieldCheck,
  Sliders,
  CheckCircle2,
  Maximize2,
  Users,
  MessageSquare
} from 'lucide-react';
import { useDuoStore, type DuoRole } from '../store/useDuoStore';
import { useWatchPartyStore } from '../store/useWatchPartyStore';
import { DuoTVDisplay } from '../components/duo/DuoTVDisplay';
import { DuoRemoteControl } from '../components/duo/DuoRemoteControl';
import { WatchPartyModal } from '../components/duo/WatchPartyModal';
import { useAppStore } from '../store/useAppStore';

export function DuoPage() {
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const {
    mode,
    setMode,
    pairingCode,
    isPaired,
    tvDeviceName,
    phoneDeviceName,
    transferLogs,
    pairWithCode,
    generatePairingCode
  } = useDuoStore();

  const { joinRoom } = useWatchPartyStore();
  const { sources } = useAppStore();

  const [activeTab, setActiveTab] = useState<'split' | 'phone' | 'tv' | 'guide'>(
    (searchParams.get('tab') as any) || 'split'
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [showWatchParty, setShowWatchParty] = useState(false);

  // Handle URL pair or room params
  useEffect(() => {
    const pairQuery = searchParams.get('pair');
    if (pairQuery) {
      pairWithCode(pairQuery);
    }
    const roomQuery = searchParams.get('room');
    if (roomQuery) {
      joinRoom(roomQuery);
      setShowWatchParty(true);
    }
  }, [location.search]);

  // In Simulator mode, auto-pair phone and TV so the simulator experience is immediate & seamless
  useEffect(() => {
    if (activeTab === 'split' && !isPaired) {
      pairWithCode(pairingCode);
    }
  }, [activeTab, isPaired, pairingCode, pairWithCode]);

  const handleCopyPairLink = () => {
    const link = `${window.location.origin}/duo?pair=${pairingCode}&tab=phone`;
    navigator.clipboard?.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="p-4 md:p-8 pb-32 md:pb-16 max-w-7xl mx-auto space-y-8 select-none">
      {/* Hero Header */}
      <div className="relative rounded-2xl md:rounded-3xl overflow-hidden glass-strong border border-indigo-500/30 p-5 md:p-10 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-[#0b0b24]/60 to-purple-950/30 pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-3 md:space-y-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-950/80 border border-red-500/40 text-[10px] font-bold text-red-300 font-mono shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#E50914] animate-ping" />
            <span>NOVASTREAM DUO • CONTINUITÉ</span>
          </div>

          <h1 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight flex flex-wrap items-center justify-center text-center w-full gap-2.5">
            <span>NOVASTREAM DUO</span>
          </h1>

          <blockquote className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-black/40 border border-indigo-500/30 text-white/95 text-[11px] md:text-sm leading-relaxed font-semibold italic backdrop-blur-md shadow-inner space-y-1.5 md:space-y-2">
            <p className="font-bold text-cyan-300 not-italic text-xs md:text-base">
              « Regardez ensemble. Où que vous soyez. »
            </p>
            <p>
              Des amis, des chats et des watch partys, directement dans l'app. Ce que tu regardes devient quelque chose que vous partagez, sur téléphone, télé et ordinateur.
            </p>
          </blockquote>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
            <button
              onClick={() => setShowWatchParty(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold text-[11px] flex items-center justify-center gap-2 shadow-xl shadow-indigo-900/50 transition transform active:scale-95"
            >
              <Users className="w-3.5 h-3.5 text-amber-300" />
              <span>Watch Party avec amis 🍿</span>
            </button>

            <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center gap-2 text-[10px] font-mono">
                  <span className="text-white/40">Code :</span>
                  <span className="text-cyan-300 font-bold text-xs tracking-wider">{pairingCode}</span>
                </div>

                <button
                  onClick={handleCopyPairLink}
                  className="px-3 py-2 rounded-xl glass hover:bg-white/10 text-white text-[10px] font-semibold flex items-center gap-1.5 transition"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 États Mode Duo - Tab Controls Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white/60">
              Modes & Affichages Duo
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono self-start sm:self-auto">
            <span className={`w-2.5 h-2.5 rounded-full ${isPaired ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-white/70">
              {isPaired ? 'Liaison Duo synchronisée' : 'En attente de connexion'}
            </span>
          </div>
        </div>

        {/* Grille des 4 icônes d'état structurées */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3.5 w-full">
          {/* État 1 : Simulateur Duo */}
          <button
            type="button"
            onClick={() => setActiveTab('split')}
            className={`group relative p-3 md:p-3.5 rounded-2xl text-left transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center gap-3 border ${
              activeTab === 'split'
                ? 'bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-black/80 border-indigo-400/80 shadow-lg shadow-indigo-950/60 ring-1 ring-indigo-400/30'
                : 'glass hover:bg-white/[0.08] border-white/10 hover:border-white/20'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 border ${
              activeTab === 'split'
                ? 'bg-cyan-500/25 border-cyan-400/50 text-cyan-300 shadow-md shadow-cyan-950/50'
                : 'bg-white/5 border-white/10 text-cyan-400 group-hover:text-cyan-300'
            }`}>
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className={`text-xs md:text-sm font-extrabold truncate block ${
                  activeTab === 'split' ? 'text-white' : 'text-white/85 group-hover:text-white'
                }`}>
                  Simulateur Duo
                </span>
                {activeTab === 'split' && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
                )}
              </div>
              <span className="text-[10px] text-white/50 block truncate">
                Double écran interactif
              </span>
            </div>
          </button>

          {/* État 2 : Mode Téléphone */}
          <button
            type="button"
            onClick={() => setActiveTab('phone')}
            className={`group relative p-3 md:p-3.5 rounded-2xl text-left transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center gap-3 border ${
              activeTab === 'phone'
                ? 'bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-black/80 border-indigo-400/80 shadow-lg shadow-indigo-950/60 ring-1 ring-indigo-400/30'
                : 'glass hover:bg-white/[0.08] border-white/10 hover:border-white/20'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 border ${
              activeTab === 'phone'
                ? 'bg-purple-500/25 border-purple-400/50 text-purple-300 shadow-md shadow-purple-950/50'
                : 'bg-white/5 border-white/10 text-purple-400 group-hover:text-purple-300'
            }`}>
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className={`text-xs md:text-sm font-extrabold truncate block ${
                  activeTab === 'phone' ? 'text-white' : 'text-white/85 group-hover:text-white'
                }`}>
                  Mode Téléphone
                </span>
                {activeTab === 'phone' && (
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping shrink-0" />
                )}
              </div>
              <span className="text-[10px] text-white/50 block truncate">
                Télécommande pilote
              </span>
            </div>
          </button>

          {/* État 3 : Mode Écran TV */}
          <button
            type="button"
            onClick={() => setActiveTab('tv')}
            className={`group relative p-3 md:p-3.5 rounded-2xl text-left transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center gap-3 border ${
              activeTab === 'tv'
                ? 'bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-black/80 border-indigo-400/80 shadow-lg shadow-indigo-950/60 ring-1 ring-indigo-400/30'
                : 'glass hover:bg-white/[0.08] border-white/10 hover:border-white/20'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 border ${
              activeTab === 'tv'
                ? 'bg-indigo-500/25 border-indigo-400/50 text-indigo-300 shadow-md shadow-indigo-950/50'
                : 'bg-white/5 border-white/10 text-indigo-400 group-hover:text-indigo-300'
            }`}>
              <Tv className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className={`text-xs md:text-sm font-extrabold truncate block ${
                  activeTab === 'tv' ? 'text-white' : 'text-white/85 group-hover:text-white'
                }`}>
                  Mode Écran TV
                </span>
                {activeTab === 'tv' && (
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping shrink-0" />
                )}
              </div>
              <span className="text-[10px] text-white/50 block truncate">
                Grand écran salon
              </span>
            </div>
          </button>

          {/* État 4 : Guide */}
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`group relative p-3 md:p-3.5 rounded-2xl text-left transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center gap-3 border ${
              activeTab === 'guide'
                ? 'bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-black/80 border-indigo-400/80 shadow-lg shadow-indigo-950/60 ring-1 ring-indigo-400/30'
                : 'glass hover:bg-white/[0.08] border-white/10 hover:border-white/20'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 border ${
              activeTab === 'guide'
                ? 'bg-amber-500/25 border-amber-400/50 text-amber-300 shadow-md shadow-amber-950/50'
                : 'bg-white/5 border-white/10 text-amber-400 group-hover:text-amber-300'
            }`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className={`text-xs md:text-sm font-extrabold truncate block ${
                  activeTab === 'guide' ? 'text-white' : 'text-white/85 group-hover:text-white'
                }`}>
                  Guide & Astuces
                </span>
                {activeTab === 'guide' && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                )}
              </div>
              <span className="text-[10px] text-white/50 block truncate">
                Tutoriel continuité
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Tab Views */}

      {/* TAB 1: DUO SPLIT SCREEN SIMULATOR */}
      {activeTab === 'split' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-lg">💡</span>
              <span className="text-white/80">
                <strong>Testez l'expérience Duo & Watch Party :</strong> Touchez les boutons sur le smartphone à gauche (Lecture, Pause, Avance +10s, Volume, D-Pad), ou lancez une Watch Party pour inviter vos amis en direct !
              </span>
            </div>
            <button
              onClick={() => setShowWatchParty(true)}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono text-xs font-bold hover:bg-cyan-500/30 transition flex items-center gap-1.5 flex-shrink-0"
            >
              <Users className="w-3.5 h-3.5" /> Ouvrir Watch Party
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Screen 2: Smartphone Remote */}
            <div className="lg:col-span-4 flex flex-col items-center">
              <div className="mb-2 text-center">
                <span className="text-xs uppercase font-extrabold tracking-wider text-cyan-400 flex items-center gap-1.5 justify-center">
                  <Smartphone className="w-4 h-4" />
                  <span>Écran 2 : Le Téléphone Pilote</span>
                </span>
                <p className="text-[11px] text-white/50">C'est lui qui pilote la télévision</p>
              </div>
              <DuoRemoteControl />
            </div>

            {/* Screen 1: TV Display */}
            <div className="lg:col-span-8 flex flex-col">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Tv className="w-4 h-4" />
                  <span>Écran 1 : La Télévision du Salon</span>
                </span>
                <span className="text-[11px] text-white/50">Récepteur synchronisé en continu</span>
              </div>
              <DuoTVDisplay />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PHONE REMOTE ONLY */}
      {activeTab === 'phone' && (
        <div className="flex flex-col items-center justify-center py-6 space-y-6">
          <div className="text-center max-w-md space-y-1">
            <h2 className="text-2xl font-black text-white">Télécommande Mobile NOVASTREAM</h2>
            <p className="text-xs text-white/60">
              Contrôlez votre téléviseur à distance. Les commandes envoyées sont transmises en temps réel.
            </p>
          </div>
          <DuoRemoteControl />
        </div>
      )}

      {/* TAB 3: TV RECEIVER ONLY */}
      {activeTab === 'tv' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Écran Téléviseur Plein Format</h2>
              <p className="text-xs text-white/50">
                Laissez cet écran ouvert sur votre TV ou écran secondaire.
              </p>
            </div>
          </div>
          <DuoTVDisplay fullScreenPage />
        </div>
      )}

      {/* TAB 4: GUIDE */}
      {activeTab === 'guide' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-strong rounded-3xl p-6 border border-white/10 space-y-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-cyan-600/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 font-black text-sm md:text-lg">
              1
            </div>
            <h3 className="text-base font-bold text-white">Démarrez sur le téléphone</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Lancez un film, une série ou un flux TV sur votre mobile dans les transports, à l'hôtel ou au lit.
              Votre position exacte dans la vidéo est conservée à la seconde près.
            </p>
          </div>

          <div className="glass-strong rounded-3xl p-6 border border-white/10 space-y-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-indigo-600/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 font-black text-sm md:text-lg">
              2
            </div>
            <h3 className="text-base font-bold text-white">Passez sur la télé en 1 tap</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Arrivé devant votre télévision, appuyez sur « Duo TV » : la vidéo se transfère immédiatement sur grand écran.
              Pas de temps de chargement, la reprise s'effectue au même instant précis.
            </p>
          </div>

          <div className="glass-strong rounded-3xl p-6 border border-white/10 space-y-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-purple-600/20 border border-purple-400/40 flex items-center justify-center text-purple-400 font-black text-sm md:text-lg">
              3
            </div>
            <h3 className="text-base font-bold text-white">Watch Party avec des amis</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Regardez ensemble où que vous soyez. Chat en direct, réactions emoji et synchronisation parfaite
              sur téléphone, télé et ordinateur sans installation.
            </p>
          </div>
        </div>
      )}

      {/* Transfer History Logs Section */}
      <div className="glass-strong rounded-3xl p-6 md:p-8 border border-white/10 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-cyan-400" />
          <span>Journal des continuités d'écran Duo</span>
        </h3>

        {transferLogs.length === 0 ? (
          <div className="p-4 rounded-2xl bg-black/30 border border-white/5 text-center text-xs text-white/40">
            Aucun transfert récent. Utilisez le bouton « Envoyer sur la télé » ou « Reprendre le film sur mon téléphone » pour tester.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {transferLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-base">
                    {log.from === 'phone' ? '📲 ➔ 📺' : '📺 ➔ 📲'}
                  </span>
                  <div>
                    <span className="font-bold text-white block">{log.title}</span>
                    <span className="text-[10px] text-white/50">
                      {log.from === 'phone' ? 'Transféré du téléphone vers la télé' : 'Repris sur le téléphone'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-cyan-300">{log.timeFormatted}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Watch Party Modal */}
      {showWatchParty && (
        <WatchPartyModal isOpen={showWatchParty} onClose={() => setShowWatchParty(false)} />
      )}
    </div>
  );
}

export default DuoPage;
