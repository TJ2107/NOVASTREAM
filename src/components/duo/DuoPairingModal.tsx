import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tv,
  Smartphone,
  Wifi,
  X,
  Play,
  ArrowRight,
  Sparkles,
  QrCode,
  CheckCircle2,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import { useDuoStore } from '../../store/useDuoStore';
import type { MediaItem } from '../../store/useAppStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentMedia?: MediaItem | null;
  currentTime?: number;
}

export function DuoPairingModal({
  isOpen,
  onClose,
  currentMedia,
  currentTime = 0
}: Props) {
  const navigate = useNavigate();
  const {
    pairingCode,
    isPaired,
    tvDeviceName,
    castToTV,
    pairWithCode,
    generatePairingCode
  } = useDuoStore();

  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCast = () => {
    if (currentMedia) {
      castToTV(currentMedia, currentTime);
      onClose();
      navigate('/duo');
    }
  };

  const handleManualPair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const ok = pairWithCode(inputCode);
    if (ok) {
      setErrorMsg(null);
      if (currentMedia) {
        castToTV(currentMedia, currentTime);
      }
      onClose();
      navigate('/duo');
    } else {
      setErrorMsg('Code invalide. Veuillez entrer un code à 6 chiffres (ex: 582-419).');
    }
  };

  const handleCopyLink = () => {
    const duoUrl = `${window.location.origin}/duo?pair=${pairingCode}`;
    navigator.clipboard?.writeText(duoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl glass-strong border border-indigo-500/30 p-6 md:p-8 text-white shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full glass hover:bg-white/10 text-white/60 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center shadow-lg">
            <Tv className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-white">NOVASTREAM Duo</h3>
              <span className="text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-400/40 px-2 py-0.5 rounded-full">
                MULTI-ÉCRANS
              </span>
            </div>
            <p className="text-xs text-white/60">
              Commencez sur le téléphone, continuez sur la télé.
            </p>
          </div>
        </div>

        {/* Quote banner */}
        <blockquote className="p-3 rounded-2xl bg-black/40 border border-indigo-500/20 text-xs italic text-indigo-200/90 leading-relaxed">
          « Deux écrans, une image, et c'est le téléphone qui pilote. »
        </blockquote>

        {/* Fast Action: Transfer currently playing media right now */}
        {currentMedia && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">Contenu à transférer :</span>
              <span className="font-mono text-cyan-300 font-bold">Reprise à {formatTime(currentTime)}</span>
            </div>
            <div className="font-bold text-sm text-white truncate">
              {currentMedia.title}
            </div>

            <button
              onClick={handleCast}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition transform active:scale-95"
            >
              <Tv className="w-4 h-4" />
              <span>Envoyer immédiatement sur la télé ({tvDeviceName})</span>
            </button>
          </div>
        )}

        {/* Pairing Code Section */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Code de synchronisation Duo :</span>
            </span>
            <button
              onClick={handleCopyLink}
              className="text-xs font-mono text-cyan-300 hover:text-cyan-200 flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié !' : 'Copier lien Duo'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/50 border border-white/10">
            <span className="text-2xl font-black font-mono tracking-widest text-cyan-300">
              {pairingCode}
            </span>
            <button
              onClick={() => generatePairingCode()}
              className="text-xs text-white/50 hover:text-white"
            >
              Générer nouveau
            </button>
          </div>

          {/* Form to enter TV code if pairing from phone */}
          <form onSubmit={handleManualPair} className="flex gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Entrer le code de la télé (ex: 582-419)..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/40 text-xs font-mono outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
            >
              <span>Connecter</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {errorMsg && (
            <p className="text-[11px] text-red-400 font-medium">{errorMsg}</p>
          )}
        </div>

        {/* Footer links */}
        <div className="pt-2 flex justify-between items-center text-xs text-white/50">
          <span>Mode 100% sans fil & synchronisé</span>
          <button
            onClick={() => {
              onClose();
              navigate('/duo');
            }}
            className="text-cyan-400 hover:text-cyan-300 font-bold"
          >
            Ouvrir la page Duo complète →
          </button>
        </div>
      </div>
    </div>
  );
}
