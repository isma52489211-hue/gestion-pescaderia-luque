// Una versión completa de la aplicación se instala junta; una actualización interrumpida deja disponible la anterior.
const PREFIJO = 'caja-luque:' + self.registration.scope + ':';
const CACHE = PREFIJO + 'v5-rc2';
const ARCHIVOS = ['./','index.html','lector.js','motor-cierre.js','app.js','assets/lector-cifras.json','styles.css','manifest.webmanifest',
  'assets/logo-adolfo.png','assets/icono-192.png','assets/icono-512.png','assets/icono-apple.png','assets/iconos/frescura.svg','assets/iconos/preparacion.svg',
  'assets/iconos/calidad.svg','assets/iconos/frio.svg'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS.map(path => new Request(new URL(path,self.registration.scope), {cache:'reload'})))));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIJO) && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.registration.scope)) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const recurso = await c.match(e.request, {ignoreSearch:true});
    if (recurso) return recurso;
    try { return await fetch(e.request); }
    catch (err) { if (e.request.mode === 'navigate') return await c.match(new URL('index.html',self.registration.scope)); throw err; }
  }));
});
