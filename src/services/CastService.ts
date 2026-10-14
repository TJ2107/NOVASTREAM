/**
 * NOVASTREAM Cast Service
 * Unified casting controller supporting:
 * 1. Google Cast SDK (Chromecast, Google TV, Android TV, Nest Hub)
 * 2. W3C Remote Playback API (Android Chrome, Smart TVs, Miracast)
 * 3. WebKit AirPlay (Apple TV, Safari macOS/iOS, AirPlay 2 Smart TVs)
 * 4. Local network direct streaming & DLNA links
 */

declare global {
  interface Window {
    __onGCastApiAvailable?: (isAvailable: boolean) => void;
    cast?: any;
    chrome?: any;
  }
}

export type CastTargetType = 'chromecast' | 'remote_playback' | 'airplay' | 'duo' | 'dlna';

export interface CastDeviceInfo {
  id: string;
  name: string;
  type: CastTargetType;
  isConnected: boolean;
  isAvailable: boolean;
  details?: string;
}

export interface CastMediaOptions {
  url: string;
  title: string;
  poster?: string;
  contentType?: string;
  isLive?: boolean;
  currentTime?: number;
}

type CastListener = () => void;

class CastService {
  private isGoogleCastInitialized = false;
  private isGoogleCastAvailable = false;
  private currentSession: any = null;
  private remotePlayer: any = null;
  private remotePlayerController: any = null;
  private listeners: Set<CastListener> = new Set();
  private activeDeviceName: string | null = null;
  private isCasting = false;
  private castType: CastTargetType | null = null;

  constructor() {
    this.setupGoogleCastLifecycle();
  }

  private setupGoogleCastLifecycle() {
    if (typeof window === 'undefined') return;

    // Check if already available
    if (window.cast?.framework) {
      this.initGoogleCastContext();
    } else {
      const existingCallback = window.__onGCastApiAvailable;
      window.__onGCastApiAvailable = (isAvailable: boolean) => {
        if (existingCallback) existingCallback(isAvailable);
        if (isAvailable) {
          this.initGoogleCastContext();
        }
      };
    }
  }

  private initGoogleCastContext() {
    if (this.isGoogleCastInitialized) return;
    try {
      const cast = window.cast;
      const chrome = window.chrome;
      if (!cast?.framework || !chrome?.cast) return;

      const context = cast.framework.CastContext.getInstance();
      context.setOptions({
        receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        resumeSavedSession: true
      });

      this.remotePlayer = new cast.framework.RemotePlayer();
      this.remotePlayerController = new cast.framework.RemotePlayerController(this.remotePlayer);

      this.isGoogleCastInitialized = true;
      this.isGoogleCastAvailable = true;

      // Listen to Cast State
      context.addEventListener(
        cast.framework.CastContextEventType.CAST_STATE_CHANGED,
        (event: any) => {
          this.handleCastStateChange(event.castState);
        }
      );

      // Listen to Session State
      context.addEventListener(
        cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
        (event: any) => {
          this.handleSessionStateChange(event);
        }
      );

      this.notifyListeners();
    } catch (err) {
      console.warn('[NOVASTREAM Cast] Failed to initialize Google Cast context:', err);
    }
  }

  private handleCastStateChange(castState: any) {
    const cast = window.cast;
    if (!cast) return;

    if (castState === cast.framework.CastState.CONNECTED) {
      this.isCasting = true;
      this.castType = 'chromecast';
      const session = cast.framework.CastContext.getInstance().getCurrentSession();
      if (session) {
        this.currentSession = session;
        this.activeDeviceName = session.getCastDevice()?.friendlyName || 'Chromecast';
      }
    } else if (castState === cast.framework.CastState.NOT_CONNECTED || castState === cast.framework.CastState.NO_DEVICES_AVAILABLE) {
      if (this.castType === 'chromecast') {
        this.isCasting = false;
        this.activeDeviceName = null;
        this.currentSession = null;
      }
    }
    this.notifyListeners();
  }

  private handleSessionStateChange(event: any) {
    const cast = window.cast;
    if (!cast) return;

    const SessionState = cast.framework.SessionState;
    if (event.sessionState === SessionState.SESSION_STARTED || event.sessionState === SessionState.SESSION_RESUMED) {
      this.currentSession = event.session;
      this.isCasting = true;
      this.castType = 'chromecast';
      this.activeDeviceName = event.session?.getCastDevice()?.friendlyName || 'Chromecast';
    } else if (event.sessionState === SessionState.SESSION_ENDED) {
      if (this.castType === 'chromecast') {
        this.isCasting = false;
        this.activeDeviceName = null;
        this.currentSession = null;
      }
    }
    this.notifyListeners();
  }

  /**
   * Check what casting capabilities exist on the current browser/device
   */
  public getCapabilities(videoElement?: HTMLVideoElement | null) {
    const hasGoogleCast = !!(this.isGoogleCastAvailable || window.cast?.framework || window.chrome?.cast);
    const hasRemotePlayback = typeof window !== 'undefined' && 'RemotePlayback' in window && !!(videoElement && (videoElement as any).remote);
    const hasAirPlay = typeof window !== 'undefined' && !!(videoElement && (videoElement as any).webkitShowPlaybackTargetPicker);

    return {
      googleCast: hasGoogleCast,
      remotePlayback: hasRemotePlayback,
      airPlay: hasAirPlay,
      duo: true
    };
  }

  /**
   * Cast to Google Cast (Chromecast)
   */
  public async castViaGoogleCast(options: CastMediaOptions): Promise<boolean> {
    if (!window.cast?.framework) {
      throw new Error("L'API Google Cast n'est pas encore disponible sur ce navigateur.");
    }

    try {
      const cast = window.cast;
      const chrome = window.chrome;
      const context = cast.framework.CastContext.getInstance();

      // Request user session (opens native cast dialog)
      let session: any = null;
      try {
        await context.requestSession();
        session = context.getCurrentSession();
      } catch (sessionErr: any) {
        const errorMsg = String(sessionErr?.message || sessionErr?.description || sessionErr?.error || sessionErr || '');
        if (
          sessionErr === 'cancel' ||
          sessionErr === 'session_error' ||
          errorMsg.includes('cancel') ||
          errorMsg.includes('session_error') ||
          sessionErr?.code === 'session_error' ||
          sessionErr?.error === 'session_error'
        ) {
          console.log('[NOVASTREAM Cast] Dialogue Cast fermé ou aucune session active.');
          return false;
        }
        console.warn('[NOVASTREAM Cast] Session request non aboutie:', errorMsg);
        return false;
      }

      if (!session) return false;

      this.currentSession = session;
      this.isCasting = true;
      this.castType = 'chromecast';
      this.activeDeviceName = session.getCastDevice()?.friendlyName || 'Chromecast';

      // Build media load request
      // Ensure streams are routed through server proxy if external to avoid CORS blocks on Chromecast
      let streamUrl = options.url;
      if (streamUrl.startsWith('http')) {
        // If it's an external URL, route through our server-side proxy so Chromecast gets CORS headers and anti-403 bypass
        streamUrl = `${window.location.origin}/api/proxy?url=${encodeURIComponent(streamUrl)}`;
      } else if (!streamUrl.startsWith('/')) {
        streamUrl = `/${streamUrl}`;
      }
      const absoluteUrl = streamUrl.startsWith('http')
        ? streamUrl
        : `${window.location.origin}${streamUrl}`;

      const contentType = options.contentType || (options.url.includes('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp4');
      
      // Chromecast requires absolute URL and content type in MediaInfo
      const mediaInfo = new chrome.cast.media.MediaInfo(absoluteUrl, contentType);
      mediaInfo.contentUrl = absoluteUrl; // Explicitly set contentUrl
      mediaInfo.contentType = contentType; // Explicitly set contentType

      mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
      mediaInfo.metadata.title = options.title || 'NOVASTREAM Stream';
      mediaInfo.metadata.subtitle = 'Diffusé depuis NOVASTREAM';

      if (options.poster) {
        mediaInfo.metadata.images = [{ url: options.poster }];
      }

      if (options.isLive) {
        mediaInfo.streamType = chrome.cast.media.StreamType.LIVE;
      } else {
        mediaInfo.streamType = chrome.cast.media.StreamType.BUFFERED;
      }

      const request = new chrome.cast.media.LoadRequest(mediaInfo);
      if (options.currentTime && options.currentTime > 0) {
        request.currentTime = options.currentTime;
      }
      request.autoplay = true;

      console.log('[NOVASTREAM Cast] Loading media:', mediaInfo);
      
      try {
        const loadPromise = session.loadMedia(request);
        const result = await loadPromise;
        console.log('[NOVASTREAM Cast] Media load successful:', result);
        this.notifyListeners();
        return true;
      } catch (loadErr: any) {
        const loadErrMsg = String(loadErr?.message || loadErr?.description || loadErr || '');
        if (loadErrMsg.includes('cancel') || loadErrMsg.includes('session_error')) {
          console.log('[NOVASTREAM Cast] Chargement média annulé ou interrompu.');
          return false;
        }
        console.warn('[NOVASTREAM Cast] session.loadMedia warning:', loadErr);
        return false;
      }
    } catch (err: any) {
      const errorMsg = String(err?.message || err?.description || err?.error || err || '');
      const isExpected =
        err === 'cancel' ||
        err === 'session_error' ||
        errorMsg.includes('cancel') ||
        errorMsg.includes('session_error') ||
        err?.code === 'session_error' ||
        err?.error === 'session_error';

      if (isExpected) {
        console.log('[NOVASTREAM Cast] Cast fermé ou session annulée.');
        return false;
      }
      console.warn('[NOVASTREAM Cast] Notification Cast:', errorMsg);
      return false;
    }
  }

  /**
   * Cast via W3C Remote Playback API (Android Chrome / Smart TV / Miracast)
   */
  public async castViaRemotePlayback(videoElement: HTMLVideoElement): Promise<boolean> {
    const remote = (videoElement as any).remote;
    if (!remote || typeof remote.prompt !== 'function') {
      throw new Error("L'API Remote Playback n'est pas supportée sur cet appareil.");
    }

    try {
      this.castType = 'remote_playback';
      // Listen to state changes
      if (!remote.onstatechange) {
        remote.onstatechange = () => {
          if (remote.state === 'connected') {
            this.isCasting = true;
            this.activeDeviceName = 'Écran sans fil connecté';
          } else if (remote.state === 'disconnected') {
            this.isCasting = false;
            this.activeDeviceName = null;
          }
          this.notifyListeners();
        };
      }

      await remote.prompt();
      this.isCasting = true;
      this.activeDeviceName = 'Écran externe connecté';
      this.notifyListeners();
      return true;
    } catch (err: any) {
      const errMsg = String(err?.message || err || '');
      if (err?.name === 'NotAllowedError' || errMsg.includes('dismissed') || errMsg.includes('cancel')) {
        console.log('[NOVASTREAM Cast] Remote Playback prompt dismissed by user.');
        return false;
      }
      console.warn('[NOVASTREAM Cast] Remote Playback prompt cancelled or failed:', err);
      return false;
    }
  }

  /**
   * Cast via WebKit AirPlay (Apple TV / Safari iOS / macOS)
   */
  public castViaAirPlay(videoElement: HTMLVideoElement): boolean {
    const picker = (videoElement as any).webkitShowPlaybackTargetPicker;
    if (typeof picker !== 'function') {
      throw new Error("AirPlay n'est disponible que sur Safari (Apple TV / iOS / macOS).");
    }

    try {
      picker.call(videoElement);
      this.castType = 'airplay';
      this.activeDeviceName = 'Apple TV / AirPlay';
      this.notifyListeners();
      return true;
    } catch (err) {
      console.warn('[NOVASTREAM Cast] AirPlay picker failed:', err);
      return false;
    }
  }

  /**
   * Disconnect any current cast session
   */
  public async stopCasting(videoElement?: HTMLVideoElement | null): Promise<void> {
    try {
      if (this.castType === 'chromecast' && window.cast?.framework) {
        const context = window.cast.framework.CastContext.getInstance();
        context.endCurrentSession(true);
      } else if (this.castType === 'remote_playback' && videoElement) {
        const remote = (videoElement as any).remote;
        if (remote?.prompt) {
          await remote.prompt();
        }
      }
    } catch (err) {
      console.warn('[NOVASTREAM Cast] Error disconnecting:', err);
    } finally {
      this.isCasting = false;
      this.activeDeviceName = null;
      this.castType = null;
      this.notifyListeners();
    }
  }

  /**
   * Remote playback controls when casting to Google Cast
   */
  public play() {
    if (this.remotePlayerController && this.isCasting) {
      this.remotePlayerController.playOrPause();
    }
  }

  public pause() {
    if (this.remotePlayerController && this.isCasting) {
      this.remotePlayerController.playOrPause();
    }
  }

  public seek(seconds: number) {
    if (this.remotePlayer && this.remotePlayerController && this.isCasting) {
      this.remotePlayer.currentTime = seconds;
      this.remotePlayerController.seek();
    }
  }

  public setVolume(volLevel: number) {
    if (this.remotePlayer && this.remotePlayerController && this.isCasting) {
      this.remotePlayer.volumeLevel = Math.max(0, Math.min(1, volLevel));
      this.remotePlayerController.setVolumeLevel();
    }
  }

  public getActiveDevice(): { isCasting: boolean; deviceName: string | null; type: CastTargetType | null } {
    return {
      isCasting: this.isCasting,
      deviceName: this.activeDeviceName,
      type: this.castType
    };
  }

  public subscribe(listener: CastListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('[NOVASTREAM Cast] Listener error:', err);
      }
    });
  }
}

export const castService = new CastService();
