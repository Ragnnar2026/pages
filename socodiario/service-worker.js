const CACHE="soco-diario-v1";
const ASSETS=["./","./index.html","./manifest.json","./icons/icon-180-v3.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
  const copy=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return res;
}).catch(()=>caches.match("./index.html")))));
