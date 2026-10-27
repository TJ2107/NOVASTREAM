import { create } from 'zustand';
import { auth, db } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { recordUserDailyLogin, checkAndExpireSubscription, updateUserSubscription } from '../services/analyticsService';
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
let userDocUnsubscribe: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  loading: true,

  initAuth: () => {
    if (authListenerInitialized) return;
    authListenerInitialized = true;

    // Fast fallback for iOS Safari: if Firebase IndexedDB lookup takes too long on cold start,
    // don't leave the user stuck on the loading spinner, show the AuthGate promptly.
    const fallbackTimer = setTimeout(() => {
      useAuthStore.setState((state) => (state.loading ? { loading: false } : {}));
    }, 1500);

    onAuthStateChanged(auth, async (user) => {
      clearTimeout(fallbackTimer);
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
        userDocUnsubscribe = null;
      }

      if (user) {
        const isAdmin = user.email === 'cyber.kan587@gmail.com' || false;
        set({ user, isAdmin, loading: false });

        // Subscribe to user document in Firestore to sync subscription & auto-expiration in real-time
        try {
          userDocUnsubscribe = onSnapshot(doc(db, 'users', user.uid), async (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              const plan = data.subscriptionPlan || 'free';
              const expiresAt = data.subscriptionExpiresAt || null;

              if (plan === 'premium' && expiresAt) {
                if (Date.now() > expiresAt) {
                  // Expired! Downgrade to free in Firestore and app store
                  await checkAndExpireSubscription(user.uid, 'premium', expiresAt);
                  useAppStore.getState().setSubscriptionPlan('free', null);
                } else {
                  // Active VIP Premium
                  useAppStore.getState().setSubscriptionPlan('premium', expiresAt);
                }
              } else {
                useAppStore.getState().setSubscriptionPlan('free', null);
              }
            }
          }, (err) => {
            console.warn('User doc snapshot sync error (handled):', err);
          });
        } catch (e) {
          console.warn('Could not establish user doc snapshot listener:', e);
        }

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
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
        userDocUnsubscribe = null;
      }
      await fbSignOut(auth);
      set({ user: null, isAdmin: false, loading: false });
    } catch (error) {
      console.error('Sign-Out error:', error);
    }
  }
}));

