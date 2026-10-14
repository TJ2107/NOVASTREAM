// Cloudflare Pages Function for /api/proxy
// Enables native serverless HLS/IPTV/Xtream proxy directly on Cloudflare Edge

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

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    }
  });
};

export const onRequestGet = async (context: { request: Request }) => {
  const reqUrl = new URL(context.request.url);
  const targetUrl = reqUrl.searchParams.get('url');

  if (!targetUrl) {
    return new Response('Missing url parameter', {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  let parsedTarget: URL;
  try {
    parsedTarget = new URL(targetUrl);
  } catch {
    return new Response('Invalid url parameter', {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  // Strategies to avoid 403 Forbidden from strict CDNs (Akamai, Cloudflare, Fastly, Infomaniak)
  const headersList: Record<string, string>[] = [
    {
      'User-Agent': 'VLC/3.0.20 LibVLC/3.0.20',
      'Accept': '*/*',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Connection': 'keep-alive'
    },
    {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      'Referer': `${parsedTarget.protocol}//${parsedTarget.host}/`,
      'Origin': `${parsedTarget.protocol}//${parsedTarget.host}`
    }
  ];

  let upstreamResponse: Response | null = null;
  let lastError: any = null;

  for (const hdrs of headersList) {
    try {
      const resp = await fetch(targetUrl, {
        headers: hdrs,
        redirect: 'follow'
      });
      if (resp.ok || resp.status === 206) {
        upstreamResponse = resp;
        break;
      }
      if (!upstreamResponse) {
        upstreamResponse = resp;
      }
    } catch (e) {
      lastError = e;
    }
  }

  if (!upstreamResponse) {
    return new Response(`Proxy fetch failed: ${lastError?.message || 'Unknown network error'}`, {
      status: 502,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  const contentType = upstreamResponse.headers.get('content-type') || '';
  const isM3u8 =
    targetUrl.toLowerCase().includes('.m3u8') ||
    contentType.includes('application/vnd.apple.mpegurl') ||
    contentType.includes('application/x-mpegurl');

  const responseHeaders = new Headers();
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Headers', '*');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  responseHeaders.set('Accept-Ranges', 'bytes');

  if (isM3u8) {
    const text = await upstreamResponse.text();
    const rewritten = rewriteM3u8(text, targetUrl);
    responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    return new Response(rewritten, {
      status: 200,
      headers: responseHeaders
    });
  }

  // Stream video segments or binary content
  if (contentType) {
    responseHeaders.set('Content-Type', contentType);
  }
  const contentRange = upstreamResponse.headers.get('content-range');
  if (contentRange) {
    responseHeaders.set('Content-Range', contentRange);
  }
  const contentLength = upstreamResponse.headers.get('content-length');
  if (contentLength) {
    responseHeaders.set('Content-Length', contentLength);
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders
  });
};
