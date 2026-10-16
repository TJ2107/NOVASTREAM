/**
 * NOVASTREAM Update Service
 * Detects new service worker deployments and application updates,
 * notifying the user so they can update the application seamlessly.
 */

export interface VersionInfo {
  version: string;
  buildTime: number;
}

// Initial build version recorded at bundle time
export const APP_CURRENT_VERSION = '3.3.0';
export const APP_BUILD_TIME = Date.now();

type UpdateListener = (hasUpdate: boolean, newVersion?: string) => void;

class UpdateService {
  private hasUpdate = false;
  private newVersion: string | null = null;
  private listeners: Set<UpdateListener> = new Set();
  private registration: ServiceWorkerRegistration | null = null;
  private checkIntervalTimer: any = null;
  private initialBuildTime = APP_BUILD_TIME;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // 1. Service Worker Registration Monitoring
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        this.registration = reg;

        // Check if there's already a waiting worker
        if (reg.waiting) {
          this.triggerUpdate(APP_CURRENT_VERSION);
        }

        // Listen for new service worker installation
        reg.addEventListener('updatefound', () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (
                installingWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                this.triggerUpdate(APP_CURRENT_VERSION);
              }
            });
          }
        });
      });

      // Reload on controller change once skipWaiting is triggered
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    // 2. Periodic background check every 60 seconds
    this.checkIntervalTimer = setInterval(() => {
      this.checkForUpdate();
    }, 60 * 1000);

    // 3. Check when user returns to the tab/window
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkForUpdate();
      }
    });

    // 4. Initial check after 5 seconds
    setTimeout(() => {
      this.checkForUpdate();
    }, 5000);
  }

  private triggerUpdate(version?: string) {
    this.hasUpdate = true;
    if (version) this.newVersion = version;
    this.notify();
  }

  /**
   * Check for updates both via Service Worker and version endpoint
   */
  public async checkForUpdate(): Promise<boolean> {
    // 1. Service Worker Update Check
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

    // 2. Fallback Version Endpoint Check
    try {
      const res = await fetch(`/version.json?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
      });
      if (res.ok) {
        const data: VersionInfo = await res.json();
        if (data.buildTime && data.buildTime > this.initialBuildTime) {
          this.triggerUpdate(data.version || APP_CURRENT_VERSION);
          return true;
        }
      }
    } catch {
      // Ignored for offline or network issues
    }

    return this.hasUpdate;
  }

  /**
   * Apply the update: activates waiting worker and reloads the page
   */
  public applyUpdate() {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // Direct hard reload
      window.location.reload();
    }
  }

  public getStatus() {
    return {
      hasUpdate: this.hasUpdate,
      newVersion: this.newVersion,
      currentVersion: APP_CURRENT_VERSION
    };
  }

  public subscribe(listener: UpdateListener): () => void {
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

export const updateService = new UpdateService();
