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

  const combinedHeaders = { ...pipeHeaders, ...(headers || {}) };
  const hasCustomHeaders = Object.keys(combinedHeaders).length > 0;

  // If already proxied
  if (cleanUrl.startsWith('/proxy') || cleanUrl.startsWith('/api/proxy')) {
    if (hasCustomHeaders && !cleanUrl.includes('headers=')) {
      const separator = cleanUrl.includes('?') ? '&' : '?';
      return `${cleanUrl}${separator}headers=${encodeURIComponent(JSON.stringify(combinedHeaders))}`;
    }
    return cleanUrl;
  }

  // If stream requires custom headers, it MUST go through proxy to bypass browser forbidden header restrictions
  if (hasCustomHeaders) {
    return `/proxy?url=${encodeURIComponent(cleanUrl)}&headers=${encodeURIComponent(JSON.stringify(combinedHeaders))}`;
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
