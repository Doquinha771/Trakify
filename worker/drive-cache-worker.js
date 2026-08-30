const DRIVE_ID = /^[A-Za-z0-9_-]{10,100}$/;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = env.SITE_ORIGIN || "*";
    const cors = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range",
      "Access-Control-Expose-Headers": "Accept-Ranges, Content-Length, Content-Range"
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (!['GET', 'HEAD'].includes(request.method) || url.pathname !== "/audio") {
      return new Response("Not found", { status: 404, headers: cors });
    }

    const id = url.searchParams.get("id") || "";
    if (!DRIVE_ID.test(id)) return new Response("Invalid file id", { status: 400, headers: cors });

    const cache = caches.default;
    const cacheKey = new Request(`${url.origin}/cache/${id}`);
    let full = await cache.match(cacheKey);

    if (!full) {
      const upstream = await fetch(`https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=t`, {
        headers: { "User-Agent": "Trakify-Audio-Cache/1.0" },
        cf: { cacheEverything: true, cacheTtl: 2592000 }
      });
      const type = upstream.headers.get("Content-Type") || "";
      if (!upstream.ok || type.includes("text/html")) {
        return new Response("Drive unavailable", { status: 502, headers: cors });
      }
      const headers = new Headers(upstream.headers);
      headers.set("Cache-Control", "public, max-age=2592000, immutable");
      headers.set("Accept-Ranges", "bytes");
      full = new Response(upstream.body, { status: 200, headers });
      ctx.waitUntil(cache.put(cacheKey, full.clone()));
    }

    if (request.method === "HEAD") {
      const headers = new Headers(full.headers);
      Object.entries(cors).forEach(([key, value]) => headers.set(key, value));
      return new Response(null, { status: 200, headers });
    }

    const range = request.headers.get("Range");
    if (!range) {
      const headers = new Headers(full.headers);
      Object.entries(cors).forEach(([key, value]) => headers.set(key, value));
      return new Response(full.body, { status: 200, headers });
    }

    const bytes = await full.arrayBuffer();
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) return new Response("Invalid range", { status: 416, headers: cors });
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Math.min(Number(match[2]), bytes.byteLength - 1) : bytes.byteLength - 1;
    if (start > end || start >= bytes.byteLength) return new Response("Range not satisfiable", { status: 416, headers: cors });

    const headers = new Headers(full.headers);
    Object.entries(cors).forEach(([key, value]) => headers.set(key, value));
    headers.set("Content-Range", `bytes ${start}-${end}/${bytes.byteLength}`);
    headers.set("Content-Length", String(end - start + 1));
    return new Response(bytes.slice(start, end + 1), { status: 206, headers });
  }
};
