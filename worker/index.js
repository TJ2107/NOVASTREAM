export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS" && (url.pathname === "/proxy" || url.pathname === "/api/proxy")) {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        },
      });
    }

    if (url.pathname !== "/proxy" && url.pathname !== "/api/proxy") {
      return env.ASSETS ? env.ASSETS.fetch(request) : new Response("Not found", { status: 404 });
    }

    // Empêche l'usage de ton proxy par d'autres sites
    const origin = request.headers.get("Origin") || request.headers.get("Referer") || "";
    if (origin && !origin.startsWith(url.origin) && !origin.includes("localhost") && !origin.includes("127.0.0.1") && !origin.includes("run.app")) {
      return new Response("Forbidden", { status: 403 });
    }

    const target = url.searchParams.get("url");
    if (!target || !/^https?:\/\//i.test(target)) {
      return new Response("Bad url", { status: 400 });
    }

    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "*/*",
      "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
    };
    const range = request.headers.get("Range");
    if (range) headers["Range"] = range;

    let upstream;
    try {
      upstream = await fetch(target, { headers, redirect: "follow" });
      // If 403 or 401, retry with VLC User Agent (widely accepted by IPTV servers)
      if (!upstream.ok && (upstream.status === 403 || upstream.status === 401)) {
        upstream = await fetch(target, {
          headers: {
            "User-Agent": "VLC/3.0.20 LibVLC/3.0.20",
            "Accept": "*/*",
            ...(range ? { "Range": range } : {}),
          },
          redirect: "follow",
        });
      }
    } catch (err) {
      return new Response("Proxy error: " + (err?.message || "Failed to fetch upstream"), {
        status: 502,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    const type = upstream.headers.get("content-type") || "";
    const isPlaylist =
      /mpegurl/i.test(type) || /\.m3u8(\?|$)/i.test(target);

    const out = new Headers(upstream.headers);
    out.set("Access-Control-Allow-Origin", "*");
    out.set("Access-Control-Allow-Headers", "*");
    out.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    out.set("Accept-Ranges", "bytes");

    const proxyPath = url.pathname === "/api/proxy" ? "/api/proxy" : "/proxy";

    if (isPlaylist) {
      const base = upstream.url || target;
      const proxify = (u) =>
        `${proxyPath}?url=${encodeURIComponent(new URL(u, base).href)}`;
      const text = (await upstream.text())
        .split("\n")
        .map((line) => {
          const l = line.trim();
          if (!l) return line;
          if (l.startsWith("#")) {
            return line.replace(/URI="([^"]+)"/g, (_, u) => `URI="${proxify(u)}"`);
          }
          return proxify(l);
        })
        .join("\n");
      out.delete("content-length");
      out.set("content-type", "application/vnd.apple.mpegurl; charset=utf-8");
      out.set("cache-control", "no-cache, no-store, must-revalidate");
      return new Response(text, { status: upstream.status, headers: out });
    }

    return new Response(upstream.body, { status: upstream.status, headers: out });
  },
};
