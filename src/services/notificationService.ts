import { db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  getDocs
} from 'firebase/firestore';

export interface AdminNotification {
  id: string;
  type: 'payment_pending' | 'payment_approved' | 'payment_rejected' | 'new_user' | 'feedback' | string;
  title?: string;
  message?: string;
  userEmail?: string;
  userName?: string;
  userId?: string;
  paymentId?: string;
  timestamp?: any;
  read: boolean;
  readAt?: any;
}

/**
 * Mark a single notification as read.
 * Decreases the unread counter in real-time.
 */
export async function markNotificationAsRead(id: string): Promise<void> {
  if (!id) return;
  try {
    const notifRef = doc(db, 'notifications', id);
    await setDoc(
      notifRef,
      {
        read: true,
        readAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error marking notification as read:', err);
    throw err;
  }
}

/**
 * Mark a single notification as unread.
 */
export async function markNotificationAsUnread(id: string): Promise<void> {
  if (!id) return;
  try {
    const notifRef = doc(db, 'notifications', id);
    await setDoc(
      notifRef,
      {
        read: false,
        readAt: null
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error marking notification as unread:', err);
    throw err;
  }
}

/**
 * Mark all unread notifications as read at once,
 * immediately reducing the unread counter down to 0.
 */
export async function markAllNotificationsAsRead(): Promise<number> {
  try {
    const colRef = collection(db, 'notifications');
    const snapshot = await getDocs(colRef);
    const unreadDocs = snapshot.docs.filter((d) => !d.data()?.read);

    if (unreadDocs.length === 0) return 0;

    const batch = writeBatch(db);
    unreadDocs.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        read: true,
        readAt: serverTimestamp()
      });
    });

    await batch.commit();
    return unreadDocs.length;
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    throw err;
  }
}

/**
 * Delete a notification document.
 */
export async function deleteNotification(id: string): Promise<void> {
  if (!id) return;
  try {
    await deleteDoc(doc(db, 'notifications', id));
  } catch (err) {
    console.error('Error deleting notification:', err);
    throw err;
  }
}

/**
 * Delete all read notifications.
 */
export async function deleteAllReadNotifications(): Promise<number> {
  try {
    const colRef = collection(db, 'notifications');
    const snapshot = await getDocs(colRef);
    const readDocs = snapshot.docs.filter((d) => d.data()?.read === true);

    if (readDocs.length === 0) return 0;

    const batch = writeBatch(db);
    readDocs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });

    await batch.commit();
    return readDocs.length;
  } catch (err) {
    console.error('Error deleting read notifications:', err);
    throw err;
  }
}

/**
 * Real-time listener for all admin notifications.
 */
export function subscribeToAdminNotifications(
  callback: (notifications: AdminNotification[]) => void
): () => void {
  const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: AdminNotification[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          type: data.type || 'info',
          title: data.title || '',
          message: data.message || '',
          userEmail: data.userEmail || '',
          userName: data.userName || '',
          userId: data.userId || '',
          paymentId: data.paymentId || '',
          timestamp: data.timestamp,
          read: data.read === true,
          readAt: data.readAt
        };
      });
      callback(items);
    },
    (err) => {
      console.warn('Notification listener error:', err);
      callback([]);
    }
  );
}

/**
 * Real-time listener for the unread count only (for lightweight usage in menus / headers).
 */
export function subscribeToUnreadNotificationsCount(
  callback: (unreadCount: number) => void
): () => void {
  return onSnapshot(
    collection(db, 'notifications'),
    (snapshot) => {
      const count = snapshot.docs.filter((d) => !d.data()?.read).length;
      callback(count);
    },
    (err) => {
      console.warn('Unread count listener error:', err);
      callback(0);
    }
  );
}
