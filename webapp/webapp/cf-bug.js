/* Cientia · detector de fallos. CFBug.init({app,sb,screen,ctx,hint,pos,demo}); CFBug.watch(msg); CFBug.local() */
(function(){
if(window.CFBug)return;
var V='cf-v54',ABC='23456789ABCDEFGHJKMNPQRSTUVWXYZ',cfg=null,pre=[],seen={},nAuto=0,nToast=0,clicks=[],mem=[],t0=Date.now(),root=null,sheet=null,toastEl=null,toastT=0;
var NOISE=/ResizeObserver|^Script error\.?$|Non-Error promise rejection|AbortError|aborted|Failed to fetch|Load failed|NetworkError|network error|cancell?ed|extension:\/\/|Importing a module script failed|play\(\) request|NotAllowedError|QuotaExceeded|The operation is insecure|ServiceWorker|cssRules|cross-origin stylesheet|Cannot access rules|EmptyRanges/i;
function code(){var s='CF-';for(var i=0;i<5;i++)s+=ABC[Math.floor(Math.random()*ABC.length)];return s;}
function scr(){try{return cfg&&cfg.screen?String(cfg.screen()||''):'';}catch(e){return '';}}
function ctx(){try{return cfg&&cfg.ctx?cfg.ctx():null;}catch(e){return null;}}
function hint(){try{return cfg&&cfg.hint?(typeof cfg.hint==='function'?cfg.hint():cfg.hint):'';}catch(e){return '';}}
function txt(el){if(!el||!el.getAttribute)return '';var t=el.getAttribute('aria-label')||el.getAttribute('title');
  if(!t){if(/^(INPUT|TEXTAREA)$/.test(el.tagName))t='campo '+(el.placeholder||el.name||el.type||'');else if(el.tagName==='SELECT')t='selector';else t=el.innerText||el.textContent||'';}
  return String(t).replace(/\s+/g,' ').trim().slice(0,70);}
function push(x){clicks.push({at:Date.now(),s:scr(),x:x});if(clicks.length>15)clicks.shift();}
document.addEventListener('click',function(e){var el=e.target;if(!el||!el.closest||el.closest('[data-cfbug]'))return;var b=el.closest('button,a,label,select,input,textarea,[role=button]')||el;push('«'+(txt(b)||b.tagName.toLowerCase())+'»');},true);
document.addEventListener('keydown',function(e){if(e.key==='Escape')push('[tecla Esc]');},true);
function vis(sel){var r=[];try{var L=document.querySelectorAll(sel);for(var i=0;i<L.length;i++){var el=L[i];if(el.getClientRects().length&&!el.closest('[data-cfbug]'))r.push(el);}}catch(e){}return r;}
function ovs(){return vis('[data-esc],[data-cf-lock],[role=dialog]').slice(0,5).map(function(el){var h=el.querySelector('h1,h2,h3')||el;return txt(h).slice(0,80);});}
function keep(q){try{var p=new URLSearchParams(q),o=new URLSearchParams();['view','c','me','demo'].forEach(function(k){if(p.has(k))o.set(k,p.get(k));});var s=o.toString();return s?'?'+s:'';}catch(e){return '';}}
function payload(kind,msg,x){x=x||{};var now=Date.now();return {code:x.code||code(),app:cfg?cfg.app:'?',kind:kind,msg:String(msg||'').slice(0,1500),screen:scr().slice(0,200),
  data:{note:String(x.note||'').slice(0,3000),stack:String(x.stack||'').slice(0,4000),ov:x.ov||ovs(),clicks:clicks.slice(-12).map(function(c){return {t:Math.round((c.at-now)/1000),s:c.s,x:c.x};}),
  ua:String(navigator.userAgent||'').slice(0,300),ver:V,url:location.pathname+keep(location.search),w:innerWidth,h:innerHeight,on:navigator.onLine,ctx:ctx(),age:Math.round((now-t0)/1000),at:new Date(now).toISOString()}};}
function sbc(){try{return cfg&&cfg.sb?cfg.sb():null;}catch(e){return null;}}
function q(p){if(!cfg||cfg.demo)return;try{var a=JSON.parse(localStorage.getItem('cf-bug-q')||'[]');a.push(p);localStorage.setItem('cf-bug-q',JSON.stringify(a.slice(-10)));}catch(e){}}
function flush(){if(!cfg||cfg.demo||!navigator.onLine)return;var sb=sbc();if(!sb)return;var a;try{a=JSON.parse(localStorage.getItem('cf-bug-q')||'[]');}catch(e){a=[];}if(!a.length)return;
  try{localStorage.removeItem('cf-bug-q');}catch(e){}a.forEach(function(p){sb.rpc('cf_bug_report',{p:p}).then(function(r){if(r.error)q(p);},function(){q(p);});});}
function send(p,cb){mem.unshift({code:p.code,app:p.app,kind:p.kind,msg:p.msg,screen:p.screen,data:p.data,created_at:new Date().toISOString(),status:'open',role:'',email:'este dispositivo'});if(mem.length>30)mem.pop();
  if(!cfg||cfg.demo){cb&&cb(p.code,'demo');return;}
  var sb=sbc();if(!sb||!navigator.onLine){q(p);cb&&cb(p.code,'queued');return;}
  var n=0;(function go(){sb.rpc('cf_bug_report',{p:p}).then(function(r){if(r.error){q(p);cb&&cb(p.code,'queued');return;}if(r.data==='!dup'&&n++<2){p.code=code();mem[0].code=p.code;go();return;}cb&&cb(p.code,r.data?'ok':'limit');},function(){q(p);cb&&cb(p.code,'queued');});})();}
function auto(msg,stack,o){o=o||{};msg=String(msg||'Error').slice(0,600);if(NOISE.test(msg))return;
  var key=o.key||msg.slice(0,140),S=seen[key];
  if(S){if(!o.silent&&!S.toast&&cfg&&nToast<3){S.toast=1;nToast++;toast(S.code);}return;}
  if(!cfg){if(pre.length<10)pre.push([msg,stack,o]);return;}
  if(++nAuto>8)return;
  var p=payload(o.kind||'auto',msg,{stack:stack});S=seen[key]={code:p.code,toast:0};
  send(p,function(c){S.code=c;if(toastEl&&toastEl._c)toastEl._c.textContent=c;});
  if(!o.silent&&nToast<3){S.toast=1;nToast++;toast(p.code);}}
addEventListener('error',function(e){if(!e||!e.message)return;var f=e.filename||'';if(/extension:\/\//.test(f))return;auto(e.message,(e.error&&e.error.stack)||(f+':'+e.lineno+':'+e.colno));});
addEventListener('unhandledrejection',function(e){var r=e&&e.reason,m=r&&(r.message||r.msg);if(!m){try{m=typeof r==='object'?JSON.stringify(r).slice(0,300):String(r);}catch(x){m=String(r);}}auto('Promesa sin capturar: '+m,r&&r.stack);});
var ce=console.error;console.error=function(){try{for(var i=0;i<arguments.length;i++){var a=arguments[i];if(a instanceof Error){auto(a.message,a.stack,{silent:true});break;}}}catch(x){}return ce.apply(console,arguments);};
try{new PerformanceObserver(function(l){l.getEntries().forEach(function(en){if(en.duration>2500&&Date.now()-t0>10000)auto('La página se ha quedado bloqueada '+(Math.round(en.duration/100)/10)+' s','',{silent:true,kind:'watch',key:'freeze|'+scr()});});}).observe({entryTypes:['longtask']});}catch(e){}

var F='font-family:inherit;';
function el(tag,css,html){var e=document.createElement(tag);if(css)e.style.cssText=css;if(html!=null)e.innerHTML=html;return e;}
function btn(label,primary,fn){var b=el('button',F+'font-size:14px;font-weight:700;min-height:44px;padding:0 16px;border-radius:999px;cursor:pointer;'+(primary?'border:0;background:var(--color-accent,#1D3A4C);color:#fff':'border:1.5px solid var(--color-divider,#d8d6d0);background:transparent;color:var(--color-text,#141B22)'));b.type='button';b.textContent=label;b.onclick=fn;return b;}
function copy(t,b){var ok=function(){if(b){var o=b.textContent;b.textContent='Copiado';setTimeout(function(){b.textContent=o;},1400);}};
  try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(ok,function(){fb();});return;}}catch(e){}fb();
  function fb(){var a=el('textarea','position:fixed;left:-9999px');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy');ok();}catch(e){}a.remove();}}
function mount(){if(root||!document.body)return;root=el('div','');root.setAttribute('data-cfbug','1');root.setAttribute('data-noprint','1');
  var st=el('style');st.textContent='@media print{[data-cfbug]{display:none!important}}';root.appendChild(st);
  var edge=cfg.pos==='edge',b=el('button',F+'position:fixed;z-index:2147483000;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;opacity:.55;transition:opacity .15s;background:var(--cf-card,#fff);color:var(--color-neutral-700,#4a5560);border:1px solid var(--color-divider,#d8d6d0);box-shadow:0 2px 8px rgba(0,0,0,.12);'+(edge?'right:0;top:58%;width:24px;height:44px;border-right:0;border-radius:12px 0 0 12px':'right:14px;bottom:14px;width:34px;height:34px;border-radius:50%'),
    '<svg width="16" height="16" viewBox="0 0 24 24" style="stroke:currentColor;stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><path d="M12 7v4"></path><path d="M12 14h.01"></path></svg>');
  b.type='button';b.title='Reportar un problema';b.setAttribute('aria-label','Reportar un problema');b.onmouseenter=function(){b.style.opacity='1';};b.onmouseleave=function(){b.style.opacity='.55';};b.onclick=open;root.appendChild(b);
  document.body.appendChild(root);}
function toast(c){if(!root)return;if(toastEl)toastEl.remove();clearTimeout(toastT);
  var t=el('div',F+'position:fixed;z-index:2147483000;left:50%;transform:translateX(-50%);bottom:'+(cfg.pos==='edge'?'calc(env(safe-area-inset-bottom) + 86px)':'64px')+';max-width:calc(100vw - 24px);box-sizing:border-box;background:var(--color-text,#141B22);color:var(--cf-on-ink,#fff);border-radius:16px;padding:10px 10px 10px 16px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;box-shadow:0 8px 24px rgba(0,0,0,.25);font-size:13px');
  var s=el('span','flex:1 1 180px;min-width:0;line-height:1.4');s.appendChild(document.createTextNode('Algo no ha ido bien. Código '));var k=el('b','font-family:ui-monospace,Menlo,monospace;letter-spacing:.04em');k.textContent=c;s.appendChild(k);t._c=k;
  var h=hint();if(h){s.appendChild(el('br'));s.appendChild(document.createTextNode(h));}
  var cp=el('button',F+'font-size:13px;font-weight:700;min-height:36px;padding:0 12px;border-radius:999px;border:1.5px solid currentColor;background:transparent;color:inherit;cursor:pointer');cp.type='button';cp.textContent='Copiar';cp.onclick=function(){copy(k.textContent,cp);};
  var x=el('button',F+'font-size:18px;line-height:1;width:36px;height:36px;border:0;background:transparent;color:inherit;cursor:pointer');x.type='button';x.setAttribute('aria-label','Cerrar');x.textContent='×';x.onclick=function(){t.remove();toastEl=null;};
  t.appendChild(s);t.appendChild(cp);t.appendChild(x);root.appendChild(t);toastEl=t;toastT=setTimeout(function(){if(toastEl===t){t.remove();toastEl=null;}},15000);}
function close(){if(sheet){sheet.remove();sheet=null;}}
function card(){var c=el('div',F+'background:var(--cf-card,#fff);color:var(--color-text,#141B22);border-radius:16px;max-width:440px;width:100%;box-sizing:border-box;padding:20px;display:flex;flex-direction:column;gap:12px;box-shadow:0 12px 40px rgba(0,0,0,.25);max-height:calc(100vh - 32px);overflow:auto');c.onclick=function(e){e.stopPropagation();};return c;}
function open(){if(sheet)return;var ov=ovs();
  sheet=el('div',F+'position:fixed;inset:0;z-index:2147483001;background:rgba(20,27,34,.45);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box');sheet.onclick=close;
  var c=card();c.appendChild(el('div','font-weight:800;font-size:18px','Reportar un problema'));
  c.appendChild(el('div','font-size:13px;line-height:1.45;color:var(--color-neutral-700,#4a5560)','Cuenta qué estabas haciendo y qué ha pasado. Se envía con la pantalla en la que estás y los últimos pasos, para poder repetirlo.'));
  var ta=el('textarea',F+'font-size:14px;min-height:96px;resize:vertical;padding:10px 12px;border-radius:12px;border:1.5px solid var(--color-divider,#d8d6d0);background:var(--cf-page,transparent);color:inherit;box-sizing:border-box;width:100%');ta.placeholder='Ej.: al entrar se abre una ventana y no se cierra';c.appendChild(ta);
  var r=el('div','display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end');
  var go=btn('Enviar',true,function(){go.disabled=true;go.textContent='Enviando…';var p=payload('manual',(ta.value||'').trim().slice(0,200)||'Reporte sin texto',{note:ta.value,ov:ov});send(p,function(cd,st){done(c,cd,st);});});
  r.appendChild(btn('Cancelar',false,close));r.appendChild(go);c.appendChild(r);
  c.appendChild(el('div','height:1px;background:var(--color-divider,#d8d6d0);margin:4px 0'));
  c.appendChild(el('div','font-size:13px;font-weight:700',ov.length?'Hay '+(ov.length===1?'una ventana abierta':ov.length+' ventanas abiertas')+'. ¿No se cierra?':'¿Se ha quedado algo bloqueado?'));
  var r2=el('div','display:flex;gap:8px;flex-wrap:wrap'),info=el('div','font-size:12px;color:var(--color-neutral-700,#4a5560)');
  var rs=btn('Cerrar todas las ventanas',false,function(){rs.disabled=true;rescue(ov,function(n){info.textContent=n?'Listo: '+(n===1?'se ha cerrado 1 ventana.':'se han cerrado '+n+' ventanas.'):'No había ventanas que cerrar.';rs.disabled=false;});});
  r2.appendChild(rs);r2.appendChild(btn('Recargar la página',false,function(){location.reload();}));c.appendChild(r2);c.appendChild(info);
  sheet.appendChild(c);root.appendChild(sheet);setTimeout(function(){try{ta.focus();}catch(e){}},30);}
function done(c,cd,st){c.innerHTML='';c.appendChild(el('div','font-weight:800;font-size:18px',st==='queued'?'Guardado':'Enviado'));
  c.appendChild(el('div','font-size:13px;line-height:1.45;color:var(--color-neutral-700,#4a5560)',st==='queued'?'No hay conexión ahora mismo: se enviará solo en cuanto vuelva.':(st==='limit'?'Se han enviado muchos reportes seguidos; este se ha guardado igualmente con su código.':'Gracias. Ya está registrado.')));
  var k=el('div','font-family:ui-monospace,Menlo,monospace;font-weight:700;font-size:26px;letter-spacing:.06em;padding:10px 0');k.textContent=cd;c.appendChild(k);
  var h=hint();if(h)c.appendChild(el('div','font-size:13px;color:var(--color-neutral-700,#4a5560)')).textContent=h;
  var r=el('div','display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end'),cp=btn('Copiar código',false,function(){copy(cd,cp);});r.appendChild(cp);r.appendChild(btn('Cerrar',true,close));c.appendChild(r);}
function rescue(ov,cb){var n=0,round=0;
  (function step(){var L=vis('[data-esc],[data-cf-lock]');if(!L.length||round>=3){L.forEach(function(e){e.style.display='none';e.setAttribute('data-cf-hid','1');e.removeAttribute('data-cf-lock');});
      try{document.documentElement.style.overflow='';document.body.style.overflow='';}catch(e){}try{cfg&&cfg.rescue&&cfg.rescue();}catch(e){}
      if(ov.length)send(payload('rescue','Cerrar todas las ventanas',{ov:ov}));cb(n);return;}
    if(round===0)n=L.length;L.forEach(function(e){try{e.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));}catch(x){}});round++;setTimeout(step,140);})();}
document.addEventListener('keydown',function(e){if(sheet&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}},true);
addEventListener('online',function(){setTimeout(flush,2000);});
window.CFBug={ver:V,
  init:function(o){if(cfg)return;cfg=o||{};var m=function(){mount();var P=pre;pre=[];P.forEach(function(a){auto(a[0],a[1],a[2]);});};if(document.body)m();else addEventListener('DOMContentLoaded',m);setTimeout(flush,8000);},
  watch:function(msg,key){auto(msg,'',{silent:true,kind:'watch',key:key||msg});},
  report:open,local:function(){return mem.slice();}};
})();
