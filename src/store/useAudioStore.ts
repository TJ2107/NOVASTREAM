import { create } from 'zustand';
import type { MediaItem } from './useAppStore';

interface AudioState {
  currentTrack: MediaItem | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  playTrack: (track: MediaItem) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  close: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 0.85,
  isMuted: false,

  playTrack: (track) => set({ currentTrack: track, isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  close: () => set({ currentTrack: null, isPlaying: false }),
  setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted }))
}));
