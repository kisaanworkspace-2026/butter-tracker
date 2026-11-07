// Kisaan Butter Tracker – service worker.
// Network first (so updates to index.html show straight away); falls back to the saved copy when offline.
// Calls to the Google Sheet (a different website) are never touched here.
const CACHE = 'kisaan-bt-v3';
const SHELL = ['./', 'index.html', 'config.js', 'manifest.json', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return;
  e.respondWith(
    fetch(r.url, { cache: 'no-cache' }).then(function (res) {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(r).then(function (m) { return m || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()); });
    })
  );
});