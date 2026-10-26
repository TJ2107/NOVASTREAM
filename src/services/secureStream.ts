import { useAppStore } from '../store/useAppStore';

/**
 * Gestionnaire de sécurisation des flux vidéo & audio
 * Solution 1 : Test HTTPS direct (remplacement http:// -> https://)
 * Solution 2 : Proxy HTTPS Cloudflare Worker / Serveur Node (/proxy ou /api/proxy) avec réécriture m3u8
 */

export const secureUrl = (u: string, headers?: Record<string, string>): string => {
  if (!u) return u;

  // Extract any pipe syntax present in the URL (e.g. url|User-Agent=VLC&Referer=...)
  let pipeHeaders: Record<string, string> = {};
  let cleanUrl = u;
  if (u.includes('|')) {
    const parts = u.split('|');
    cleanUrl = parts[0].trim();
    try {
      const sp = new URLSearchParams(parts[1].trim());
      sp.forEach((v, k) => { pipeHeaders[k] = v; });
    } catch {}
  }

  // Retrieve global proxy settings from store if active
  let globalHeaders: Record<string, string> = {};
  let forceAll = false;
  try {
    const store = useAppStore.getState();
    const cfg = store?.proxyConfig;
    if (cfg && cfg.enabled) {
      forceAll = !!cfg.forceAllStreams;
      if (cfg.defaultUserAgent?.trim()) globalHeaders['User-Agent'] = cfg.defaultUserAgent.trim();
      if (cfg.defaultReferer?.trim()) globalHeaders['Referer'] = cfg.defaultReferer.trim();
      if (cfg.defaultOrigin?.trim()) globalHeaders['Origin'] = cfg.defaultOrigin.trim();
      if (cfg.defaultCookies?.trim()) globalHeaders['Cookie'] = cfg.defaultCookies.trim();
      if (Array.isArray(cfg.customHeadersList)) {
        cfg.customHeadersList.forEach((h) => {
          if (h.key?.trim() && h.value?.trim()) {
            globalHeaders[h.key.trim()] = h.value.trim();
          }
        });
      }
    }
  } catch {}

  // Merging order: Global defaults < Pipe headers < Explicit item headers
  const combinedHeaders = { ...globalHeaders, ...pipeHeaders, ...(headers || {}) };
  const hasCustomHeaders = Object.keys(combinedHeaders).length > 0;

  // If already proxied
  if (cleanUrl.startsWith('/proxy') || cleanUrl.startsWith('/api/proxy')) {
    if (hasCustomHeaders && !cleanUrl.includes('headers=')) {
      const separator = cleanUrl.includes('?') ? '&' : '?';
      return `${cleanUrl}${separator}headers=${encodeURIComponent(JSON.stringify(combinedHeaders))}`;
    }
    return cleanUrl;
  }

  // If stream requires custom headers or global forcing is active, route through proxy
  if (hasCustomHeaders || forceAll) {
    const headersParam = hasCustomHeaders ? `&headers=${encodeURIComponent(JSON.stringify(combinedHeaders))}` : '';
    return `/proxy?url=${encodeURIComponent(cleanUrl)}${headersParam}`;
  }

  // Force server proxy for unencrypted HTTP streams
  if (cleanUrl.startsWith('http://')) {
    return `/proxy?url=${encodeURIComponent(cleanUrl)}`;
  }

  return cleanUrl;
};

/**
 * Solution 1 : Tester si le serveur du fournisseur gère nativement le HTTPS.
 * Tente un probe HEAD en HTTPS. Si succès, retourne l'adresse HTTPS directe.
 */
export async function testHttpsAlternative(httpUrl: string): Promise<{ supported: boolean; url: string }> {
  if (!httpUrl || !httpUrl.startsWith('http://')) {
    return { supported: true, url: httpUrl };
  }

  const httpsUrl = httpUrl.replace(/^http:\/\//i, 'https://');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(httpsUrl, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'cors'
    });
    clearTimeout(timeout);

    if (res.ok) {
      console.log('[NOVASTREAM Stream] Le serveur IPTV supporte nativement le HTTPS:', httpsUrl);
      return { supported: true, url: httpsUrl };
    }
  } catch {
    // Échec de la connexion HTTPS directe
  }

  return { supported: false, url: httpUrl };
}

export interface ProxyProbeResult {
  ok: boolean;
  status: number;
  statusText: string;
  contentType: string;
  latencyMs: number;
  headersSent?: Record<string, string>;
  error?: string;
}

/**
 * Diagnostic tool: Probe a stream through the proxy with specific custom headers
 */
export async function testProxyStreamConnection(
  streamUrl: string,
  headers?: Record<string, string>
): Promise<ProxyProbeResult> {
  const startTime = Date.now();
  try {
    const headersParam = headers && Object.keys(headers).length > 0 ? `&headers=${encodeURIComponent(JSON.stringify(headers))}` : '';
    const probeUrl = `/api/proxy?url=${encodeURIComponent(streamUrl.trim())}&test=1${headersParam}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(probeUrl, {
      signal: controller.signal
    });
    clearTimeout(timer);

    const latency = Date.now() - startTime;

    if (res.headers.get('content-type')?.includes('application/json')) {
      const data = await res.json();
      return {
        ok: data.ok ?? res.ok,
        status: data.status ?? res.status,
        statusText: data.statusText ?? res.statusText,
        contentType: data.contentType || res.headers.get('content-type') || 'unknown',
        latencyMs: data.latencyMs ?? latency,
        headersSent: data.headersSent || headers
      };
    }

    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      contentType: res.headers.get('content-type') || 'unknown',
      latencyMs: latency,
      headersSent: headers
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      statusText: err?.name === 'AbortError' ? 'Délai d\'attente dépassé (Timeout)' : 'Erreur réseau',
      contentType: 'inconnu',
      latencyMs: Date.now() - startTime,
      error: err?.message || 'Impossible de joindre le proxy'
    };
  }
}
