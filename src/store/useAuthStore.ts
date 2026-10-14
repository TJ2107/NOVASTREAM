import { create } from 'zustand';
import { auth, db } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthState {
  user: FirebaseUser | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  loading: true,

  initAuth: () => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const isAdmin = user.email === 'cyber.kan587@gmail.com' || user.email?.endsWith('@admin.com') || false;
        set({ user, isAdmin, loading: false });

        // Save/update user log in Firestore
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: user.displayName || 'Utilisateur',
            email: user.email || '',
            photoURL: user.photoURL || '',
            lastLogin: serverTimestamp(),
            role: isAdmin ? 'admin' : 'user'
          }, { merge: true });
        } catch (e) {
          console.error('Error saving user log:', e);
        }
      } else {
        set({ user: null, isAdmin: false, loading: false });
      }
    });
  },

  signInWithGoogle: async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const isAdmin = user.email === 'cyber.kan587@gmail.com' || false;
      set({ user, isAdmin });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: user.displayName || 'Utilisateur',
        email: user.email || '',
        photoURL: user.photoURL || '',
        lastLogin: serverTimestamp(),
        role: isAdmin ? 'admin' : 'user'
      }, { merge: true });
    } catch (error) {
      console.error('Google Sign-In error:', error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      await fbSignOut(auth);
      set({ user: null, isAdmin: false });
    } catch (error) {
      console.error('Sign-Out error:', error);
    }
  }
}));
