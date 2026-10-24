const CACHE = 'snow-leopard-v3';

const PRECACHE = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './assets/css/app.css',
  './assets/fonts/fonts.css',
  './assets/fonts/Vazirmatn-Variable.woff2',
  './assets/fonts/Vazirmatn-Regular.woff2',
  './assets/fonts/Vazirmatn-SemiBold.woff2',
  './assets/fonts/Vazirmatn-Bold.woff2',
  './assets/leopard/stage-1.webp',
  './assets/leopard/stage-2.webp',
  './assets/leopard/stage-3.webp',
  './assets/leopard/stage-4.webp',
  './assets/leopard/stage-5.webp',
  './src/db.js',
  './src/defaults.js',
  './src/leopard.js',
  './src/coach.js',
  './src/prompts.js',
  './src/stories.js',
  './src/theme.js',
  './src/insights.js',
  './src/quests.js',
  './src/audio.js',
  './assets/audio/snow.ogg',
  './assets/audio/wind.ogg',
  './assets/audio/water.ogg',
  './assets/audio/shore.ogg',
  './assets/audio/silence.ogg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()).catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
