import { create } from 'zustand';
import type { MediaItem } from './useAppStore';

export interface SpatialPreset {
  id: string;
  name: string;
  icon: string;
  panWidth: number; // 0 to 1
  bass: number; // dB (-12 to +12)
  treble: number; // dB (-12 to +12)
  compressorThreshold: number; // -50 to 0 dB
}

export const SPATIAL_PRESETS: SpatialPreset[] = [
  {
    id: 'cinema',
    name: 'Cinéma 3D',
    icon: '🎬',
    panWidth: 0.85,
    bass: 6,
    treble: 4,
    compressorThreshold: -24
  },
  {
    id: 'binaural',
    name: 'Binaural Casque',
    icon: '🎧',
    panWidth: 0.95,
    bass: 4,
    treble: 6,
    compressorThreshold: -18
  },
  {
    id: 'concert',
    name: 'Salle de Concert',
    icon: '🏛️',
    panWidth: 0.75,
    bass: 3,
    treble: 2,
    compressorThreshold: -20
  },
  {
    id: 'studio',
    name: 'Studio Master',
    icon: '🎙️',
    panWidth: 0.5,
    bass: 2,
    treble: 2,
    compressorThreshold: -14
  },
  {
    id: 'bassboost',
    name: 'Bass Boost 3D',
    icon: '🔊',
    panWidth: 0.8,
    bass: 10,
    treble: 3,
    compressorThreshold: -28
  }
];

interface AudioState {
  currentTrack: MediaItem | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  requestedSeekTime: number | null;

  // Sound Adjustments & Spatial Audio
  isSpatialEnabled: boolean;
  activePresetId: string;
  stereoWidth: number;
  bassGain: number;
  trebleGain: number;

  playTrack: (track: MediaItem) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  close: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setCurrentTime: (t: number) => void;
  setDuration: (d: number) => void;
  seek: (t: number) => void;
  clearSeek: () => void;

  setSpatialEnabled: (enabled: boolean) => void;
  applyPreset: (preset: SpatialPreset) => void;
  setStereoWidth: (w: number) => void;
  setBassGain: (b: number) => void;
  setTrebleGain: (t: number) => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 0.85,
  isMuted: false,
  currentTime: 0,
  duration: 0,
  requestedSeekTime: null,

  isSpatialEnabled: true,
  activePresetId: 'cinema',
  stereoWidth: 0.85,
  bassGain: 6,
  trebleGain: 4,

  playTrack: (track) => set({ currentTrack: track, isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  close: () => set({ currentTrack: null, isPlaying: false, currentTime: 0, duration: 0 }),
  setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)), isMuted: false }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  setCurrentTime: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: d }),
  seek: (t) => set({ requestedSeekTime: t, currentTime: t }),
  clearSeek: () => set({ requestedSeekTime: null }),

  setSpatialEnabled: (enabled) => set({ isSpatialEnabled: enabled }),
  applyPreset: (preset) =>
    set({
      activePresetId: preset.id,
      stereoWidth: preset.panWidth,
      bassGain: preset.bass,
      trebleGain: preset.treble
    }),
  setStereoWidth: (w) => set({ stereoWidth: Math.max(0, Math.min(1, w)) }),
  setBassGain: (b) => set({ bassGain: Math.max(-12, Math.min(12, b)) }),
  setTrebleGain: (t) => set({ trebleGain: Math.max(-12, Math.min(12, t)) })
}));

