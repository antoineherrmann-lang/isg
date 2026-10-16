/* ISG International — service worker (v0.2 : médias externes et fichiers de l'iPad)
   La version vient de l'adresse d'enregistrement (sw.js?v=X.Y.Z) :
   changer la version crée un nouveau cache sans toucher à ce fichier.
   Les vidéos vivent dans un cache séparé qui survit aux mises à jour. */
const VER = new URL(self.location.href).searchParams.get('v') || '0';
const SHELL = 'isg-shell-' + VER;
const MEDIA = 'isg-media-v1';
const FILES = ['./', './index.html', './data/lieux.json', './data/terre.json',
  './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL);
    await Promise.all(FILES.map(async f => {
      const r = await fetch(new Request(f, { cache: 'reload' }));
      if (!r.ok) throw new Error(f + ' ' + r.status);
      await c.put(f, r);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) { if (k.startsWith('isg-shell-') && k !== SHELL) await caches.delete(k); }
    await self.clients.claim();
  })());
});

/* Safari exige des réponses « Range » pour lire une vidéo : on découpe le fichier mis en cache */
async function rangeResponse(req, cached) {
  const blob = await cached.blob(), size = blob.size;
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  let s = m && m[1] ? parseInt(m[1], 10) : 0;
  let e = m && m[2] ? parseInt(m[2], 10) : size - 1;
  if (m && !m[1] && m[2]) { s = Math.max(0, size - parseInt(m[2], 10)); e = size - 1; }
  e = Math.min(e, size - 1);
  if (s > e) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
  return new Response(blob.slice(s, e + 1), {
    status: 206, statusText: 'Partial Content',
    headers: {
      'Content-Type': cached.headers.get('Content-Type') || 'video/mp4',
      'Content-Range': `bytes ${s}-${e}/${size}`, 'Content-Length': String(e - s + 1), 'Accept-Ranges': 'bytes'
    }
  });
}

const MEDIA_PATH = /\/(videos|posters|photos|_local)\//;

async function mediaResponse(req, sameOrigin) {
  const mc = await caches.open(MEDIA);
  const hit = await mc.match(req.url, { ignoreSearch: sameOrigin });
  if (hit) return req.headers.has('range') ? rangeResponse(req, hit) : hit;
  return fetch(req);
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url), same = url.origin === self.location.origin;
  /* requêtes avec ?_= (recherche de mise à jour, téléchargement des contenus) : toujours le réseau */
  if (same && url.searchParams.has('_')) return;

  /* médias : fichiers du dépôt, fichiers ajoutés depuis l'iPad (_local/) et liens externes copiés dans le cache */
  if ((same && MEDIA_PATH.test(url.pathname)) || (!same && req.destination !== 'document' && req.destination !== 'iframe')) {
    e.respondWith(mediaResponse(req, same));
    return;
  }
  if (!same) return;

  e.respondWith((async () => {
    const sc = await caches.open(SHELL);
    const key = req.mode === 'navigate' ? './index.html' : req;
    const hit = await sc.match(key, { ignoreSearch: true });
    if (hit) return hit;
    try { return await fetch(req); } catch (err) {
      if (req.mode === 'navigate') { const i = await sc.match('./index.html'); if (i) return i; }
      throw err;
    }
  })());
});
