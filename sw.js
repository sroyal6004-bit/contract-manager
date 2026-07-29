const CACHE = 'contracts-pwa-v6';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// 정적 자원(앱 셸/CDN)만 캐시로 응답. Firebase/Firestore 등 API 요청은 건드리지 않고 네트워크로 통과.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const cacheable =
    url.origin === location.origin ||
    url.href.includes('cdnjs.cloudflare.com/ajax/libs/xlsx') ||
    url.href.includes('gstatic.com/firebasejs') ||
    url.href.includes('fonts.googleapis.com') ||
    url.href.includes('fonts.gstatic.com');
  if (!cacheable) return; // firestore.googleapis.com, identitytoolkit 등은 그대로 통과
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => cached))
  );
});
