import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function rewriteM3u8(content: string, baseUrl: string, customHeadersStr?: string): string {
  const extraParam = customHeadersStr ? `&headers=${encodeURIComponent(customHeadersStr)}` : '';
  const lines = content.split('\n');
  return lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    if (trimmed.startsWith('#')) {
      // Rewrite URI attributes in tags such as #EXT-X-KEY, #EXT-X-MAP, #EXT-X-MEDIA, #EXT-X-I-FRAME-STREAM-INF
      return line.replace(/URI="([^"]+)"/g, (match, uri) => {
        try {
          const abs = new URL(uri, baseUrl).href;
          return `URI="/api/proxy?url=${encodeURIComponent(abs)}${extraParam}"`;
        } catch {
          return match;
        }
      });
    }

    // Segment or sub-playlist line
    try {
      const abs = new URL(trimmed, baseUrl).href;
      return `/api/proxy?url=${encodeURIComponent(abs)}${extraParam}`;
    } catch {
      return line;
    }
  }).join('\n');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // CORS preflight for proxy
  app.options(['/api/proxy', '/proxy'], (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.sendStatus(204);
  });

  // Universal Stream & Playlist Proxy endpoint (bypasses CORS, Mixed Content, and CDN 403 blocks with custom stream headers)
  app.get(['/api/proxy', '/proxy'], async (req, res) => {
    const rawTargetUrl = req.query.url as string;
    if (!rawTargetUrl) {
      return res.status(400).send('Missing url parameter');
    }

    let targetUrl = rawTargetUrl;
    try {
      let customHeaders: Record<string, string> = {};

      // 1. Support pipe syntax in URL: e.g. http://server.com/live.m3u8|User-Agent=VLC&Referer=https://tv.com
      if (rawTargetUrl.includes('|')) {
        const parts = rawTargetUrl.split('|');
        targetUrl = parts[0].trim();
        try {
          const sp = new URLSearchParams(parts[1].trim());
          sp.forEach((val, key) => {
            customHeaders[key] = val;
          });
        } catch {}
      }

      // 2. Support explicit headers parameter via query: JSON or URL encoded key=value
      if (req.query.headers) {
        try {
          const rawH = req.query.headers as string;
          if (rawH.startsWith('{')) {
            const parsed = JSON.parse(rawH);
            customHeaders = { ...customHeaders, ...parsed };
          } else {
            const sp = new URLSearchParams(rawH);
            sp.forEach((val, key) => {
              customHeaders[key] = val;
            });
          }
        } catch (e) {
          console.warn('Could not parse custom headers param:', e);
        }
      }

      // Also support standalone header query parameters: userAgent, referer, origin, authorization, cookie, cookies
      if (req.query.userAgent) customHeaders['User-Agent'] = req.query.userAgent as string;
      if (req.query.referer) customHeaders['Referer'] = req.query.referer as string;
      if (req.query.origin) customHeaders['Origin'] = req.query.origin as string;
      if (req.query.authorization) customHeaders['Authorization'] = req.query.authorization as string;
      if (req.query.cookie) customHeaders['Cookie'] = req.query.cookie as string;
      if (req.query.cookies) customHeaders['Cookie'] = req.query.cookies as string;

      let parsedTarget: URL;
      try {
        parsedTarget = new URL(targetUrl);
      } catch {
        return res.status(400).send('Invalid url parameter');
      }

      // Build strategies: If custom headers are provided, they take priority #1
      const strategies: Array<{ headers: Record<string, string> }> = [];

      if (Object.keys(customHeaders).length > 0) {
        strategies.push({
          headers: {
            'Accept': '*/*',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Connection': 'keep-alive',
            ...customHeaders
          }
        });
      }

      // Default fallback strategies to avoid 403 Forbidden from strict CDNs (Akamai, Cloudflare, Fastly, Infomaniak)
      strategies.push(
        // Strategy 1: VLC media player (accepted by 99% of IPTV/HLS streams without origin checks)
        {
          headers: {
            'User-Agent': 'VLC/3.0.20 LibVLC/3.0.20',
            'Accept': '*/*',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Connection': 'keep-alive'
          }
        },
        // Strategy 2: Modern Chrome Desktop with matched Origin and Referer
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
            'Referer': `${parsedTarget.origin}/`,
            'Origin': parsedTarget.origin
          }
        },
        // Strategy 3: Specialized BozzTV / Giniko referer for African streams
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': '*/*',
            'Referer': 'https://giniko.com/',
            'Origin': 'https://giniko.com'
          }
        },
        // Strategy 4: AppleCoreMedia (iPad/AppleTV Safari native HLS player)
        {
          headers: {
            'User-Agent': 'AppleCoreMedia/1.0.0.19F72 (iPad; U; CPU OS 15_5 like Mac OS X; fr_fr)',
            'Accept': '*/*'
          }
        },
        // Strategy 5: Raw Minimalist request (no referer or extra headers)
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': '*/*'
          }
        }
      );

      let response: Response | null = null;
      let lastError: any = null;

      // Client range header forwarding for video seeking & HLS chunks
      const clientRange = req.headers.range;

      for (const strat of strategies) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000);

          const fetchHeaders: Record<string, string> = {
            ...strat.headers,
            ...(clientRange ? { Range: clientRange } : {})
          };

          response = await fetch(targetUrl, {
            redirect: 'follow',
            headers: fetchHeaders,
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            break;
          }
        } catch (e) {
          lastError = e;
        }
      }

      // Diagnostic probe mode: returns json report of the upstream response
      if (req.query.test === '1' || req.path === '/api/proxy/test') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.setHeader('Content-Type', 'application/json');
        return res.json({
          ok: !!(response && response.ok),
          status: response?.status || 502,
          statusText: response?.statusText || (lastError?.message || 'Upstream Error'),
          contentType: response?.headers.get('content-type') || 'unknown',
          contentLength: response?.headers.get('content-length') || null,
          headersSent: strategies[0]?.headers || {},
          headersReceived: response ? Object.fromEntries(response.headers.entries()) : {}
        });
      }

      if (!response || !response.ok) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');
        return res.status(response?.status || 502).send(`Proxy upstream fetch failed: ${lastError?.message || 'Bad Gateway'}`);
      }

      const contentType = response.headers.get('content-type') || '';
      const isM3u8 =
        targetUrl.toLowerCase().includes('.m3u8') ||
        contentType.includes('mpegurl') ||
        contentType.includes('m3u8');

      const customHeadersStr = Object.keys(customHeaders).length > 0 ? JSON.stringify(customHeaders) : undefined;

      if (isM3u8) {
        const text = await response.text();
        const upper = text.toUpperCase();
        if (upper.includes('#EXTM3U') || upper.includes('#EXTINF') || upper.includes('#EXT-X-')) {
          const rewritten = rewriteM3u8(text, targetUrl, customHeadersStr);
          res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Headers', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          return res.send(rewritten);
        }
        res.setHeader('Content-Type', contentType || 'text/plain');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.send(text);
      }

      // Handle HTML pages for unencrypted web portals so relative assets are proxied too
      const isHtml = contentType.includes('text/html');
      if (isHtml) {
        let htmlText = await response.text();
        const parsedTarget = new URL(targetUrl);
        const baseOrigin = parsedTarget.origin;
        const extra = customHeadersStr ? `&headers=${encodeURIComponent(customHeadersStr)}` : '';

        // Inject base tag or rewrite links to ensure relative assets route through /api/proxy
        htmlText = htmlText.replace(/(href|src)="([^"]+)"/g, (match, attr, val) => {
          if (val.startsWith('http://') || val.startsWith('https://')) {
            return `${attr}="/api/proxy?url=${encodeURIComponent(val)}${extra}"`;
          } else if (val.startsWith('//')) {
            return `${attr}="/api/proxy?url=${encodeURIComponent('https:' + val)}${extra}"`;
          } else if (val.startsWith('/')) {
            const absoluteUrl = `${baseOrigin}${val}`;
            return `${attr}="/api/proxy?url=${encodeURIComponent(absoluteUrl)}${extra}"`;
          }
          return match;
        });

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.removeHeader('X-Frame-Options');
        res.removeHeader('Content-Security-Policy');
        return res.send(htmlText);
      }

      // Binary media data (video .ts, .m4s, .mp4, audio .mp3, .aac, crypto keys)
      res.status(response.status);
      response.headers.forEach((value, key) => {
        const lower = key.toLowerCase();
        if (!['content-encoding', 'transfer-encoding', 'content-length'].includes(lower)) {
          res.setHeader(key, value);
        }
      });

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Accept-Ranges', 'bytes');

      // Real-time zero-copy streaming for continuous live streams and large chunks
      if (response.body) {
        const nodeStream = Readable.fromWeb(response.body as any);
        nodeStream.pipe(res);
        req.on('close', () => {
          nodeStream.destroy();
        });
      } else {
        res.end();
      }
    } catch (err: any) {
      console.error('Proxy error for URL:', targetUrl, err?.message || err);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(502).send(`Proxy fetch error: ${err?.message || 'Unknown error'}`);
    }
  });

  // Vite development middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true }
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NOVASTREAM Server running on http://localhost:${PORT}`);
  });
}

startServer();
