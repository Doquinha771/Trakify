const CACHE = "trakify-shell-v2.2-mobile-app";
const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./data/library.json",
  "./data/library.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith("trakify-") && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: "window", includeUncontrolled: true }))
      .then(clients => Promise.all(clients.map(client => client.navigate(client.url).catch(() => null))))
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Áudio é transmitido diretamente pelo Internet Archive.
  // O Service Worker nunca intercepta origens externas nem Range requests.
  if (url.origin !== self.location.origin || request.headers.has("range")) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});


self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = event.notification.data?.url || "./";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      const client = clients.find(item => "focus" in item);
      if (client) { client.navigate(target).catch(() => null); return client.focus(); }
      return self.clients.openWindow ? self.clients.openWindow(target) : null;
    })
  );
});
