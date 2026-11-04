/**
 * NOVASTREAM Update Service
 * Synchronizes application updates via Firestore (Admin broadcasts & announcements)
 * as well as PWA Service Worker caching and live deployments.
 */
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

export const CURRENT_APP_VERSION = '3.0.0';
export const APP_BUILD_TIME = Date.now();

export interface AppUpdateInfo {
  version: string;
  title: string;
  description?: string;
  releaseNotes: string[];
  highlights?: string[];
  forceShow?: boolean;
  publishedAt?: any;
  publishedBy?: string;
  mandatory?: boolean;
}

export const DEFAULT_LATEST_UPDATE: AppUpdateInfo = {
  version: '3.0.0',
  title: 'NOVASTREAM v3.0.0 — Streaming Haute Définition & Stabilité',
  description: 'Mise à jour majeure améliorant la stabilité du lecteur vidéo, les flux direct TV et la sécurité des comptes.',
  releaseNotes: [
    '✨ Console Studio Audio 3D repensée avec contrôle d\'égalisation dynamique',
    '🔒 Système de validation sécurisée des abonnements Airtel Money & MTN Mobile Money',
    '🔔 Système d\'alerte et notification de mises à jour en direct depuis le serveur',
    '🛠️ Correction du comportement du lecteur lors des interactions utilisateur',
    '⚡ Optimisation des flux IPTV avec contournement proxy anti-coupures et détection réseau'
  ]
};

const DISMISSED_KEY = 'novastream_dismissed_update_version';
const INSTALLED_KEY = 'novastream_installed_app_version';

/**
 * Returns the currently recorded installed version on this device
 */
export function getInstalledVersion(): string {
  try {
    return localStorage.getItem(INSTALLED_KEY) || CURRENT_APP_VERSION;
  } catch {
    return CURRENT_APP_VERSION;
  }
}

/**
 * Checks whether a given version has already been installed on this client
 */
export function isVersionInstalled(version: string): boolean {
  try {
    const installed = localStorage.getItem(INSTALLED_KEY);
    if (installed) {
      return installed === version;
    }
    // If not set yet, compare with CURRENT_APP_VERSION
    return version === CURRENT_APP_VERSION;
  } catch {
    return false;
  }
}

/**
 * Checks if a specific version or update id was already dismissed or installed by this client
 */
export function isUpdateDismissed(version: string): boolean {
  try {
    // If it's already installed, it is treated as dismissed (no longer shown)
    if (isVersionInstalled(version)) return true;
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    return dismissed === version;
  } catch {
    return false;
  }
}

/**
 * Marks an update as dismissed without necessarily changing installed version
 */
export function markUpdateAsDismissed(version: string): void {
  try {
    localStorage.setItem(DISMISSED_KEY, version);
  } catch (e) {
    console.error('Failed to save dismissed update version:', e);
  }
}

/**
 * Installs the update on the client:
 * 1. Saves installed version to localStorage
 * 2. Marks as dismissed
 * 3. Dispatches global event so modals and banners disappear immediately
 */
export function installAppUpdate(version: string): void {
  try {
    localStorage.setItem(INSTALLED_KEY, version);
    localStorage.setItem(DISMISSED_KEY, version);
    
    // Purge media and app caches
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          if (name.includes('stream') || name.includes('novastream') || name.includes('workbox')) {
            caches.delete(name);
          }
        });
      }).catch(() => {});
    }

    // Broadcast event for all components to hide modals/banners instantly
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('novastream_update_installed', {
          detail: { version, timestamp: Date.now() }
        })
      );
    }
  } catch (e) {
    console.error('Failed to mark update as installed:', e);
  }
}

/**
 * Determines if an update should be presented to the user
 */
export function isUpdateAvailable(update: AppUpdateInfo | null): boolean {
  if (!update || !update.version) return false;
  if (isVersionInstalled(update.version)) return false;
  if (isUpdateDismissed(update.version)) return false;
  
  // If version differs from both installed and current bundle version
  const current = getInstalledVersion();
  return update.version !== current;
}

/**
 * Resets dismissed and installed status to allow testing or re-checking
 */
export function resetDismissedUpdate(): void {
  try {
    localStorage.removeItem(DISMISSED_KEY);
    localStorage.removeItem(INSTALLED_KEY);
  } catch (e) {
    console.error('Failed to reset dismissed update:', e);
  }
}

/**
 * Publishes an official application update to Firestore (Admin only)
 */
export async function publishAppUpdate(
  update: AppUpdateInfo,
  adminEmail: string = 'cyber.kan587@gmail.com'
): Promise<void> {
  const docRef = doc(db, 'app_meta', 'version');
  await setDoc(docRef, {
    version: update.version,
    title: update.title,
    description: update.description || '',
    releaseNotes: update.releaseNotes,
    highlights: update.highlights || [],
    forceShow: update.forceShow ?? true,
    publishedAt: serverTimestamp(),
    publishedBy: adminEmail
  }, { merge: true });
}

/**
 * Fetches the latest published update from Firestore
 */
export async function getLatestAppUpdate(): Promise<AppUpdateInfo | null> {
  try {
    const docRef = doc(db, 'app_meta', 'version');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as AppUpdateInfo;
    }
    return DEFAULT_LATEST_UPDATE;
  } catch (err) {
    console.warn('Could not fetch app update from Firestore, using default:', err);
    return DEFAULT_LATEST_UPDATE;
  }
}

/**
 * Real-time listener for app updates from Firestore
 */
export function subscribeToAppUpdate(callback: (update: AppUpdateInfo | null) => void) {
  try {
    const docRef = doc(db, 'app_meta', 'version');
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as AppUpdateInfo;
        callback(data);
      } else {
        // If not initialized yet in Firestore, provide default
        callback(DEFAULT_LATEST_UPDATE);
      }
    }, (err) => {
      console.warn('App update listener error (handled):', err);
      callback(DEFAULT_LATEST_UPDATE);
    });
  } catch (err) {
    console.warn('Failed to subscribe to app update:', err);
    callback(DEFAULT_LATEST_UPDATE);
    return () => {};
  }
}

type ServiceWorkerUpdateListener = (hasUpdate: boolean, newVersion?: string) => void;

class ServiceWorkerUpdateService {
  private hasUpdate = false;
  private newVersion: string | null = null;
  private listeners: Set<ServiceWorkerUpdateListener> = new Set();
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        this.registration = reg;

        if (reg.waiting) {
          this.triggerUpdate(CURRENT_APP_VERSION);
        }

        reg.addEventListener('updatefound', () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (
                installingWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                this.triggerUpdate(CURRENT_APP_VERSION);
              }
            });
          }
        });
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }

  private triggerUpdate(version?: string) {
    this.hasUpdate = true;
    if (version) this.newVersion = version;
    this.notify();
  }

  public async checkForUpdate(): Promise<boolean> {
    if (this.registration) {
      try {
        await this.registration.update();
        if (this.registration.waiting) {
          this.triggerUpdate();
          return true;
        }
      } catch (e) {
        console.debug('[NOVASTREAM Update] Service Worker update check warning:', e);
      }
    }
    return this.hasUpdate;
  }

  public applyUpdate() {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }

  public subscribe(listener: ServiceWorkerUpdateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.hasUpdate, this.newVersion || undefined);
      } catch (err) {
        console.error('[NOVASTREAM Update] Listener error:', err);
      }
    });
  }
}

export const updateService = new ServiceWorkerUpdateService();
