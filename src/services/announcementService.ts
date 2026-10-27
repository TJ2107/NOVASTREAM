import { db } from '../lib/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

export type AnnouncementType = 'info' | 'alert' | 'promotion' | 'update';
export type AnnouncementPriority = 'normal' | 'urgent';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  target: 'all' | string;
  targetEmail?: string;
  authorName: string;
  authorEmail: string;
  active: boolean;
  createdAt: any;
  pinned?: boolean;
}

const COLLECTION_NAME = 'announcements';

/**
 * Publishes a new announcement/message from admin to users
 */
export async function createAnnouncement(data: {
  title: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  target?: 'all' | string;
  targetEmail?: string;
  authorName: string;
  authorEmail: string;
  pinned?: boolean;
}): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    title: data.title.trim(),
    content: data.content.trim(),
    type: data.type || 'info',
    priority: data.priority || 'normal',
    target: data.target || 'all',
    targetEmail: data.targetEmail || '',
    authorName: data.authorName || 'Admin NovaStream',
    authorEmail: data.authorEmail || 'cyber.kan587@gmail.com',
    pinned: data.pinned ?? false,
    active: true,
    createdAt: serverTimestamp()
  });

  return docRef.id;
}

/**
 * Toggles or updates announcement active status
 */
export async function toggleAnnouncementActive(id: string, active: boolean): Promise<void> {
  const ref = doc(db, COLLECTION_NAME, id);
  await updateDoc(ref, { active });
}

/**
 * Deletes an announcement permanently
 */
export async function deleteAnnouncement(id: string): Promise<void> {
  const ref = doc(db, COLLECTION_NAME, id);
  await deleteDoc(ref);
}

/**
 * Subscribes in real time to all announcements (for the Admin)
 */
export function subscribeToAdminAnnouncements(callback: (list: Announcement[]) => void) {
  const colRef = collection(db, COLLECTION_NAME);
  return onSnapshot(colRef, (snapshot) => {
    const list: Announcement[] = snapshot.docs.map((d) => ({
      ...(d.data() as Omit<Announcement, 'id'>),
      id: d.id
    })).sort((a, b) => {
      const tA = (a.createdAt as any)?.toMillis?.() || (a.createdAt as any)?.seconds * 1000 || (a.createdAt ? new Date(a.createdAt as any).getTime() : 0);
      const tB = (b.createdAt as any)?.toMillis?.() || (b.createdAt as any)?.seconds * 1000 || (b.createdAt ? new Date(b.createdAt as any).getTime() : 0);
      return tB - tA;
    });
    callback(list);
  }, (err) => {
    console.warn('Error fetching admin announcements (handled):', err);
    callback([]);
  });
}

/**
 * Subscribes in real-time to active announcements for users
 */
export function subscribeToActiveAnnouncements(callback: (list: Announcement[]) => void) {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('active', '==', true)
  );
  return onSnapshot(q, (snapshot) => {
    const list: Announcement[] = snapshot.docs.map((d) => ({
      ...(d.data() as Omit<Announcement, 'id'>),
      id: d.id
    })).sort((a, b) => {
      const tA = (a.createdAt as any)?.toMillis?.() || (a.createdAt as any)?.seconds * 1000 || (a.createdAt ? new Date(a.createdAt as any).getTime() : 0);
      const tB = (b.createdAt as any)?.toMillis?.() || (b.createdAt as any)?.seconds * 1000 || (b.createdAt ? new Date(b.createdAt as any).getTime() : 0);
      return tB - tA;
    });
    callback(list);
  }, (err) => {
    console.warn('Error fetching active announcements (handled):', err);
    callback([]);
  });
}

