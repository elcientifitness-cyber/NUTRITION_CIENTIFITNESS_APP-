/* Cientia · gestos táctiles. CFTouch.init({swipe:dir=>{} (1 = siguiente, -1 = anterior), canSwipe:()=>bool, refresh:()=>Promise, canPull:()=>bool}) */
(function(){
if(window.CFTouch)return;
var o=null,sx=0,sy=0,st=0,mode='',pd=0,ind=null,busy=false,TH=70;
function locked(){return !!document.querySelector('[data-cf-lock],[data-cfbug] [style*="inset: 0"]');}
function hScroll(el){for(var p=el;p&&p!==document.body;p=p.parentElement){if(p.classList&&p.classList.contains('cf-rail'))return true;var cs=getComputedStyle(p);if((cs.overflowX==='auto'||cs.overflowX==='scroll')&&p.scrollWidth>p.clientWidth+2)return true;}return false;}
function skip(el){return !el||!el.closest||!!el.closest('input,textarea,select,[contenteditable],nav,[data-cf-noswipe],[data-cfbug]')||hScroll(el);}
function top(){return (document.scrollingElement||document.documentElement).scrollTop<=0;}
function mk(){if(ind)return ind;ind=document.createElement('div');ind.setAttribute('aria-hidden','true');ind.setAttribute('data-noprint','1');
  ind.style.cssText='position:fixed;left:50%;top:calc(env(safe-area-inset-top) + 64px);z-index:60;width:38px;height:38px;margin-left:-19px;border-radius:50%;background:var(--cf-card,#fff);box-shadow:0 2px 10px rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center;opacity:0;transform:translateY(-40px);pointer-events:none;color:var(--color-accent,#1D3A4C)';
  ind.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" style="stroke:currentColor;stroke-width:2.4;fill:none;stroke-linecap:round;stroke-linejoin:round;display:block"><path d="M21 12a9 9 0 1 1-3-6.7"></path><path d="M21 4v5h-5"></path></svg>';document.body.appendChild(ind);return ind;}
function show(d){var e=mk(),p=Math.min(1,d/TH);e.style.transition='none';e.style.opacity=String(p);e.style.transform='translateY('+(Math.min(d,TH*1.3)*.6-40)+'px) rotate('+(p*270)+'deg)';}
function hide(){if(!ind)return;ind.style.transition='opacity .2s,transform .25s';ind.style.opacity='0';ind.style.transform='translateY(-40px)';var sv=ind.firstChild;if(sv&&sv._a){sv._a.cancel();sv._a=null;}}
function spin(){var sv=mk().firstChild;ind.style.transition='transform .2s';ind.style.opacity='1';ind.style.transform='translateY('+(TH*.6-40)+'px)';try{sv._a=sv.animate([{transform:'rotate(0)'},{transform:'rotate(360deg)'}],{duration:800,iterations:Infinity});}catch(e){}}
function stage(dir){var el=document.querySelector('[data-cf-stage]');if(!el||!el.animate)return;try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;el.animate([{opacity:.35,transform:'translateX('+(dir*24)+'px)'},{opacity:1,transform:'none'}],{duration:240,easing:'cubic-bezier(.2,.8,.2,1)'});}catch(e){}}
document.addEventListener('touchstart',function(e){if(!o||e.touches.length!==1||locked()){mode='x';return;}var t=e.touches[0];sx=t.clientX;sy=t.clientY;st=Date.now();pd=0;mode=skip(e.target)?'x':'';},{passive:true});
document.addEventListener('touchmove',function(e){if(mode==='x'||!o)return;var t=e.touches[0],dx=t.clientX-sx,dy=t.clientY-sy;
  if(!mode){if(Math.abs(dx)<10&&Math.abs(dy)<10)return;if(Math.abs(dx)>Math.abs(dy)*1.6&&o.canSwipe&&o.canSwipe())mode='h';else if(dy>0&&top()&&!busy&&o.canPull&&o.canPull())mode='p';else{mode='x';return;}}
  if(mode==='p'){if(!top()){mode='x';hide();return;}pd=dy;show(dy);}},{passive:true});
document.addEventListener('touchend',function(e){var m=mode;mode='';if(!o||!m||m==='x')return;var t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;
  if(m==='h'){if(Math.abs(dx)>=TH&&Math.abs(dy)<60&&Date.now()-st<800){var dir=dx<0?1:-1;var r=o.swipe(dir);if(r!==false)stage(dir);}return;}
  if(m==='p'){if(pd<TH){hide();return;}busy=true;spin();var done=function(){busy=false;hide();};try{Promise.resolve(o.refresh()).then(done,done);}catch(x){done();}setTimeout(function(){if(busy)done();},12000);}},{passive:true});
document.addEventListener('touchcancel',function(){mode='';hide();},{passive:true});
window.CFTouch={init:function(x){o=x;}};
})();
