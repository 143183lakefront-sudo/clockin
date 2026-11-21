// 讓打卡頁面沒有網路也能打開。修改網頁後，把版本號 v1 改成 v2、v3… 讓手機更新。
const CACHE = 'clockin-v2';
const ASSETS = [
  './',
  './index.html',
  './config.js',
  './manifest.json',
  './icon.svg',
  'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // 打卡資料一律直接送 Google，不經過快取
  if (req.method !== 'GET' || /(^|\.)google(usercontent)?\.com$/.test(url.hostname)) return;

  // 先用快取（網路差也能馬上打開），同時在背景更新
  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(req, { ignoreSearch: true }).then((hit) => {
        const update = fetch(req)
          .then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; })
          .catch(() => hit);
        return hit || update;
      })
    )
  );
});
