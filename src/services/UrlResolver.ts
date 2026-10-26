import type { MediaItem, MediaType, MediaCategory } from '../store/useAppStore';

export interface ResolveResult {
  type: MediaType | 'unsupported';
  url: string;
  title?: string;
  logo?: string;
  group?: string;
  category?: MediaCategory;
  items?: MediaItem[]; // Pour les playlists M3U complètes
  needsIframe?: boolean;
  error?: string;
  isDirectStream?: boolean;
}

export const SUPPORTED_STREAMING_PORTALS = [
  'vavoo.to',
  'voltop.net',
  'vavoo.top',
  'kool.ws',
  'oha.to',
  'oha.cx',
  'huhu.to',
  'huhu.bz'
];

export class UrlResolver {
  static async resolve(input: string): Promise<ResolveResult> {
    const rawUrl = input.trim();
    
    if (!this.isValidUrl(rawUrl)) {
      return { type: 'unsupported', url: rawUrl, error: 'URL invalide. Doit commencer par http:// ou https://' };
    }

    try {
      const urlObj = new URL(rawUrl);
      const pathname = urlObj.pathname.toLowerCase();
      const hostname = urlObj.hostname.toLowerCase();
      
      // 1. YouTube detection -> iframe embed
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        let videoId = '';
        if (hostname.includes('youtu.be')) {
          videoId = pathname.slice(1);
        } else {
          videoId = urlObj.searchParams.get('v') || '';
        }
        if (videoId) {
          return {
            type: 'movie',
            url: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
            title: `YouTube Video (${videoId})`,
            needsIframe: true
          };
        }
      }

      // 2. Twitch stream -> iframe embed
      if (hostname.includes('twitch.tv')) {
        const channel = pathname.replace(/^\//, '').split('/')[0];
        if (channel) {
          return {
            type: 'live',
            url: `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}`,
            title: `Twitch - ${channel}`,
            needsIframe: true
          };
        }
      }

      // 3. Domaines et portails de streaming spécifiques (vavoo.to, voltop.net, vavoo.top, kool.ws, oha.to, huhu.to)
      const matchedPortal = SUPPORTED_STREAMING_PORTALS.find(
        (portal) => hostname === portal || hostname.endsWith('.' + portal)
      );

      if (matchedPortal) {
        // Si l'adresse pointe directement vers une playlist ou un flux HLS
        if (pathname.endsWith('.m3u') || pathname.endsWith('.m3u8')) {
          return await this.resolveM3U(rawUrl);
        }

        // Si l'adresse pointe vers une vidéo directe MP4
        if (/\.(mp4|webm|mkv)(\?|$)/i.test(pathname)) {
          return {
            type: 'movie',
            url: rawUrl,
            title: this.cleanName(this.extractFilename(rawUrl) || 'Vidéo ' + matchedPortal),
            isDirectStream: true
          };
        }

        // Sinon, intégration comme page de flux / portail TV en direct
        const pathParts = pathname.split('/').filter(Boolean);
        const slug = pathParts[pathParts.length - 1];
        const portalLabel = matchedPortal.toUpperCase();
        const displayTitle = slug
          ? `${this.cleanName(slug)} (${matchedPortal})`
          : `Portail Direct ${portalLabel}`;

        return {
          type: 'live',
          url: rawUrl,
          title: displayTitle,
          group: 'Portail TV',
          category: 'general',
          needsIframe: true
        };
      }

      // 3. Détection M3U playlist (fichier .m3u ou .m3u8 contenant liste de chaînes)
      if (pathname.endsWith('.m3u') || (pathname.endsWith('.m3u8') && urlObj.searchParams.get('type') === 'm3u')) {
        return await this.resolveM3U(rawUrl);
      }

      // 4. Détection flux direct HLS (.m3u8)
      if (pathname.endsWith('.m3u8')) {
        return {
          type: 'live',
          url: rawUrl,
          title: this.cleanName(this.extractFilename(rawUrl) || 'Flux HLS'),
          isDirectStream: true
        };
      }

      // 5. Détection DASH (.mpd)
      if (pathname.endsWith('.mpd')) {
        return {
          type: 'live',
          url: rawUrl,
          title: this.cleanName(this.extractFilename(rawUrl) || 'Flux DASH'),
          isDirectStream: true
        };
      }

      // 6. Détection vidéo directe MP4 / WebM / MKV
      if (/\.(mp4|webm|mkv|mov|avi)(\?|$)/i.test(pathname)) {
        return {
          type: 'movie',
          url: rawUrl,
          title: this.cleanName(this.extractFilename(rawUrl) || 'Fichier Vidéo'),
          isDirectStream: true
        };
      }

      // 7. Détection audio / radio MP3 / AAC / OGG / FLAC / M4A
      if (/\.(mp3|aac|ogg|flac|m4a|pls)(\?|$)/i.test(pathname) || hostname.includes('somafm.com') || hostname.includes('icecast') || hostname.includes('shoutcast')) {
        return {
          type: 'radio',
          url: rawUrl,
          title: this.cleanName(this.extractFilename(rawUrl) || hostname || 'Station Radio'),
          group: 'Musique',
          category: 'music'
        };
      }

      // 8. Tenter de récupérer et voir si c'est du M3U textuel
      try {
        const headCheck = await fetch(rawUrl, { method: 'GET', mode: 'cors' });
        const text = await headCheck.text();
        if (text.trim().startsWith('#EXTM3U')) {
          const items = this.parseM3U(text);
          return {
            type: items[0]?.type || 'live',
            url: rawUrl,
            title: `Playlist (${items.length} flux)`,
            items
          };
        }
      } catch {
        // Ignorer l'échec direct CORS et tenter résolution page
      }

      // 9. Domaines de streaming ou pages web classiques -> page preview / iframe
      return await this.resolveStreamingPage(rawUrl);

    } catch (e: any) {
      return {
        type: 'unsupported',
        url: rawUrl,
        error: e?.message || 'Erreur lors de l\'analyse de l\'URL'
      };
    }
  }

  static async resolveM3U(url: string): Promise<ResolveResult> {
    try {
      let text = '';
      try {
        const response = await fetch(url);
        if (response.ok) {
          text = await response.text();
        }
      } catch {
        // Fallback CORS proxy
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const res = await fetch(proxyUrl);
        if (res.ok) {
          text = await res.text();
        }
      }

      if (text && text.includes('#EXTINF')) {
        const items = this.parseM3U(text);
        if (items.length > 0) {
          return {
            type: items[0]?.type || 'live',
            url,
            title: `Playlist M3U (${items.length} éléments)`,
            items
          };
        }
      }

      return {
        type: 'live',
        url,
        title: this.extractFilename(url) || 'Flux M3U8',
        isDirectStream: true
      };
    } catch {
      return {
        type: 'live',
        url,
        title: this.extractFilename(url) || 'Flux Direct',
        isDirectStream: true
      };
    }
  }

  static parseM3U(text: string): MediaItem[] {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const items: MediaItem[] = [];
    let currentMeta: Partial<MediaItem> = {};
    let currentHeaders: Record<string, string> = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('#EXTVLCOPT:')) {
        const opt = line.replace('#EXTVLCOPT:', '').trim();
        if (opt.startsWith('http-user-agent=')) {
          currentHeaders['User-Agent'] = opt.replace('http-user-agent=', '').trim();
        } else if (opt.startsWith('http-referrer=') || opt.startsWith('http-referer=')) {
          currentHeaders['Referer'] = opt.replace(/^http-referr?er=/, '').trim();
        } else if (opt.startsWith('http-origin=')) {
          currentHeaders['Origin'] = opt.replace('http-origin=', '').trim();
        }
      } else if (line.startsWith('#EXTHTTP:')) {
        try {
          const rawJson = line.replace('#EXTHTTP:', '').trim();
          const parsed = JSON.parse(rawJson);
          currentHeaders = { ...currentHeaders, ...parsed };
        } catch {}
      } else if (line.startsWith('#EXTINF:')) {
        const nameMatch = line.match(/tvg-name="([^"]*)"/) || line.match(/,(.*)$/);
        const logoMatch = line.match(/tvg-logo="([^"]*)"/);
        const groupMatch = line.match(/group-title="([^"]*)"/);
        const countryMatch = line.match(/tvg-country="([^"]*)"/);
        const languageMatch = line.match(/tvg-language="([^"]*)"/);
        const userAgentMatch = line.match(/http-user-agent="([^"]*)"/);
        const referrerMatch = line.match(/http-referrer="([^"]*)"/) || line.match(/http-referer="([^"]*)"/);

        if (userAgentMatch?.[1]) currentHeaders['User-Agent'] = userAgentMatch[1];
        if (referrerMatch?.[1]) currentHeaders['Referer'] = referrerMatch[1];

        const rawTitle = nameMatch ? (nameMatch[1] || nameMatch[0]).replace(/^,/, '').trim() : `Canal ${items.length + 1}`;
        const group = groupMatch?.[1] || 'Général';

        let category: MediaCategory = 'general';
        const lowerGroup = group.toLowerCase();
        if (lowerGroup.includes('news') || lowerGroup.includes('actu') || lowerGroup.includes('info')) category = 'news';
        else if (lowerGroup.includes('sport')) category = 'sport';
        else if (lowerGroup.includes('movie') || lowerGroup.includes('film') || lowerGroup.includes('cinema')) category = 'cinema';
        else if (lowerGroup.includes('music') || lowerGroup.includes('radio')) category = 'music';
        else if (lowerGroup.includes('kid') || lowerGroup.includes('jeunesse') || lowerGroup.includes('anim')) category = 'kids';
        else if (lowerGroup.includes('doc')) category = 'doc';

        currentMeta = {
          title: rawTitle,
          logo: logoMatch?.[1],
          group,
          category,
          country: countryMatch?.[1],
          language: languageMatch?.[1]
        };
      } else if (line.startsWith('http://') || line.startsWith('https://')) {
        let streamUrl = line;
        
        // Extract pipe-delimited headers if present: http://stream|User-Agent=...&Referer=...
        if (streamUrl.includes('|')) {
          const parts = streamUrl.split('|');
          streamUrl = parts[0].trim();
          try {
            const sp = new URLSearchParams(parts[1].trim());
            sp.forEach((v, k) => { currentHeaders[k] = v; });
          } catch {}
        }

        const isAudio = /\.(mp3|aac|ogg|flac|m4a|pls)(\?|$)/i.test(streamUrl);
        const isVOD = /\.(mp4|mkv|webm|avi)(\?|$)/i.test(streamUrl);

        let type: MediaType = 'live';
        if (isAudio) type = 'radio';
        else if (isVOD) type = 'movie';

        const finalHeaders = Object.keys(currentHeaders).length > 0 ? { ...currentHeaders } : undefined;

        items.push({
          id: `m3u-${items.length + 1}-${Date.now().toString(36)}`,
          type,
          title: currentMeta.title || `Flux ${items.length + 1}`,
          url: streamUrl,
          headers: finalHeaders,
          userAgent: finalHeaders?.['User-Agent'],
          referer: finalHeaders?.['Referer'],
          origin: finalHeaders?.['Origin'],
          logo: currentMeta.logo,
          group: currentMeta.group || 'Général',
          category: currentMeta.category || 'general',
          country: currentMeta.country,
          language: currentMeta.language
        });

        currentMeta = {};
        currentHeaders = {};
      }
    }

    return items;
  }

  static async resolveStreamingPage(url: string): Promise<ResolveResult> {
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const data = await res.json();
        const html = data.contents || '';

        // Check for direct embedded iframe
        const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
        if (iframeMatch) {
          return {
            type: 'movie',
            url: this.normalizeUrl(iframeMatch[1], url),
            title: this.extractTitle(html) || 'Page Vidéo',
            needsIframe: true
          };
        }

        // Check for m3u8 or mp4 in the source code
        const directMatch = html.match(/["'](https?:\/\/[^"']+\.(m3u8|mp4|webm))["']/i);
        if (directMatch) {
          return {
            type: 'movie',
            url: directMatch[1],
            title: this.extractTitle(html) || 'Flux résolu'
          };
        }
      }
    } catch {
      // Proxy failed or CORS blocked
    }

    // Fallback: render as iframe
    return {
      type: 'movie',
      url,
      title: this.cleanName(new URL(url).hostname),
      needsIframe: true
    };
  }

  static isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  static extractTitle(html: string): string | null {
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match?.[1]?.trim() || null;
  }

  static extractFilename(url: string): string | null {
    try {
      const pathname = new URL(url).pathname;
      const filename = pathname.split('/').filter(Boolean).pop();
      return filename?.replace(/\.[^.]+$/, '') || null;
    } catch {
      return null;
    }
  }

  static cleanName(name: string): string {
    return decodeURIComponent(name)
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  static normalizeUrl(href: string, base: string): string {
    try {
      return new URL(href, base).toString();
    } catch {
      return href;
    }
  }
}
