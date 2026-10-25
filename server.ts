import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function rewriteM3u8(content: string, baseUrl: string): string {
  const lines = content.split('\n');
  return lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    if (trimmed.startsWith('#')) {
      // Rewrite URI attributes in tags such as #EXT-X-KEY, #EXT-X-MAP, #EXT-X-MEDIA, #EXT-X-I-FRAME-STREAM-INF
      return line.replace(/URI="([^"]+)"/g, (match, uri) => {
        try {
          const abs = new URL(uri, baseUrl).href;
          return `URI="/api/proxy?url=${encodeURIComponent(abs)}"`;
        } catch {
          return match;
        }
      });
    }

    // Segment or sub-playlist line
    try {
      const abs = new URL(trimmed, baseUrl).href;
      return `/api/proxy?url=${encodeURIComponent(abs)}`;
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

  // Universal Stream & Playlist Proxy endpoint (bypasses CORS, Mixed Content, and CDN 403 blocks)
  app.get(['/api/proxy', '/proxy'], async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).send('Missing url parameter');
    }

    try {
      let parsedTarget: URL;
      try {
        parsedTarget = new URL(targetUrl);
      } catch {
        return res.status(400).send('Invalid url parameter');
      }

      // Strategies to avoid 403 Forbidden from strict CDNs (Akamai, Cloudflare, Fastly, Infomaniak)
      const strategies: Array<{ headers: Record<string, string> }> = [
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
        // Strategy 5: La Chaîne L'Équipe specific referer
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Referer': 'https://www.lequipe.fr/',
            'Origin': 'https://www.lequipe.fr'
          }
        },
        // Strategy 6: Raw Minimalist request (no referer or extra headers)
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': '*/*'
          }
        }
      ];

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

      if (isM3u8) {
        const text = await response.text();
        const upper = text.toUpperCase();
        if (upper.includes('#EXTM3U') || upper.includes('#EXTINF') || upper.includes('#EXT-X-')) {
          const rewritten = rewriteM3u8(text, targetUrl);
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

        // Inject base tag or rewrite links to ensure relative assets route through /api/proxy
        htmlText = htmlText.replace(/(href|src)="([^"]+)"/g, (match, attr, val) => {
          if (val.startsWith('http://') || val.startsWith('https://')) {
            return `${attr}="/api/proxy?url=${encodeURIComponent(val)}"`;
          } else if (val.startsWith('//')) {
            return `${attr}="/api/proxy?url=${encodeURIComponent('https:' + val)}"`;
          } else if (val.startsWith('/')) {
            const absoluteUrl = `${baseOrigin}${val}`;
            return `${attr}="/api/proxy?url=${encodeURIComponent(absoluteUrl)}"`;
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
