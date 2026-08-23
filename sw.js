// Naikkan angka versi ini setiap kali kamu deploy perubahan ke script.js/style.css/index.html.
// Ini yang membuat pengguna PWA lama otomatis dapat file terbaru, bukan terjebak cache basi.
const CACHE_VERSION = 'v2';
const CACHE_NAME = `cox-cashier-${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting()) // langsung aktifkan SW baru, jangan tunggu semua tab ditutup
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim()) // ambil alih tab yang sudah terbuka tanpa perlu reload manual
  );
});

// Strategi: network-first untuk HTML/JS/CSS (biar update selalu kepakai kalau online),
// fallback ke cache kalau offline. File statis lain tetap cache-first.
self.addEventListener('fetch', event => {
  const req = event.request;
  const isAppShell = ['document', 'script', 'style'].includes(req.destination);

  if (isAppShell) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(response => response || fetch(req))
  );
});
