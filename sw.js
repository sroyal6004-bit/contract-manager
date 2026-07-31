const CACHE = 'contracts-pwa-v16';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.5/firebase-storage-compat.js'
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

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // HTML 문서는 네트워크 우선 → 새 버전 배포 시 즉시 반영, 오프라인이면 캐시 폴백
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('./index.html').then(m => m || caches.match('./')))
    );
    return;
  }

  // 정적 자원(앱 셸/CDN/폰트)만 캐시 우선. Firebase/Firestore 등 API는 통과.
  const cacheable =
    url.origin === location.origin ||
    url.href.includes('cdnjs.cloudflare.com/ajax/libs/xlsx') ||
    url.href.includes('gstatic.com/firebasejs') ||
    url.href.includes('fonts.googleapis.com') ||
    url.href.includes('fonts.gstatic.com');
  if (!cacheable) return;

  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => cached))
  );
});
