import { create } from 'zustand';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { recordUserDailyLogin } from '../services/analyticsService';
import { useAppStore } from './useAppStore';

interface AuthState {
  user: FirebaseUser | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  initAuth: () => void;
}

let authListenerInitialized = false;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  loading: true,

  initAuth: () => {
    if (authListenerInitialized) return;
    authListenerInitialized = true;

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const isAdmin = user.email === 'cyber.kan587@gmail.com' || false;
        set({ user, isAdmin, loading: false });

        // Save/update user log and daily statistics with subscriptionPlan
        const currentPlan = useAppStore.getState().subscriptionPlan || 'free';
        await recordUserDailyLogin(user, isAdmin, currentPlan);
      } else {
        set({ user: null, isAdmin: false, loading: false });
      }
    });
  },

  signInWithGoogle: async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const isAdmin = user.email === 'cyber.kan587@gmail.com' || false;
      set({ user, isAdmin, loading: false });

      const currentPlan = useAppStore.getState().subscriptionPlan || 'free';
      await recordUserDailyLogin(user, isAdmin, currentPlan);
    } catch (error) {
      console.error('Google Sign-In error:', error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      await fbSignOut(auth);
      set({ user: null, isAdmin: false, loading: false });
    } catch (error) {
      console.error('Sign-Out error:', error);
    }
  }
}));
