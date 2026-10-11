import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MediaItem } from './useAppStore';

export type DuoRole = 'duo-split' | 'phone-remote' | 'tv-receiver' | 'off';

export interface DuoPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  quality: string;
}

export interface DuoRemoteAction {
  type:
    | 'play'
    | 'pause'
    | 'togglePlay'
    | 'seek'
    | 'skip'
    | 'volume'
    | 'mute'
    | 'fullscreen'
    | 'nextChannel'
    | 'prevChannel'
    | 'quality'
    | 'cast'
    | 'pull'
    | 'ping';
  payload?: any;
  timestamp: number;
  id: string;
}

export interface DuoTransferLog {
  id: string;
  title: string;
  from: 'phone' | 'tv';
  to: 'phone' | 'tv';
  timeFormatted: string;
  timestamp: number;
}

interface DuoStoreState {
  mode: DuoRole;
  pairingCode: string;
  isPaired: boolean;
  tvDeviceName: string;
  phoneDeviceName: string;
  activeMedia: MediaItem | null;
  playback: DuoPlaybackState;
  lastAction: DuoRemoteAction | null;
  transferLogs: DuoTransferLog[];

  // Actions
  setMode: (mode: DuoRole) => void;
  generatePairingCode: () => string;
  pairWithCode: (code: string) => boolean;
  disconnectDuo: () => void;
  castToTV: (media: MediaItem, currentTime?: number) => void;
  pullToPhone: () => { media: MediaItem; currentTime: number } | null;
  sendRemoteAction: (type: DuoRemoteAction['type'], payload?: any) => void;
  updateTVPlayback: (partial: Partial<DuoPlaybackState>) => void;
  setTVDeviceName: (name: string) => void;
  setPhoneDeviceName: (name: string) => void;
}

const DEFAULT_PAIRING_CODE = '582-419';

// Setup BroadcastChannel for zero-latency multi-tab sync
let duoChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    duoChannel = new BroadcastChannel('streambox-duo-bus');
  } catch (e) {
    console.warn('BroadcastChannel error:', e);
  }
}

export const useDuoStore = create<DuoStoreState>()(
  persist(
    (set, get) => {
      // Listen for remote events on the broadcast channel
      if (typeof window !== 'undefined') {
        const handleIncomingBusMessage = (msg: { type: string; payload: any }) => {
          if (!msg || !msg.type) return;

          switch (msg.type) {
            case 'CAST_TO_TV': {
              const { media, currentTime, code } = msg.payload;
              if (code === get().pairingCode || get().isPaired) {
                set((state) => ({
                  activeMedia: media,
                  isPaired: true,
                  playback: {
                    ...state.playback,
                    isPlaying: true,
                    currentTime: currentTime || 0
                  },
                  transferLogs: [
                    {
                      id: String(Date.now()),
                      title: media.title,
                      from: 'phone',
                      to: 'tv',
                      timeFormatted: new Date().toLocaleTimeString(),
                      timestamp: Date.now()
                    },
                    ...state.transferLogs.slice(0, 9)
                  ]
                }));
              }
              break;
            }
            case 'REMOTE_ACTION': {
              const { action, code } = msg.payload;
              if (code === get().pairingCode || get().isPaired) {
                set({ lastAction: action });

                // Synchronize playback state according to action
                if (action.type === 'play') {
                  set((s) => ({ playback: { ...s.playback, isPlaying: true } }));
                } else if (action.type === 'pause') {
                  set((s) => ({ playback: { ...s.playback, isPlaying: false } }));
                } else if (action.type === 'togglePlay') {
                  set((s) => ({ playback: { ...s.playback, isPlaying: !s.playback.isPlaying } }));
                } else if (action.type === 'seek' && typeof action.payload === 'number') {
                  set((s) => ({ playback: { ...s.playback, currentTime: action.payload } }));
                } else if (action.type === 'skip' && typeof action.payload === 'number') {
                  set((s) => ({
                    playback: {
                      ...s.playback,
                      currentTime: Math.max(0, s.playback.currentTime + action.payload)
                    }
                  }));
                } else if (action.type === 'volume' && typeof action.payload === 'number') {
                  set((s) => ({ playback: { ...s.playback, volume: action.payload, isMuted: false } }));
                } else if (action.type === 'mute') {
                  set((s) => ({ playback: { ...s.playback, isMuted: !s.playback.isMuted } }));
                }
              }
              break;
            }
            case 'TV_STATUS_UPDATE': {
              const { playback, code } = msg.payload;
              if (code === get().pairingCode || get().isPaired) {
                set((s) => ({ playback: { ...s.playback, ...playback } }));
              }
              break;
            }
            case 'PULL_TO_PHONE': {
              const { code } = msg.payload;
              if (code === get().pairingCode || get().isPaired) {
                set((s) => ({
                  playback: { ...s.playback, isPlaying: false }
                }));
              }
              break;
            }
            case 'PAIR_REQUEST': {
              const { code } = msg.payload;
              if (code === get().pairingCode) {
                set({ isPaired: true });
                // Ack back
                if (duoChannel) {
                  duoChannel.postMessage({
                    type: 'PAIR_ACK',
                    payload: { code, tvName: get().tvDeviceName }
                  });
                }
              }
              break;
            }
            case 'PAIR_ACK': {
              const { code, tvName } = msg.payload;
              if (code === get().pairingCode) {
                set({ isPaired: true, tvDeviceName: tvName || get().tvDeviceName });
              }
              break;
            }
          }
        };

        if (duoChannel) {
          duoChannel.onmessage = (event) => handleIncomingBusMessage(event.data);
        }

        // Secondary fallback for cross-tab sync via storage events
        window.addEventListener('storage', (e) => {
          if (e.key === 'streambox-duo-bus-event' && e.newValue) {
            try {
              const parsed = JSON.parse(e.newValue);
              handleIncomingBusMessage(parsed);
            } catch (err) {
              console.warn(err);
            }
          }
        });
      }

      const broadcastMessage = (type: string, payload: any) => {
        const msg = { type, payload };
        if (duoChannel) {
          try {
            duoChannel.postMessage(msg);
          } catch (e) {
            console.warn(e);
          }
        }
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('streambox-duo-bus-event', JSON.stringify({ ...msg, _t: Date.now() }));
          } catch (e) {
            console.warn(e);
          }
        }
      };

      return {
        mode: 'duo-split',
        pairingCode: DEFAULT_PAIRING_CODE,
        isPaired: true,
        tvDeviceName: 'Smart TV Salon (Écran 1)',
        phoneDeviceName: 'Téléphone Mobile (Écran 2)',
        activeMedia: null,
        playback: {
          isPlaying: true,
          currentTime: 145, // 2:25 into the movie by default for instant gratification
          duration: 596, // Big Buck Bunny sample duration (~10m)
          volume: 0.85,
          isMuted: false,
          quality: '1080p (FHD)'
        },
        lastAction: null,
        transferLogs: [],

        setMode: (mode) => set({ mode }),

        generatePairingCode: () => {
          const part1 = Math.floor(100 + Math.random() * 900);
          const part2 = Math.floor(100 + Math.random() * 900);
          const newCode = `${part1}-${part2}`;
          set({ pairingCode: newCode, isPaired: false });
          return newCode;
        },

        pairWithCode: (code) => {
          const cleanInput = code.replace(/\s+/g, '').replace(/-/g, '');
          const cleanTarget = get().pairingCode.replace(/\s+/g, '').replace(/-/g, '');
          
          // Accept exact match or valid 6-digit PIN
          const valid = cleanInput === cleanTarget || cleanInput.length === 6;
          if (valid) {
            const formatted = cleanInput.length === 6 ? `${cleanInput.slice(0, 3)}-${cleanInput.slice(3)}` : code;
            set({ isPaired: true, pairingCode: formatted });
            broadcastMessage('PAIR_REQUEST', { code: formatted });
            return true;
          }
          return false;
        },

        disconnectDuo: () => {
          set({ isPaired: false });
        },

        castToTV: (media, currentTime = 0) => {
          const code = get().pairingCode;
          set((state) => ({
            activeMedia: media,
            isPaired: true,
            playback: {
              ...state.playback,
              isPlaying: true,
              currentTime
            },
            transferLogs: [
              {
                id: String(Date.now()),
                title: media.title,
                from: 'phone',
                to: 'tv',
                timeFormatted: new Date().toLocaleTimeString(),
                timestamp: Date.now()
              },
              ...state.transferLogs.slice(0, 9)
            ]
          }));

          broadcastMessage('CAST_TO_TV', { media, currentTime, code });
        },

        pullToPhone: () => {
          const media = get().activeMedia;
          const currentTime = get().playback.currentTime;
          const code = get().pairingCode;

          if (!media) return null;

          set((state) => ({
            playback: { ...state.playback, isPlaying: false },
            transferLogs: [
              {
                id: String(Date.now()),
                title: media.title,
                from: 'tv',
                to: 'phone',
                timeFormatted: new Date().toLocaleTimeString(),
                timestamp: Date.now()
              },
              ...state.transferLogs.slice(0, 9)
            ]
          }));

          broadcastMessage('PULL_TO_PHONE', { code });
          return { media, currentTime };
        },

        sendRemoteAction: (type, payload) => {
          const action: DuoRemoteAction = {
            type,
            payload,
            timestamp: Date.now(),
            id: Math.random().toString(36).substring(7)
          };

          set({ lastAction: action });

          // Local optimistic state update
          if (type === 'play') {
            set((s) => ({ playback: { ...s.playback, isPlaying: true } }));
          } else if (type === 'pause') {
            set((s) => ({ playback: { ...s.playback, isPlaying: false } }));
          } else if (type === 'togglePlay') {
            set((s) => ({ playback: { ...s.playback, isPlaying: !s.playback.isPlaying } }));
          } else if (type === 'seek' && typeof payload === 'number') {
            set((s) => ({ playback: { ...s.playback, currentTime: payload } }));
          } else if (type === 'skip' && typeof payload === 'number') {
            set((s) => ({
              playback: {
                ...s.playback,
                currentTime: Math.max(0, s.playback.currentTime + payload)
              }
            }));
          } else if (type === 'volume' && typeof payload === 'number') {
            set((s) => ({ playback: { ...s.playback, volume: payload, isMuted: false } }));
          } else if (type === 'mute') {
            set((s) => ({ playback: { ...s.playback, isMuted: !s.playback.isMuted } }));
          }

          // Broadcast to connected TV display
          broadcastMessage('REMOTE_ACTION', { action, code: get().pairingCode });
        },

        updateTVPlayback: (partial) => {
          set((s) => ({ playback: { ...s.playback, ...partial } }));
          broadcastMessage('TV_STATUS_UPDATE', { playback: partial, code: get().pairingCode });
        },

        setTVDeviceName: (name) => set({ tvDeviceName: name }),
        setPhoneDeviceName: (name) => set({ phoneDeviceName: name })
      };
    },
    {
      name: 'streambox-duo-storage',
      partialize: (state) => ({
        pairingCode: state.pairingCode,
        tvDeviceName: state.tvDeviceName,
        phoneDeviceName: state.phoneDeviceName,
        isPaired: state.isPaired,
        transferLogs: state.transferLogs
      })
    }
  )
);
