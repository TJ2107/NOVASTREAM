/**
 * Gestionnaire de sécurisation des flux vidéo & audio
 * Solution 1 : Test HTTPS direct (remplacement http:// -> https://)
 * Solution 2 : Proxy HTTPS Cloudflare Worker / Serveur Node (/proxy ou /api/proxy) avec réécriture m3u8
 */

export const secureUrl = (u: string): string => {
  if (!u) return u;

  // Si l'URL passe déjà par notre proxy
  if (u.startsWith('/proxy') || u.startsWith('/api/proxy')) {
    return u;
  }

  // Si on est sur une page en HTTPS et que le flux est en HTTP (évite le blocage Mixed Content du navigateur)
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  if (isHttps && u.startsWith('http://')) {
    return `/proxy?url=${encodeURIComponent(u)}`;
  }

  return u;
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
