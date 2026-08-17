/* Offline shell cache. Bump CACHE on every deploy so phones pick up new code. */

const CACHE = 'pumplog-v21';
const SHELL = [
  './', './index.html', './styles.css', './app.js', './domain.js', './i18n.js',
  './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png',
];

self.addEventListener('install', e => {
  const fresh = SHELL.map(url => new Request(url, { cache: 'reload' }));
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(fresh)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Network-first so a deploy is picked up as soon as there's signal, with the
   cache as the gym-basement fallback. */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  e.respondWith(
    fetch(req, { cache: 'no-store' })
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => {
        if (hit) return hit;
        return req.mode === 'navigate' ? caches.match('./index.html') : Response.error();
      }))
  );
});
