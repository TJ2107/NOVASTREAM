import { db } from '../lib/firebase';
import { 
  doc, 
  setDoc, 
  serverTimestamp, 
  arrayUnion, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';

export interface DailyLoginUser {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  timestamp: any;
  loginDate: string;
}

export interface DayStats {
  date: string;
  uniqueUsersCount: number;
  users: DailyLoginUser[];
}

export function getTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function recordUserDailyLogin(
  user: { uid: string; displayName?: string | null; email?: string | null; photoURL?: string | null },
  isAdmin: boolean
) {
  if (!user?.uid) return;

  const todayKey = getTodayKey();
  const userData = {
    uid: user.uid,
    name: user.displayName || 'Utilisateur',
    email: user.email || '',
    photoURL: user.photoURL || '',
    role: isAdmin ? 'admin' : 'user',
    lastLogin: serverTimestamp(),
    lastLoginDate: todayKey
  };

  try {
    // 1. Update user document with lastLogin, lastLoginDate and history array
    await setDoc(doc(db, 'users', user.uid), {
      ...userData,
      loginDates: arrayUnion(todayKey)
    }, { merge: true });

    // 2. Update daily_stats document for today
    await setDoc(doc(db, 'daily_stats', todayKey), {
      date: todayKey,
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // 3. Record distinct user login in subcollection
    await setDoc(doc(db, 'daily_stats', todayKey, 'logins', user.uid), {
      uid: user.uid,
      name: user.displayName || 'Utilisateur',
      email: user.email || '',
      photoURL: user.photoURL || '',
      timestamp: serverTimestamp(),
      loginDate: todayKey
    }, { merge: true });
  } catch (error) {
    console.error('Failed to record user daily login analytics:', error);
  }
}
