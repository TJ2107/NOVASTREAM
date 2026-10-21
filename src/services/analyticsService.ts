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
  limit,
  getDocs,
  where,
  addDoc
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
  isAdmin: boolean,
  subscriptionPlan: 'free' | 'premium' = 'free'
) {
  if (!user?.uid) return;

  const todayKey = getTodayKey();
  const userData = {
    uid: user.uid,
    name: user.displayName || 'Utilisateur',
    email: user.email || '',
    photoURL: user.photoURL || '',
    role: isAdmin ? 'admin' : 'user',
    subscriptionPlan: subscriptionPlan || 'free',
    lastLogin: serverTimestamp(),
    lastLoginDate: todayKey
  };

  try {
    // 1. Update user document with lastLogin, lastLoginDate, subscription and history array
    await setDoc(doc(db, 'users', user.uid), {
      ...userData,
      loginDates: arrayUnion(todayKey)
    }, { merge: true });

    // 2. Update daily_stats document for today
    await setDoc(doc(db, 'daily_stats', todayKey), {
      date: todayKey,
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // 3. Record distinct user login in subcollection with subscriptionPlan
    await setDoc(doc(db, 'daily_stats', todayKey, 'logins', user.uid), {
      uid: user.uid,
      name: user.displayName || 'Utilisateur',
      email: user.email || '',
      photoURL: user.photoURL || '',
      role: isAdmin ? 'admin' : 'user',
      subscriptionPlan: subscriptionPlan || 'free',
      timestamp: serverTimestamp(),
      loginDate: todayKey
    }, { merge: true });

    // 4. Notify admin of new user if it's their first time login (check by field existence)
    // We check if this is the first time they are logging in by checking a 'created_at' field
    const userDocRef = doc(db, 'users', user.uid);
    const userSnap = await import('firebase/firestore').then(f => f.getDoc(userDocRef));
    if (!userSnap.exists() || !userSnap.data().createdAt) {
      await setDoc(doc(db, 'users', user.uid), { createdAt: serverTimestamp() }, { merge: true });
      await setDoc(doc(collection(db, 'notifications')), {
        type: 'new_user',
        userId: user.uid,
        userName: user.displayName || 'Utilisateur',
        userEmail: user.email || '',
        timestamp: serverTimestamp(),
        read: false
      });
    }

  } catch (error) {
    console.error('Failed to record user daily login analytics:', error);
  }
}

/**
 * Updates user's subscription plan directly in Firestore
 */
export async function updateUserSubscription(
  userId: string,
  plan: 'free' | 'premium',
  expiresAt: number | null = null
) {
  if (!userId) return;
  try {
    const todayKey = getTodayKey();
    await setDoc(doc(db, 'users', userId), {
      subscriptionPlan: plan,
      subscriptionExpiresAt: expiresAt
    }, { merge: true });

    // Also update today's login subcollection if present
    await setDoc(doc(db, 'daily_stats', todayKey, 'logins', userId), {
      subscriptionPlan: plan
    }, { merge: true });
  } catch (err) {
    console.error('Failed to update user subscription in Firestore:', err);
  }
}

/**
 * Activates 1-Month Premium VIP (Sans Pub) subscription for a user account identified by their email,
 * and records the payment transaction in Firestore.
 */
export async function activatePremiumByEmail(
  targetEmail: string,
  expiresAt: number,
  paymentDetails: {
    phone: string;
    operator: string;
    amount: string;
    transactionRef?: string;
  }
): Promise<{ success: boolean; updatedCount: number; targetEmail: string }> {
  const normalizedEmail = targetEmail.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('Email requis');
  }

  try {
    const todayKey = getTodayKey();
    let updatedCount = 0;

    // 1. Search for user by email in users collection
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', normalizedEmail));
    const snap = await getDocs(q);

    for (const docSnap of snap.docs) {
      await setDoc(doc(db, 'users', docSnap.id), {
        subscriptionPlan: 'premium',
        subscriptionExpiresAt: expiresAt,
        subscriptionMethod: paymentDetails.operator,
        subscriptionPhone: paymentDetails.phone,
        subscriptionUpdatedAt: serverTimestamp()
      }, { merge: true });

      // Also update today's login record if exists
      await setDoc(doc(db, 'daily_stats', todayKey, 'logins', docSnap.id), {
        subscriptionPlan: 'premium'
      }, { merge: true });

      updatedCount++;
    }

    // 2. Record official payment transaction in payments collection
    const txRef = paymentDetails.transactionRef || `AIRTEL-${Date.now().toString().slice(-6)}`;
    await addDoc(collection(db, 'payments'), {
      targetEmail: normalizedEmail,
      phone: paymentDetails.phone,
      operator: paymentDetails.operator,
      amount: paymentDetails.amount,
      durationMonths: 1,
      expiresAt: expiresAt,
      timestamp: serverTimestamp(),
      status: 'confirmed',
      transactionRef: txRef
    });

    // 3. Add an admin notification
    await addDoc(collection(db, 'notifications'), {
      type: 'payment_received',
      title: 'Paiement Mobile Money Confirmé',
      userEmail: normalizedEmail,
      message: `Paiement ${paymentDetails.amount} reçu via ${paymentDetails.operator} (${paymentDetails.phone}). Compte ${normalizedEmail} passé en Premium Sans Pub pour 1 mois.`,
      timestamp: serverTimestamp(),
      read: false
    });

    return { success: true, updatedCount, targetEmail: normalizedEmail };
  } catch (err) {
    console.error('Failed to activate premium by email:', err);
    throw err;
  }
}

