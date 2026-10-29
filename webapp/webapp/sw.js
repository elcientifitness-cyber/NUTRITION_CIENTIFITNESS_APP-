// Siempre intenta la red primero (datos al día); si no hay conexión, usa la última copia.
const C='cf-v20',EXT=/^(cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)$/;
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>/^cf-v\d+$/.test(k)&&k!==C).map(k=>caches.delete(k)))).catch(()=>{}).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||(u.origin!==location.origin&&!EXT.test(u.hostname))||(u.origin===location.origin&&u.pathname.startsWith('/api/')))return;
  e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r;}).catch(()=>caches.match(e.request)));
});
// Notificaciones push (también se guardan para verlas dentro de la app)
const NK='cf-notifs',NU='/__cf_notifs';
function saveN(d){return caches.open(NK).then(c=>c.match(NU).then(r=>r?r.json():[]).catch(()=>[]).then(a=>{if(!Array.isArray(a))a=[];if(d.tag==='test'&&a[0]&&a[0].tag==='test'&&Date.now()-a[0].t<5000)return;a.unshift({t:Date.now(),title:d.title||'Cientia Nutrition',body:d.body||'',url:d.url||'',tag:d.tag||''});return c.put(NU,new Response(JSON.stringify(a.slice(0,60)),{headers:{'Content-Type':'application/json'}}));})).catch(()=>{});}
self.addEventListener('push',e=>{
  let d={};try{d=e.data?e.data.json():{};}catch(x){d={body:e.data?e.data.text():''};}
  // Con la app abierta (iPhone no enseña el aviso del sistema), además se muestra dentro de la app.
  e.waitUntil((d.coach?Promise.resolve():saveN(d)).then(()=>self.clients.matchAll({type:'window',includeUncontrolled:true})).then(cs=>{cs.forEach(c=>{if(c.visibilityState==='visible')c.postMessage({cfPush:d});});
    return self.registration.showNotification(d.title||'Cientia Nutrition',{body:d.body||'',icon:'assets/cn-192.png',badge:'assets/badge-96.png',tag:d.tag||undefined,renotify:!!d.tag,data:{url:d.url||'asesorado.html'}});}));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const url=new URL((e.notification.data&&e.notification.data.url)||'asesorado.html',self.registration.scope).href,pg=new URL(url).pathname.split('/').pop()||'index.html';
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{
    for(const c of cs){const cp=new URL(c.url).pathname.split('/').pop()||'index.html';if(cp===pg&&'focus' in c){if('navigate' in c)c.navigate(url).catch(()=>{});return c.focus();}}
    return self.clients.openWindow(url);
  }));
});
