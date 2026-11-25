/* Mi Sala — service worker v2: notificaciones push + modo sin conexión.
   Cachea la app (shell), el fondo y las lecturas de datos (REST) para consulta offline.
   Nunca cachea /auth/ ni /storage/ (credenciales y URLs firmadas), ni escrituras. */
const SHELL = 'sala-shell-v4';
const DATA = 'sala-data-v2';
/* Mantener estas versiones en sincronía con index.html al desplegar. */
const SHELL_URLS = [
  './', 'index.html',
  'app.css?v=75', 'app.js?v=1249', 'config.js?v=26', 'kana-strokes.js?v=120',
  'jp-content.js', 'japanese.js?v=2', 'music.js?v=5', 'comida.js?v=5', 'deporte.js?v=5', 'dinero.js?v=5',
  'logo.svg',
  'icon-192.png?v=3', 'icon-512.png?v=3', 'icon-maskable-512.png?v=3', 'apple-touch-icon.png?v=3',
  'manifest.webmanifest?v=4',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => Promise.allSettled(SHELL_URLS.map(u => c.add(u)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k !== SHELL && k !== DATA).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  /* Credenciales y URLs firmadas: jamás a la caché. */
  if (url.hostname.endsWith('.supabase.co') && (url.pathname.startsWith('/auth/') || url.pathname.startsWith('/storage/'))) return;

  /* Datos de lectura (REST): red primero; si no hay red, última copia guardada. */
  if (url.hostname.endsWith('.supabase.co')) {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const c = res.clone(); caches.open(DATA).then(ca => ca.put(req, c)); }
      return res;
    }).catch(() => caches.match(req).then(m => m || Response.error())));
    return;
  }

  /* Navegación: red primero; sin red, la app guardada. */
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => {
      const c = res.clone(); caches.open(SHELL).then(ca => ca.put('index.html', c));
      return res;
    }).catch(() => caches.match('index.html')));
    return;
  }

  /* App, fondo, fuentes y CDN: caché primero, rellenando al vuelo. */
  if (url.origin === location.origin || ['fonts.googleapis.com','fonts.gstatic.com','cdn.jsdelivr.net'].includes(url.hostname)) {
    e.respondWith(caches.match(req).then(m => m || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const c = res.clone(); caches.open(SHELL).then(ca => ca.put(req, c)); }
      return res;
    })));
  }
});

/* ---- Notificaciones push ---- */
self.addEventListener('push', e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (_) {}
  const title = data.title || 'Mi Sala';
  e.waitUntil(self.registration.showNotification(title, {
    body: data.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: data.tag || 'sala',
    data: { url: data.url || './' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) { if ('focus' in c) return c.focus(); }
    return clients.openWindow(url);
  }));
});
