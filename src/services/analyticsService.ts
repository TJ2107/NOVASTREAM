import { db, auth } from '../lib/firebase';
import { useAppStore } from '../store/useAppStore';
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

export interface PaymentRecord {
  id?: string;
  targetEmail: string;
  userId?: string;
  userName?: string;
  senderPhone: string;
  targetPhone: string;
  operator: string;
  amount: string;
  amountNum?: number;
  transactionRef: string;
  status: 'pending' | 'approved' | 'rejected';
  durationMonths: number;
  expiresAt?: number | null;
  createdAt: any;
  approvedAt?: any;
  approvedBy?: string;
  rejectedAt?: any;
  rejectionReason?: string;
}

/**
 * Submits a new payment request by a customer via Airtel Money or MTN Mobile Money.
 * Stored in Firestore with status 'pending' so Admin can review and validate.
 */
export async function submitPendingPayment(details: {
  targetEmail: string;
  userId?: string;
  userName?: string;
  senderPhone: string;
  transactionRef: string;
  operator?: string;
  amount?: string;
  durationMonths?: number;
}): Promise<string> {
  const normalizedEmail = details.targetEmail.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new Error('Une adresse email valide est requise.');
  }
  if (!details.senderPhone.trim()) {
    throw new Error('Le numéro de téléphone ayant effectué le transfert est requis.');
  }

  const txRef = details.transactionRef.trim() || `AIRTEL-${Date.now().toString().slice(-6)}`;
  const operator = details.operator || 'Airtel Money (+242)';
  const amount = details.amount || '5,00 $ (3 000 FCFA)';
  const durationMonths = details.durationMonths || 1;

  try {
    // 1. Add to payments collection with status 'pending'
    const docRef = await addDoc(collection(db, 'payments'), {
      targetEmail: normalizedEmail,
      userId: details.userId || '',
      userName: details.userName || 'Client',
      senderPhone: details.senderPhone.trim(),
      targetPhone: '+242053886817',
      operator: operator,
      amount: amount,
      amountNum: 5,
      transactionRef: txRef,
      status: 'pending',
      durationMonths: durationMonths,
      createdAt: serverTimestamp()
    });

    // 2. Create notification for admin
    await addDoc(collection(db, 'notifications'), {
      type: 'payment_pending',
      title: 'Nouveau Paiement Airtel Money à valider',
      userEmail: normalizedEmail,
      message: `Paiement ${amount} soumis via ${operator} (N° expéditeur : ${details.senderPhone}). Réf : ${txRef}. En attente de validation administrateur.`,
      timestamp: serverTimestamp(),
      read: false,
      paymentId: docRef.id
    });

    return docRef.id;
  } catch (err) {
    console.error('Failed to submit pending payment:', err);
    throw err;
  }
}

/**
 * Validates and approves a pending payment:
 * Sets payment status to 'approved', upgrades the user account to 'premium' for 30 days,
 * and notifies the user and admin.
 */
export async function approvePayment(
  paymentId: string,
  targetEmail: string,
  durationDays: number = 30,
  adminEmail: string = 'cyber.kan587@gmail.com'
): Promise<{ success: boolean; expiresAt: number }> {
  const normalizedEmail = targetEmail.trim().toLowerCase();
  const expiresAt = Date.now() + durationDays * 24 * 60 * 60 * 1000;
  const todayKey = getTodayKey();

  try {
    // 1. Update payment document
    await setDoc(doc(db, 'payments', paymentId), {
      status: 'approved',
      approvedAt: serverTimestamp(),
      approvedBy: adminEmail,
      expiresAt: expiresAt
    }, { merge: true });

    // 2. Find and update matching user(s) in Firestore
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', normalizedEmail));
    const snap = await getDocs(q);

    for (const docSnap of snap.docs) {
      await setDoc(doc(db, 'users', docSnap.id), {
        subscriptionPlan: 'premium',
        subscriptionExpiresAt: expiresAt,
        subscriptionStartedAt: serverTimestamp(),
        subscriptionMethod: 'Airtel Money (+242053886817)',
        subscriptionApprovedBy: adminEmail,
        subscriptionApprovedAt: serverTimestamp()
      }, { merge: true });

      // Update today's login stats if exists
      await setDoc(doc(db, 'daily_stats', todayKey, 'logins', docSnap.id), {
        subscriptionPlan: 'premium'
      }, { merge: true });
    }

    // 3. Create success notification
    await addDoc(collection(db, 'notifications'), {
      type: 'payment_approved',
      title: 'Paiement Airtel Money Validé',
      userEmail: normalizedEmail,
      message: `L'administrateur a validé le paiement pour ${normalizedEmail}. Abonnement VIP actif jusqu'au ${new Date(expiresAt).toLocaleDateString('fr-FR')}.`,
      timestamp: serverTimestamp(),
      read: false,
      paymentId: paymentId
    });

    return { success: true, expiresAt };
  } catch (err) {
    console.error('Failed to approve payment:', err);
    throw err;
  }
}

/**
 * Rejects a pending payment with a specified reason.
 */
export async function rejectPayment(
  paymentId: string,
  targetEmail: string,
  reason: string,
  adminEmail: string = 'cyber.kan587@gmail.com'
): Promise<void> {
  const normalizedEmail = targetEmail.trim().toLowerCase();
  try {
    await setDoc(doc(db, 'payments', paymentId), {
      status: 'rejected',
      rejectedAt: serverTimestamp(),
      rejectedBy: adminEmail,
      rejectionReason: reason
    }, { merge: true });

    await addDoc(collection(db, 'notifications'), {
      type: 'payment_rejected',
      title: 'Paiement Airtel Money Non Validé',
      userEmail: normalizedEmail,
      message: `Paiement rejeté pour ${normalizedEmail} : ${reason}`,
      timestamp: serverTimestamp(),
      read: false,
      paymentId: paymentId
    });
  } catch (err) {
    console.error('Failed to reject payment:', err);
    throw err;
  }
}

/**
 * Checks if a user's subscription has expired and automatically downgrades if past expiration.
 */
export async function checkAndExpireSubscription(
  userId: string,
  subscriptionPlan?: string,
  subscriptionExpiresAt?: number | null
): Promise<boolean> {
  if (!userId || subscriptionPlan !== 'premium' || !subscriptionExpiresAt) {
    return false;
  }

  const now = Date.now();
  if (now > subscriptionExpiresAt) {
    // Expired! Downgrade to free
    try {
      const todayKey = getTodayKey();
      await setDoc(doc(db, 'users', userId), {
        subscriptionPlan: 'free',
        subscriptionExpired: true,
        subscriptionExpiredAt: serverTimestamp()
      }, { merge: true });

      await setDoc(doc(db, 'daily_stats', todayKey, 'logins', userId), {
        subscriptionPlan: 'free'
      }, { merge: true });

      return true;
    } catch (err) {
      console.error('Failed to expire user subscription:', err);
    }
  }

  return false;
}

/**
 * Admin manual subscription extension or downgrade
 */
export async function setManualSubscription(
  targetEmail: string,
  plan: 'free' | 'premium',
  durationDays: number = 30,
  targetUid?: string
): Promise<{ success: boolean; expiresAt: number | null }> {
  const normalizedEmail = (targetEmail || '').trim().toLowerCase();
  const expiresAt = plan === 'premium' ? Date.now() + durationDays * 24 * 60 * 60 * 1000 : null;
  const todayKey = getTodayKey();

  try {
    const updatePayload: Record<string, any> = {
      subscriptionPlan: plan,
      subscriptionExpiresAt: expiresAt,
      subscriptionMethod: plan === 'premium' ? 'Attribution Manuelle Admin' : 'Rétablissement Gratuit Admin',
      subscriptionExpired: plan === 'free',
      subscriptionUpdatedAt: serverTimestamp()
    };

    // 1. Direct update by targetUid if provided
    if (targetUid) {
      await setDoc(doc(db, 'users', targetUid), updatePayload, { merge: true });

      try {
        await setDoc(doc(db, 'daily_stats', todayKey, 'logins', targetUid), {
          subscriptionPlan: plan
        }, { merge: true });
      } catch (e) {
        // Daily stats subcollection might be optional
      }
    }

    // 2. Query users by email in Firestore
    if (normalizedEmail) {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', normalizedEmail));
      const snap = await getDocs(q);

      for (const docSnap of snap.docs) {
        await setDoc(doc(db, 'users', docSnap.id), updatePayload, { merge: true });

        try {
          await setDoc(doc(db, 'daily_stats', todayKey, 'logins', docSnap.id), {
            subscriptionPlan: plan
          }, { merge: true });
        } catch (e) {
          // ignore
        }
      }
    }

    // 3. Immediately sync current user's local app state if matching
    try {
      const currentAuthUser = auth.currentUser;
      if (
        currentAuthUser &&
        ((targetUid && currentAuthUser.uid === targetUid) ||
         (normalizedEmail && currentAuthUser.email && currentAuthUser.email.toLowerCase() === normalizedEmail))
      ) {
        useAppStore.getState().setSubscriptionPlan(plan, expiresAt);
      }
    } catch (e) {
      // ignore
    }

    if (plan === 'premium') {
      await addDoc(collection(db, 'payments'), {
        targetEmail: normalizedEmail || 'compte-utilisateur',
        senderPhone: 'Admin Manual',
        targetPhone: '+242053886817',
        operator: 'Activation Manuelle Administrateur',
        amount: '0,00 $ (Offert/Admin)',
        amountNum: 0,
        transactionRef: `ADMIN-MANUAL-${Date.now().toString().slice(-5)}`,
        status: 'approved',
        durationMonths: Math.round(durationDays / 30),
        expiresAt: expiresAt,
        createdAt: serverTimestamp(),
        approvedAt: serverTimestamp(),
        approvedBy: 'cyber.kan587@gmail.com'
      });
    }

    return { success: true, expiresAt };
  } catch (err) {
    console.error('Failed to manually update subscription:', err);
    throw err;
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
      senderPhone: paymentDetails.phone,
      targetPhone: '+242053886817',
      operator: paymentDetails.operator,
      amount: paymentDetails.amount,
      durationMonths: 1,
      expiresAt: expiresAt,
      createdAt: serverTimestamp(),
      approvedAt: serverTimestamp(),
      approvedBy: 'Auto / Confirmation client',
      status: 'approved',
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


