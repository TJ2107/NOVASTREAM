import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Smartphone,
  Play,
  Pause,
  FastForward,
  Rewind,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Tv,
  ArrowRight,
  Wifi,
  Film,
  Layers,
  Radio,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { useDuoStore } from '../../store/useDuoStore';
import { useAppStore, type MediaItem } from '../../store/useAppStore';
import { DuoMediaSelectorModal } from './DuoMediaSelectorModal';

export function DuoRemoteControl() {
  const navigate = useNavigate();
  const {
    activeMedia,
    playback,
    isPaired,
    pairingCode,
    tvDeviceName,
    phoneDeviceName,
    sendRemoteAction,
    pullToPhone,
    castToTV
  } = useDuoStore();

  const { sources } = useAppStore();
  const [feedbackEffect, setFeedbackEffect] = useState<string | null>(null);
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);

  const triggerHaptic = (btnName: string) => {
    setFeedbackEffect(btnName);
    setTimeout(() => setFeedbackEffect(null), 300);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    sendRemoteAction('seek', val);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    sendRemoteAction('volume', val);
  };

  const handlePullToPhone = () => {
    const pulled = pullToPhone();
    if (pulled) {
      if (pulled.media.type === 'live') {
        navigate(`/tv/${pulled.media.id}`);
      } else if (pulled.media.type === 'series') {
        navigate(`/series/${pulled.media.id}`);
      } else {
        navigate(`/movies/${pulled.media.id}`);
      }
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleNextChannel = () => {
    const channels = sources.filter((s) => s.type === 'live' || s.group?.includes('Portail'));
    if (channels.length === 0) return;
    const currentIdx = channels.findIndex((s) => s.id === activeMedia?.id);
    const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % channels.length;
    const nextItem = channels[nextIdx];
    if (nextItem) {
      castToTV(nextItem, 0);
      triggerHaptic(`CH+ : ${nextItem.title}`);
    }
  };

  const handlePrevChannel = () => {
    const channels = sources.filter((s) => s.type === 'live' || s.group?.includes('Portail'));
    if (channels.length === 0) return;
    const currentIdx = channels.findIndex((s) => s.id === activeMedia?.id);
    const prevIdx = currentIdx === -1 ? 0 : (currentIdx - 1 + channels.length) % channels.length;
    const prevItem = channels[prevIdx];
    if (prevItem) {
      castToTV(prevItem, 0);
      triggerHaptic(`CH- : ${prevItem.title}`);
    }
  };

  const currentMediaTitle = activeMedia?.title || 'Big Buck Bunny (Full Movie)';
  const currentDuration = playback.duration || 596;

  return (
    <div className="relative mx-auto w-full max-w-[340px] rounded-[44px] p-4 bg-gradient-to-b from-[#181830] via-[#0d0d22] to-[#070714] border-4 border-cyan-500/30 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(6,182,212,0.15)] flex flex-col justify-between text-white select-none">
      {/* Smartphone Top Speaker & Camera Notch */}
      <div className="flex items-center justify-between px-3 pt-1 pb-3 border-b border-white/10">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-300">
          <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold tracking-wider">DUO PILOTE</span>
        </div>

        {/* Notch */}
        <div className="w-20 h-4 rounded-full bg-black/80 border border-white/10 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-cyan-500/40" />
        </div>

        <div className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${isPaired ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-[10px] font-mono text-white/50">{isPaired ? 'EN DIRECT' : 'PAIR'}</span>
        </div>
      </div>

      {/* Connection Indicator Bar */}
      <div className="mt-2.5 px-3 py-1.5 rounded-2xl bg-indigo-950/60 border border-indigo-400/30 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 min-w-0">
          <Tv className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
          <span className="font-bold truncate text-indigo-200">{tvDeviceName}</span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1 flex-shrink-0">
          <Wifi className="w-3 h-3" /> Connecté
        </span>
      </div>

      {/* Mini Screen Preview (What is currently playing on the TV) */}
      <div className="mt-3 p-3 rounded-2xl bg-black/60 border border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">En cours sur la télé</span>
          <span className="text-[10px] font-mono text-white/50">{playback.quality}</span>
        </div>

        <div className="font-bold text-xs truncate text-white/90">
          {currentMediaTitle}
        </div>

        {/* Bouton direct : Changer de chaîne & sites */}
        <button
          onClick={() => setIsMediaSelectorOpen(true)}
          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-extrabold text-[11px] flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/40 border border-cyan-400/40 transition active:scale-95"
          title="Ouvrir la liste de toutes les chaînes, films et sites web"
        >
          <Tv className="w-3.5 h-3.5 text-cyan-300" />
          <span>Changer de chaîne & sites</span>
          <Sparkles className="w-3 h-3 text-amber-300" />
        </button>

        {/* Scrubbable Seek Bar */}
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={currentDuration}
            step={1}
            value={playback.currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] font-mono text-white/50">
            <span>{formatTime(playback.currentTime)}</span>
            <span>{formatTime(currentDuration)}</span>
          </div>
        </div>
      </div>

      {/* Primary Big Tactile Play / Pause Controller */}
      <div className="my-3 flex items-center justify-center gap-3">
        <button
          onClick={() => {
            triggerHaptic('skip-back');
            sendRemoteAction('skip', -10);
          }}
          className="w-11 h-11 rounded-2xl glass hover:bg-white/10 active:scale-90 transition flex flex-col items-center justify-center text-white/80"
          title="Reculer de 10s"
        >
          <Rewind className="w-4 h-4" />
          <span className="text-[8px] font-mono mt-0.5">-10s</span>
        </button>

        {/* Big Central Play / Pause */}
        <button
          onClick={() => {
            triggerHaptic('play');
            sendRemoteAction('togglePlay');
          }}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all transform active:scale-95 shadow-2xl border-2 ${
            playback.isPlaying
              ? 'bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 border-cyan-300 text-white shadow-cyan-500/40'
              : 'bg-[#1e1e3e] border-white/20 text-white/50 hover:text-white'
          }`}
          title={playback.isPlaying ? 'Mettre en pause' : 'Lancer la lecture'}
        >
          {playback.isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
        </button>

        <button
          onClick={() => {
            triggerHaptic('skip-fwd');
            sendRemoteAction('skip', 10);
          }}
          className="w-11 h-11 rounded-2xl glass hover:bg-white/10 active:scale-90 transition flex flex-col items-center justify-center text-white/80"
          title="Avancer de 10s"
        >
          <FastForward className="w-4 h-4" />
          <span className="text-[8px] font-mono mt-0.5">+10s</span>
        </button>
      </div>

      {/* Tactile Volume Slider & Mute */}
      <div className="px-3 py-2 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-2.5">
        <button
          onClick={() => {
            triggerHaptic('mute');
            sendRemoteAction('mute');
          }}
          className="text-white/70 hover:text-white"
        >
          {playback.isMuted || playback.volume === 0 ? (
            <VolumeX className="w-4 h-4 text-red-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-cyan-400" />
          )}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={playback.isMuted ? 0 : playback.volume}
          onChange={handleVolume}
          className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
        <span className="text-[10px] font-mono text-white/50 w-7 text-right">
          {playback.isMuted ? '0%' : `${Math.round(playback.volume * 100)}%`}
        </span>
      </div>

      {/* Direct TV Channel Zapping Bar: CH-, Chaînes & Sites, CH+ */}
      <div className="my-2 grid grid-cols-3 gap-1.5">
        <button
          onClick={handlePrevChannel}
          className="py-2 px-1 rounded-xl glass hover:bg-white/10 border border-white/10 active:scale-90 transition flex flex-col items-center justify-center text-white"
          title="Chaîne précédente (CH -)"
        >
          <ChevronLeft className="w-4 h-4 text-cyan-400" />
          <span className="text-[9px] font-mono font-bold text-white/90">CH -</span>
        </button>

        <button
          onClick={() => setIsMediaSelectorOpen(true)}
          className="py-2 px-1 rounded-xl bg-gradient-to-r from-indigo-600/70 to-purple-600/70 hover:from-indigo-500 hover:to-purple-500 border border-indigo-400/40 active:scale-90 transition flex flex-col items-center justify-center text-white shadow-md"
          title="Ouvrir la liste de toutes les chaînes et sites web"
        >
          <Layers className="w-4 h-4 text-cyan-300" />
          <span className="text-[9px] font-bold text-cyan-100">Chaînes & Sites</span>
        </button>

        <button
          onClick={handleNextChannel}
          className="py-2 px-1 rounded-xl glass hover:bg-white/10 border border-white/10 active:scale-90 transition flex flex-col items-center justify-center text-white"
          title="Chaîne suivante (CH +)"
        >
          <ChevronRight className="w-4 h-4 text-cyan-400" />
          <span className="text-[9px] font-mono font-bold text-white/90">CH +</span>
        </button>
      </div>

      {/* Virtual D-Pad (Navigation Télécommande TV) */}
      <div className="my-2.5 flex flex-col items-center">
        <div className="w-32 h-32 rounded-3xl bg-[#12122b] border border-white/10 relative flex items-center justify-center shadow-inner">
          {/* UP */}
          <button
            onClick={() => {
              triggerHaptic('dpad-up');
              sendRemoteAction('skip', 30);
            }}
            className="absolute top-1 w-10 h-8 flex items-center justify-center text-white/60 hover:text-cyan-400 active:scale-90"
            title="+30s"
          >
            <ChevronUp className="w-5 h-5" />
          </button>

          {/* DOWN */}
          <button
            onClick={() => {
              triggerHaptic('dpad-down');
              sendRemoteAction('skip', -30);
            }}
            className="absolute bottom-1 w-10 h-8 flex items-center justify-center text-white/60 hover:text-cyan-400 active:scale-90"
            title="-30s"
          >
            <ChevronDown className="w-5 h-5" />
          </button>

          {/* LEFT */}
          <button
            onClick={() => {
              triggerHaptic('dpad-left');
              sendRemoteAction('skip', -10);
            }}
            className="absolute left-1 h-10 w-8 flex items-center justify-center text-white/60 hover:text-cyan-400 active:scale-90"
            title="-10s"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* RIGHT */}
          <button
            onClick={() => {
              triggerHaptic('dpad-right');
              sendRemoteAction('skip', 10);
            }}
            className="absolute right-1 h-10 w-8 flex items-center justify-center text-white/60 hover:text-cyan-400 active:scale-90"
            title="+10s"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* CENTER OK BUTTON */}
          <button
            onClick={() => {
              triggerHaptic('dpad-ok');
              sendRemoteAction('togglePlay');
            }}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-[11px] font-black tracking-wider text-white shadow-lg active:scale-90"
          >
            OK
          </button>
        </div>
      </div>

      {/* Quick Stream & Handoff Action Footer */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        {/* Pull back to phone button ("Reprendre le film sur mon téléphone") */}
        <button
          onClick={handlePullToPhone}
          className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Reprendre le film sur ce téléphone</span>
        </button>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => sendRemoteAction('fullscreen')}
            className="py-2 px-2.5 rounded-xl glass hover:bg-white/10 text-white/80 flex items-center justify-center gap-1.5 text-[11px]"
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Plein Écran TV</span>
          </button>

          {/* Open full media and web sites selector modal */}
          <button
            onClick={() => setIsMediaSelectorOpen(true)}
            className="py-2 px-2.5 rounded-xl bg-gradient-to-r from-indigo-600/80 to-purple-600/80 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center justify-center gap-1.5 text-[11px] font-bold shadow-md shadow-indigo-950/40 border border-indigo-400/30"
            title="Choisir parmi toutes les chaînes, films, séries, radios et sites web"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-300" />
            <span>Changer de flux</span>
          </button>
        </div>
      </div>

      {/* Active haptic feedback pill */}
      {feedbackEffect && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-cyan-400 text-black font-black text-xs pointer-events-none animate-ping">
          {feedbackEffect}
        </div>
      )}

      {/* Full Media & Web Sites Selector Modal */}
      <DuoMediaSelectorModal
        isOpen={isMediaSelectorOpen}
        onClose={() => setIsMediaSelectorOpen(false)}
        onSelectMedia={(selectedItem) => {
          castToTV(selectedItem, 0);
          triggerHaptic('FLUX LANCÉ SUR LA TV');
        }}
        activeMediaId={activeMedia?.id}
      />
    </div>
  );
}
