import { create } from 'zustand';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc, collection, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import type { MediaItem } from './useAppStore';
import { useDuoStore } from './useDuoStore';

export interface WatchPartyParticipant {
  id: string;
  name: string;
  avatar: string;
  role: 'host' | 'guest';
  isOnline: boolean;
  statusText?: string;
}

export interface WatchPartyMessage {
  id: string;
  senderName: string;
  avatar: string;
  text: string;
  timeFormatted: string;
  timestamp: any;
  reaction?: string;
}

interface WatchPartyState {
  roomId: string;
  roomName: string;
  isHost: boolean;
  currentUser: WatchPartyParticipant;
  participants: WatchPartyParticipant[];
  sharedMedia: MediaItem | null;
  isPlaying: boolean;
  currentTime: number;
  messages: WatchPartyMessage[];

  // Actions
  createRoom: (roomName: string, media?: MediaItem) => Promise<string>;
  joinRoom: (roomId: string, guestName?: string, isHost?: boolean) => Promise<void>;
  leaveRoom: () => void;
  sendMessage: (text: string) => void;
  sendReaction: (emoji: string) => void;
  syncPlayback: (isPlaying: boolean, currentTime: number) => void;
  setSharedMedia: (media: MediaItem) => void;
  updateProfile: (name: string, avatar: string, statusText?: string) => Promise<void>;
}

export const useWatchPartyStore = create<WatchPartyState>((set, get) => ({
  roomId: '',
  roomName: 'Soirée Ciné & Chill',
  isHost: false,
  currentUser: {
    id: 'user-' + Math.floor(Math.random() * 1000),
    name: 'Invité',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
    role: 'guest',
    isOnline: true,
    statusText: 'Prêt pour le film 🍿'
  },
  participants: [],
  sharedMedia: null,
  isPlaying: false,
  currentTime: 0,
  messages: [],

  createRoom: async (roomName, media) => {
    // Stop duo simulator to prevent interference
    try {
      useDuoStore.getState().setMode('off');
    } catch (e) {}

    const newRoomId = 'party-' + Math.floor(1000 + Math.random() * 9000);
    const roomRef = doc(db, 'watch-parties', newRoomId);
    const currentUser = get().currentUser;
    const hostUser = { ...currentUser, role: 'host' as const };

    await setDoc(roomRef, {
      roomName,
      hostId: hostUser.id,
      isPlaying: false,
      currentTime: 0,
      mediaUrl: media?.url || '',
      mediaTitle: media?.title || '',
      mediaPoster: media?.poster || media?.logo || ''
    });
    
    set({ roomId: newRoomId, roomName, isHost: true, currentUser: hostUser, sharedMedia: media || null });
    await get().joinRoom(newRoomId, hostUser.name, true);
    return newRoomId;
  },

  joinRoom: async (roomId, guestName, isHostOverride = false) => {
    // Stop duo simulator when joining any watch party session
    try {
      useDuoStore.getState().setMode('off');
    } catch (e) {}

    const role: 'host' | 'guest' = isHostOverride || get().isHost ? 'host' : 'guest';
    const user: WatchPartyParticipant = { ...get().currentUser, name: guestName || get().currentUser.name, role };
    set({ roomId, currentUser: user, isHost: role === 'host' });
    
    // Add Participant to Firestore with correct role
    await setDoc(doc(db, 'watch-parties', roomId, 'participants', user.id), {
      ...user,
      role,
      isOnline: true
    }, { merge: true });
    
    // Setup listeners for roomId
    const roomRef = doc(db, 'watch-parties', roomId);
    onSnapshot(roomRef, (docSnap) => {
      const data = docSnap.data();
      if (data) {
        set({ 
          isPlaying: data.isPlaying, 
          currentTime: data.currentTime, 
          roomName: data.roomName || get().roomName,
          sharedMedia: data.mediaUrl ? {
            id: 'shared-media',
            title: data.mediaTitle || 'Programme en direct',
            url: data.mediaUrl,
            poster: data.mediaPoster,
            type: 'movie'
          } as any : null
        });
      }
    });
    
    // Participants
    onSnapshot(collection(db, 'watch-parties', roomId, 'participants'), (snapshot) => {
      const participants = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as WatchPartyParticipant));
      set({ participants });
    });

    // Messages
    onSnapshot(query(collection(db, 'watch-parties', roomId, 'messages'), orderBy('timestamp', 'asc')), (snapshot) => {
      const messages = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as WatchPartyMessage));
      set({ messages });
    });
  },

  leaveRoom: () => set({ roomId: '', isHost: false, participants: [], messages: [], sharedMedia: null }),

  sendMessage: async (text) => {
    const { roomId, currentUser } = get();
    if (!roomId) return;
    await addDoc(collection(db, 'watch-parties', roomId, 'messages'), {
      senderName: currentUser.name,
      avatar: currentUser.avatar,
      text,
      timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: serverTimestamp()
    });
  },

  sendReaction: async (emoji) => {
    const { roomId, currentUser } = get();
    if (!roomId) return;
    await addDoc(collection(db, 'watch-parties', roomId, 'messages'), {
      senderName: currentUser.name,
      avatar: currentUser.avatar,
      text: `A réagi avec ${emoji}`,
      timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: serverTimestamp(),
      reaction: emoji
    });
  },

  syncPlayback: async (isPlaying, currentTime) => {
    const { roomId, isHost } = get();
    if (!roomId || !isHost) return;
    await updateDoc(doc(db, 'watch-parties', roomId), { isPlaying, currentTime });
  },

  setSharedMedia: async (media) => {
    const { roomId, isHost } = get();
    if (!roomId || !isHost) return;
    await updateDoc(doc(db, 'watch-parties', roomId), { 
      mediaUrl: media.url,
      mediaTitle: media.title,
      mediaPoster: media.poster || media.logo || ''
    });
    set({ sharedMedia: media });
  },

  updateProfile: async (name, avatar, statusText) => {
    const { roomId, currentUser } = get();
    const updated = { 
      ...currentUser, 
      name: name.trim() || currentUser.name, 
      avatar: avatar.trim() || currentUser.avatar, 
      statusText: statusText !== undefined ? statusText.trim() : currentUser.statusText 
    };
    set({ currentUser: updated });
    if (roomId) {
      try {
        await setDoc(doc(db, 'watch-parties', roomId, 'participants', currentUser.id), updated, { merge: true });
      } catch (e) {
        console.error('Error updating profile in watch party:', e);
      }
    }
  }
}));
