/* Cientia · animaciones (GSAP 3 + anime.js 4). Marcas en plantillas:
   data-cf-num="in|1" cifras que cuentan · data-cf-bar="x|y" barras · data-cf-ring anillos SVG · data-cf-cele="clave" celebración
   data-cf-boot pantalla de carga · data-cf-stage contenedor cuyos hijos entran escalonados · main.cf-fade entrada de pantalla
   data-flip-id + CFAnim.flipState()/flipPlay() listas que se reordenan · data-cf-noanim excluye (PDF) */
(function(){
if(window.CFAnim)return;
var D=document.documentElement,GS='https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js',FL='https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/Flip.min.js',AN='https://cdn.jsdelivr.net/npm/animejs@4.5.0/dist/bundles/anime.umd.min.js',loaded=0;
function pref(){try{return localStorage.getItem('cf-anim')||'on';}catch(e){return 'on';}}
function rm(){try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}}
function ok(){return pref()!=='off'&&!rm();}
function on(){return ok()&&document.visibilityState!=='hidden'&&!(document.body&&document.body.classList.contains('cf-rep-on'));}
function mark(){D.setAttribute('data-cf-anim',ok()?'on':'off');}
function G(){return on()&&window.gsap?window.gsap:null;}
function A(){return on()&&window.anime&&window.anime.animate?window.anime:null;}
function load(src,cb){var s=document.createElement('script');s.src=src;s.async=true;s.onload=s.onerror=function(){cb&&cb();};document.head.appendChild(s);}
function boot(){if(loaded||!ok())return;loaded=1;load(GS,function(){if(!window.gsap)return;D.setAttribute('data-cf-gs','1');load(FL,function(){try{if(window.Flip)gsap.registerPlugin(Flip);}catch(e){}});});load(AN);}
mark();boot();
function skip(n){return !n.isConnected||!!(n.closest&&n.closest('[data-cf-noanim]'));}
function free(el){return !el.style.transform&&!el.style.opacity;}
/* cifras */
var NRE=/^([^\d\-−]*?)([\-−]?\d[\d.]*(?:,\d+)?)([\s\S]*)$/;
function parse(s){var m=NRE.exec(s==null?'':String(s));if(!m)return null;var t=m[2].replace('−','-'),P={pre:m[1],suf:m[3],dec:0,grp:false,dot:false,neg:m[2].charAt(0)==='−'},v;
  if(t.indexOf(',')>=0){P.dec=t.split(',')[1].length;P.grp=t.indexOf('.')>=0;v=parseFloat(t.replace(/\./g,'').replace(',','.'));}
  else if(/\d\.\d{3}(\.|$)/.test(t)&&!/^-?0\./.test(t)){P.grp=true;v=parseFloat(t.replace(/\./g,''));}
  else{var p=t.split('.');P.dec=p[1]?p[1].length:0;P.dot=P.dec>0;v=parseFloat(t);}
  if(!isFinite(v))return null;P.v=v;return P;}
function fmt(P,v){var s=Math.abs(v).toFixed(P.dec),ip=s.split('.')[0],fp=s.split('.')[1];if(P.grp)ip=ip.replace(/\B(?=(\d{3})+(?!\d))/g,'.');var o=ip+(fp?(P.dot?'.':',')+fp:'');if(v<0&&Math.abs(v)>=Math.pow(10,-P.dec)/2)o=(P.neg?'−':'-')+o;return P.pre+o+P.suf;}
function numNode(el){var w=document.createTreeWalker(el,4),n;while((n=w.nextNode()))if(/\d/.test(n.nodeValue))return n;return null;}
function wr(tn,s){tn._cfW=s;tn.nodeValue=s;}
function tween(tn,from,to){var a=A(),P=parse(to);if(!a||!P||from==null||!isFinite(from))return;var step=P.dec?Math.pow(10,-P.dec):1;if(Math.abs(from-P.v)<step)return;
  if(tn._cfA){try{tn._cfA.pause();}catch(e){}}
  var o={v:from},d=Math.round(Math.min(1100,Math.max(450,320+Math.log10(1+Math.abs(P.v-from))*160)));wr(tn,fmt(P,from));
  try{tn._cfA=a.animate(o,{v:P.v,duration:d,ease:'outExpo',onUpdate:function(){if(tn.nodeValue!==tn._cfW){try{tn._cfA&&tn._cfA.pause();}catch(e){}tn._cfA=null;return;}wr(tn,fmt(P,o.v));},onComplete:function(){if(tn.nodeValue===tn._cfW)wr(tn,to);tn._cfA=null;}});}catch(e){wr(tn,to);tn._cfA=null;}}
function numIn(el){var tn=numNode(el);if(!tn)return;var P=parse(tn.nodeValue);if(P&&Math.abs(P.v)>=2)tween(tn,0,tn.nodeValue);}
/* barras y anillos */
function bars(L,ax){var g=G();if(!g)return;L=L.filter(function(e){return free(e)&&e.getClientRects().length;});if(!L.length)return;
  var p=ax==='y'?{scaleY:0,transformOrigin:'50% 100%'}:{scaleX:0,transformOrigin:'0% 50%'};p.duration=.7;p.ease='power3.out';p.stagger=Math.min(.05,.45/L.length);p.clearProps='transform,transformOrigin';g.from(L,p);}
function ring(el){if(!el.animate||!on())return;var cs=getComputedStyle(el),c=parseFloat(String(cs.strokeDasharray).split(/[ ,]+/)[0]);if(!c)return;try{el.animate([{strokeDashoffset:c+'px'}],{duration:900,easing:'cubic-bezier(.2,.8,.2,1)'});}catch(e){}}
/* entrada */
function enter(L,o){var g=G();if(!g)return;L=L.filter(function(e){return e.nodeType===1&&free(e)&&e.getClientRects().length&&!/^(STYLE|SCRIPT|LINK)$/.test(e.tagName);}).slice(0,8);if(!L.length)return;
  o=o||{};g.from(L,{opacity:0,y:o.y==null?10:o.y,duration:o.d||.34,ease:'power2.out',stagger:L.length>1?.04:0,clearProps:'opacity,transform'});}
/* celebración */
function cele(el,key){var a=A();if(!a)return;var k='cf-cele:'+key+':'+(el.textContent||'').replace(/\s+/g,' ').slice(0,60);try{if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,'1');}catch(e){}
  setTimeout(function(){if(!el.isConnected)return;var r=el.getBoundingClientRect();if(!r.width)return;var cs=getComputedStyle(D),cols=['--brass','--color-accent','--prot','--carb','--veg'].map(function(v){return cs.getPropertyValue(v).trim();}).filter(Boolean);if(!cols.length)cols=['#A8865A','#1D3A4C','#7E9A86'];
    var box=document.createElement('div');box.setAttribute('aria-hidden','true');box.setAttribute('data-noprint','1');box.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:2147482000;overflow:hidden';
    var cx=r.left+r.width/2,cy=r.top+Math.min(r.height/2,36),N=20,ps=[],i;
    for(i=0;i<N;i++){var p=document.createElement('span'),sq=i%3===0;p.style.cssText='position:absolute;left:'+cx+'px;top:'+cy+'px;width:'+(sq?4:6)+'px;height:'+(sq?10:6)+'px;margin:-3px 0 0 -3px;border-radius:'+(sq?'1px':'50%')+';background:'+cols[i%cols.length];box.appendChild(p);ps.push(p);}
    document.body.appendChild(box);var ang=ps.map(function(_,j){return (-90+(j/N-.5)*300+(Math.random()-.5)*24)*Math.PI/180;}),dist=ps.map(function(){return 50+Math.random()*80;});
    try{a.animate(ps,{x:function(t,j){return Math.cos(ang[j])*dist[j];},y:function(t,j){return Math.sin(ang[j])*dist[j]+18;},rotate:function(){return (Math.random()-.5)*360;},opacity:{from:1,to:0,ease:'inQuad'},duration:function(){return 850+Math.random()*450;},ease:'outExpo',onComplete:function(){box.remove();}});
      if(free(el))a.animate(el,{scale:[{to:1.025,duration:150,ease:'outQuad'},{to:1,duration:450,ease:'outBack'}],onComplete:function(){el.style.transform='';}});}catch(e){box.remove();}
    setTimeout(function(){if(box.isConnected)box.remove();},2500);},220);}
/* pantalla de carga: fundido al salir */
function bootOut(n){if(!ok())return;var c=n.cloneNode(true);c.removeAttribute('data-cf-boot');c.setAttribute('aria-hidden','true');c.style.pointerEvents='none';c.style.animation='none';[].slice.call(c.children).forEach(function(x){x.style.animation='none';});document.body.appendChild(c);
  var g=window.gsap,sv=c.querySelector('svg');if(g){g.to(c,{opacity:0,duration:.42,ease:'power2.out',onComplete:function(){c.remove();}});if(sv)g.to(sv,{scale:1.06,duration:.42,ease:'power2.out'});}
  else if(c.animate){c.animate([{opacity:1},{opacity:0}],{duration:380,easing:'ease-out'}).onfinish=function(){c.remove();};}else c.remove();setTimeout(function(){if(c.isConnected)c.remove();},1500);}
/* observador */
var SEL='[data-cf-num="in"],[data-cf-bar],[data-cf-ring],[data-cf-cele],main.cf-fade,[data-cf-stage]';
function scan(n,acc){if(n.nodeType!==1||skip(n))return;var L=[].slice.call(n.querySelectorAll(SEL));if(n.matches(SEL))L.unshift(n);L.forEach(function(e){acc.push(e);});}
var mo=new MutationObserver(function(recs){var add=[],chg=new Map(),st=[];
  for(var i=0;i<recs.length;i++){var r=recs[i];
    if(r.type==='characterData'){var tn=r.target,pe=tn.parentElement;if(pe&&pe.closest('[data-cf-num]')&&!chg.has(tn))chg.set(tn,r.oldValue);continue;}
    for(var j=0;j<r.removedNodes.length;j++){var x=r.removedNodes[j];if(x.nodeType===1&&(x.hasAttribute('data-cf-boot')||x.querySelector('[data-cf-boot]')))bootOut(x.hasAttribute('data-cf-boot')?x:x.querySelector('[data-cf-boot]'));}
    if(!r.addedNodes.length)continue;var t=r.target;
    if(t.nodeType===1&&(t.matches('main.cf-fade')||t.hasAttribute('data-cf-stage'))&&t.isConnected)for(var k=0;k<r.addedNodes.length;k++){var y=r.addedNodes[k];if(y.nodeType===1&&st.indexOf(y)<0)st.push(y);}
    for(var m=0;m<r.addedNodes.length;m++)scan(r.addedNodes[m],add);}
  if(!on())return;
  chg.forEach(function(old,tn){if(!tn.isConnected||tn.nodeValue===tn._cfW)return;var P=parse(tn._cfA&&tn._cfW!=null?tn._cfW:old),el=tn.parentElement.closest('[data-cf-num]');var from=P?P.v:(el&&el.getAttribute('data-cf-num')==='in'?0:null);tween(tn,from,tn.nodeValue);});
  if(!add.length&&!st.length)return;
  var bx=[],by=[],seen=new Set();
  add.forEach(function(e){if(seen.has(e))return;seen.add(e);
    if(e.matches('main.cf-fade')||e.hasAttribute('data-cf-stage')){enter([].slice.call(e.children));return;}
    if(e.hasAttribute('data-cf-bar'))(e.getAttribute('data-cf-bar')==='y'?by:bx).push(e);
    else if(e.hasAttribute('data-cf-ring'))ring(e);
    else if(e.hasAttribute('data-cf-cele'))cele(e,e.getAttribute('data-cf-cele'));
    else if(e.getAttribute('data-cf-num')==='in')numIn(e);});
  st=st.filter(function(e){return !seen.has(e)&&!(e.parentElement&&seen.has(e.parentElement));});if(st.length)enter(st,{y:8,d:.3});
  if(bx.length)bars(bx,'x');if(by.length)bars(by,'y');});
function start(){if(!document.body){setTimeout(start,20);return;}mo.observe(document.body,{childList:true,subtree:true,characterData:true,characterDataOldValue:true});}
start();
window.CFAnim={
  on:ok,pref:pref,
  set:function(v){try{localStorage.setItem('cf-anim',v?'on':'off');}catch(e){}mark();if(v)boot();},
  flipState:function(){if(!G()||!window.Flip)return null;var L=[].slice.call(document.querySelectorAll('[data-flip-id]')).filter(function(e){return e.getClientRects().length&&!skip(e);});if(!L.length||L.length>400)return null;try{return Flip.getState(L);}catch(e){return null;}},
  flipPlay:function(s){var g=G();if(!s||!g||!window.Flip)return;var L=[].slice.call(document.querySelectorAll('[data-flip-id]')).filter(function(e){return e.getClientRects().length&&!skip(e);});if(!L.length||L.length>400)return;
    try{Flip.from(s,{targets:L,duration:.42,ease:'power2.inOut',simple:true,prune:true,onEnter:function(els){return g.fromTo(els,{opacity:0,scale:.97},{opacity:1,scale:1,duration:.3,ease:'power2.out',clearProps:'opacity,transform'});}});}catch(e){}},
  step:function(el,dir){var g=G();if(!g||!el||!free(el))return;g.fromTo(el,{opacity:0,x:(dir<0?-1:1)*18},{opacity:1,x:0,duration:.3,ease:'power2.out',clearProps:'opacity,transform'});},
  celebrate:function(el,key){if(el)cele(el,key||'x');}
};
})();
