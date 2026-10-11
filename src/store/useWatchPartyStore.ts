import { create } from 'zustand';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc, collection, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import type { MediaItem } from './useAppStore';

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
  joinRoom: (roomId: string, guestName?: string) => void;
  leaveRoom: () => void;
  sendMessage: (text: string) => void;
  sendReaction: (emoji: string) => void;
  syncPlayback: (isPlaying: boolean, currentTime: number) => void;
  setSharedMedia: (media: MediaItem) => void;
}

export const useWatchPartyStore = create<WatchPartyState>((set, get) => ({
  roomId: '',
  roomName: '',
  isHost: false,
  currentUser: {
    id: 'user-' + Math.floor(Math.random() * 1000),
    name: 'Invité',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80',
    role: 'guest',
    isOnline: true,
  },
  participants: [],
  sharedMedia: null,
  isPlaying: false,
  currentTime: 0,
  messages: [],

  createRoom: async (roomName, media) => {
    const newRoomId = 'party-' + Math.floor(1000 + Math.random() * 9000);
    const roomRef = doc(db, 'watch-parties', newRoomId);
    await setDoc(roomRef, {
      roomName,
      hostId: get().currentUser.id,
      isPlaying: false,
      currentTime: 0,
      mediaUrl: media?.url || ''
    });
    set({ roomId: newRoomId, roomName, isHost: true });
    return newRoomId;
  },

  joinRoom: (roomId, guestName) => {
    set({ roomId });
    // Setup listeners for roomId
    const roomRef = doc(db, 'watch-parties', roomId);
    onSnapshot(roomRef, (doc) => {
      const data = doc.data();
      if (data) {
        set({ isPlaying: data.isPlaying, currentTime: data.currentTime, sharedMedia: { ...get().sharedMedia, url: data.mediaUrl } as any });
      }
    });
    
    // Participants
    onSnapshot(collection(db, 'watch-parties', roomId, 'participants'), (snapshot) => {
      const participants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WatchPartyParticipant));
      set({ participants });
    });

    // Messages
    onSnapshot(query(collection(db, 'watch-parties', roomId, 'messages'), orderBy('timestamp', 'asc')), (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WatchPartyMessage));
      set({ messages });
    });
  },
  leaveRoom: () => set({ roomId: '', isHost: false, participants: [], messages: [] }),
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
    const { roomId } = get();
    if (!roomId) return;
    await updateDoc(doc(db, 'watch-parties', roomId), { isPlaying, currentTime });
  },
  setSharedMedia: async (media) => {
    const { roomId } = get();
    if (!roomId) return;
    await updateDoc(doc(db, 'watch-parties', roomId), { mediaUrl: media.url });
  }
}));
