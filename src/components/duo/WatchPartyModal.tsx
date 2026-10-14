import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  MessageSquare,
  Send,
  Sparkles,
  Share2,
  Copy,
  Check,
  Smile,
  Tv,
  Film,
  Play,
  Pause,
  Volume2,
  Maximize2,
  ShieldCheck,
  X,
  User,
  Edit3
} from 'lucide-react';
import { useWatchPartyStore } from '../../store/useWatchPartyStore';
import { useDuoStore } from '../../store/useDuoStore';
import { VideoPlayer } from '../player/VideoPlayer';
import { useAppStore } from '../../store/useAppStore';
import { DuoMediaSelectorModal } from './DuoMediaSelectorModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const presetAvatars = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&q=80',
  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=150&q=80'
];

export function WatchPartyModal({ isOpen, onClose }: Props) {
  const {
    roomId,
    roomName,
    currentUser,
    participants,
    sharedMedia,
    isPlaying,
    currentTime,
    messages,
    sendMessage,
    sendReaction,
    syncPlayback,
    createRoom,
    joinRoom,
    isHost,
    setSharedMedia,
    updateProfile
  } = useWatchPartyStore();

  const { sources } = useAppStore();
  const { activeMedia } = useDuoStore();
  const [inputMessage, setInputMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'watch' | 'chat' | 'friends'>('watch');
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Profile customization state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [editAvatar, setEditAvatar] = useState(currentUser.avatar);
  const [editStatus, setEditStatus] = useState(currentUser.statusText || '');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !roomId) {
      const startingMedia = activeMedia || sources[0] || {
        id: 'demo-bbb',
        name: 'Big Buck Bunny (HLS)',
        title: 'Big Buck Bunny (Watch Party Session)',
        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        type: 'movie',
        group: 'Films VOD'
      };
      createRoom('Soirée Ciné & Chill', startingMedia);
    }
  }, [isOpen, roomId, createRoom, sources, activeMedia]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    sendMessage(inputMessage.trim());
    setInputMessage('');
  };

  const handleCopyInvite = () => {
    const link = `${window.location.origin}/duo?room=${roomId}`;
    navigator.clipboard?.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const reactions = ['🍿', '🔥', '❤️', '😂', '👏', '😮'];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-2 md:p-6 select-none animate-fadeIn">
      <div className="relative w-full max-w-6xl h-[92vh] rounded-[32px] glass-strong border border-indigo-500/40 shadow-2xl flex flex-col overflow-hidden bg-[#070714]">
        
        {/* Top Header Bar */}
        <div className="p-4 md:p-5 bg-gradient-to-r from-indigo-950/80 via-[#0c0c26] to-purple-950/80 border-b border-indigo-500/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-900/50">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-xl font-black text-white">{roomName}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-400/40 text-[10px] font-mono text-cyan-300 font-bold animate-pulse">
                  LIVE WATCH PARTY
                </span>
              </div>
              <p className="text-xs text-white/60">
                Regardez ensemble où que vous soyez • Code salon : <span className="text-cyan-300 font-mono font-bold">{roomId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyInvite}
              className="px-3.5 py-2 rounded-xl glass hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-md"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              <span className="hidden sm:inline">{copiedLink ? 'Lien invité copié !' : 'Inviter des amis'}</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-md"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">Nouveau Salon</span>
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl glass hover:bg-white/10 text-white/70 hover:text-white transition"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Grid: Video Player + Chat/Participants sidebar */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
          
          {/* Left Column: Shared Video Player & Reactions */}
          <div className="lg:col-span-8 flex flex-col p-4 md:p-6 bg-black/40 min-h-0 space-y-4">
            
            {/* Video Container */}
            <div className="relative flex-1 rounded-3xl overflow-hidden border border-indigo-500/30 bg-black shadow-2xl min-h-[320px]">
              {sharedMedia ? (
                <VideoPlayer
                  src={sharedMedia.url}
                  title={sharedMedia.title}
                  poster={sharedMedia.poster || sharedMedia.logo}
                  initialTime={currentTime}
                  autoPlay={isPlaying}
                  onProgress={(time) => {
                    if (Math.abs(time - currentTime) > 3) {
                      syncPlayback(isPlaying, time);
                    }
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/50">
                  Aucun média sélectionné pour le salon
                </div>
              )}

              {/* Floating Emojis Reaction Overlay */}
              <div className="absolute bottom-16 right-4 z-30 flex items-center gap-1.5 p-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 shadow-xl">
                {reactions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => sendReaction(emoji)}
                    className="w-9 h-9 rounded-xl glass hover:bg-white/20 active:scale-90 flex items-center justify-center text-lg transition"
                    title={`Envoyer ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Now Playing Title & Info Footer */}
            <div className="p-4 rounded-2xl glass-strong border border-white/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-indigo-950 border border-indigo-400/30">
                  <img
                    src={sharedMedia?.poster || sharedMedia?.logo || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&q=80'}
                    alt="Poster"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-xs text-indigo-300 font-mono font-bold block">EN COURS DE VISIONNAGE COMMUN</span>
                  <span className="text-sm font-black text-white truncate block">{sharedMedia?.title}</span>
                </div>
              </div>
              
              {isHost && (
                <button
                  onClick={() => setShowMediaSelector(true)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  Changer média
                </button>
              )}

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {participants.filter((p) => p.isOnline).length} spectateurs en ligne
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Chat & Participants List */}
          <div className="lg:col-span-4 flex flex-col border-t lg:border-t-0 lg:border-l border-indigo-500/20 bg-[#09091c] min-h-0">
            
            {/* Tabs for Sidebar */}
            <div className="flex border-b border-white/10 p-2 gap-2">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  activeTab === 'chat'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'glass text-white/70 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Chat en direct</span>
              </button>

              <button
                onClick={() => setActiveTab('friends')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  activeTab === 'friends'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'glass text-white/70 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Amis ({participants.length})</span>
              </button>
            </div>

            {/* TAB: CHAT MESSAGES */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-2.5 text-xs">
                      <img
                        src={msg.avatar}
                        alt={msg.senderName}
                        className="w-8 h-8 rounded-full object-cover border border-white/20 flex-shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between">
                          <span className="font-bold text-cyan-300">{msg.senderName}</span>
                          <span className="text-[10px] text-white/40 font-mono">{msg.timeFormatted}</span>
                        </div>
                        <div className={`mt-1 p-2.5 rounded-2xl ${msg.reaction ? 'bg-indigo-950/80 border border-indigo-400/40 text-amber-300 font-bold text-sm' : 'bg-white/5 border border-white/5 text-white/90'}`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Form */}
                <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-black/40 flex items-center gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Discutez avec vos amis en regardant..."
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition"
                  />
                  <button
                    type="submit"
                    className="p-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition flex items-center justify-center shadow-lg"
                    title="Envoyer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* TAB: FRIENDS LIST */}
            {activeTab === 'friends' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Current User Profile Card & Edit Button */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/80 to-purple-950/80 border border-indigo-500/30 flex items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-11 h-11 rounded-full object-cover border-2 border-cyan-400 shadow-md flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-xs truncate">{currentUser.name}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                          {isHost ? 'Hôte' : 'Invité'}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/60 truncate block">{currentUser.statusText || 'Prêt pour le film 🍿'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setEditName(currentUser.name);
                      setEditAvatar(currentUser.avatar);
                      setEditStatus(currentUser.statusText || '');
                      setShowProfileModal(true);
                    }}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition border border-white/10 flex-shrink-0"
                    title="Personnaliser mon profil"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Modifier</span>
                  </button>
                </div>

                <div className="text-[11px] font-bold text-white/80 pt-1">
                  Amis connectés dans ce salon ({participants.length}) :
                </div>

                <div className="space-y-2">
                  {participants.map((friend) => (
                    <div key={friend.id} className="p-3 rounded-2xl glass border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={friend.avatar}
                            alt={friend.name}
                            className="w-10 h-10 rounded-full object-cover border border-white/20"
                          />
                          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${friend.isOnline ? 'bg-emerald-400' : 'bg-gray-400'}`} />
                        </div>
                        <div>
                          <span className="font-bold text-white text-xs block">{friend.name}</span>
                          <span className="text-[10px] text-white/50">{friend.statusText || 'En ligne'}</span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-mono px-2 py-1 rounded-full font-bold ${friend.role === 'host' ? 'bg-indigo-950 text-indigo-300 border border-indigo-400/40' : 'bg-white/5 text-white/60'}`}>
                        {friend.role === 'host' ? 'Hôte' : 'Invité'}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleCopyInvite}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl transition"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Inviter d'autres amis (Copier lien)</span>
                </button>
              </div>
            )}

          </div>
        </div>

        {/* PROFILE CUSTOMIZATION MODAL */}
        {showProfileModal && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-3xl glass-strong border border-cyan-500/40 p-6 space-y-5 shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Personnaliser votre profil</h3>
                    <p className="text-xs text-white/60">Modifiez votre pseudo, avatar ou statut pour la Watch Party</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="p-2 rounded-xl glass hover:bg-white/10 text-white/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Avatar Preview */}
              <div className="flex flex-col items-center justify-center space-y-3 py-2">
                <div className="relative">
                  <img
                    src={editAvatar}
                    alt="Aperçu"
                    className="w-20 h-20 rounded-full object-cover border-2 border-cyan-400 shadow-xl"
                  />
                  <span className="absolute bottom-0 right-0 p-1 rounded-full bg-cyan-500 text-black shadow">
                    <Check className="w-3.5 h-3.5 font-bold" />
                  </span>
                </div>

                {/* Preset Avatars Selection */}
                <div className="space-y-1.5 w-full">
                  <span className="text-[11px] text-white/60 font-medium block text-left">Choisir un avatar rapide :</span>
                  <div className="grid grid-cols-6 gap-2">
                    {presetAvatars.map((url) => (
                      <img
                        key={url}
                        src={url}
                        alt="Preset"
                        onClick={() => setEditAvatar(url)}
                        className={`w-10 h-10 rounded-full object-cover cursor-pointer transition border-2 ${
                          editAvatar === url ? 'border-cyan-400 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-white/80 font-bold">Votre Pseudo / Nom</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Votre nom dans le salon"
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-white/80 font-bold">URL de l'Avatar (Optionnel)</label>
                  <input
                    type="text"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    placeholder="https://... ou choisissez ci-dessus"
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-white/80 font-bold">Statut / Humeur (ex: 🍿 Prêt pour le film)</label>
                  <input
                    type="text"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    placeholder="Ex: Popcorn prêt, bon film à tous !"
                    className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 rounded-xl glass hover:bg-white/10 text-xs text-white/70 font-semibold"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    updateProfile(editName, editAvatar, editStatus);
                    setShowProfileModal(false);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-extrabold text-xs shadow-lg transition"
                >
                  Enregistrer mon profil
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full Media & Web Sites Selector Modal */}
        <DuoMediaSelectorModal
          isOpen={showMediaSelector}
          onClose={() => setShowMediaSelector(false)}
          onSelectMedia={(item) => {
            setSharedMedia(item);
            setShowMediaSelector(false);
          }}
          title="Changer le programme de la Watch Party"
          activeMediaId={sharedMedia?.id}
        />

        {/* Modal for creating a new custom Watch Party room */}
        {showCreateModal && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-3xl glass-strong border border-indigo-500/40 p-6 space-y-4 shadow-2xl">
              <h3 className="text-xl font-black text-white">Créer un Salon Watch Party</h3>
              <p className="text-xs text-white/60">
                Donnez un nom à votre soirée cinéma ou live TV pour inviter vos amis.
              </p>

              <div className="space-y-2">
                <label className="text-xs text-white/80 font-bold">Nom du Salon</label>
                <input
                  type="text"
                  value={newRoomTitle}
                  onChange={(e) => setNewRoomTitle(e.target.value)}
                  placeholder="Ex: Soirée Séries & Popcorn 🍿"
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl glass hover:bg-white/10 text-xs text-white/70 font-semibold"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    if (newRoomTitle.trim()) {
                      createRoom(newRoomTitle.trim(), sharedMedia || undefined);
                      setShowCreateModal(false);
                      setNewRoomTitle('');
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg"
                >
                  Créer le salon
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
