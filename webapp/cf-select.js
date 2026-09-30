// Desplegables con el estilo de la app (sustituye la lista nativa del sistema en todos los <select class="input">).
(function(){
  let pop=null,cur=null,idx=-1,items=[];
  const css=document.createElement('style');
  css.textContent=`.cf-dd{position:fixed;z-index:1000;background:#fff;border-radius:14px;box-shadow:0 12px 32px rgba(20,50,80,.18),0 0 0 1px rgba(20,50,80,.06);padding:6px;overflow-y:auto;font-family:var(--font-body);font-size:14px;color:var(--color-text);animation:cfdd .12s ease-out}
@keyframes cfdd{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.cf-dd-it{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:10px;cursor:pointer;line-height:1.3;white-space:nowrap}
.cf-dd-it[data-a="1"]{background:var(--color-accent-100)}
.cf-dd-it[data-s="1"]{font-weight:700;color:var(--color-accent-800)}
.cf-dd-it[data-d="1"]{opacity:.45;cursor:default}
.cf-dd-ck{width:14px;flex:none;color:var(--color-accent)}
.cf-dd-gr{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-600);padding:8px 12px 4px}`;
  document.head.appendChild(css);
  const close=()=>{if(pop){pop.remove();pop=null;}if(cur){cur.removeAttribute('data-open');}cur=null;items=[];idx=-1;};
  const setActive=i=>{items.forEach((el,j)=>el.setAttribute('data-a',j===i?'1':'0'));idx=i;const el=items[i];if(el&&pop){const t=el.offsetTop,b=t+el.offsetHeight;if(t<pop.scrollTop)pop.scrollTop=t-6;else if(b>pop.scrollTop+pop.clientHeight)pop.scrollTop=b-pop.clientHeight+6;}};
  const pick=(sel,val)=>{const set=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set;set.call(sel,val);sel.dispatchEvent(new Event('change',{bubbles:true}));close();sel.focus();};
  const open=sel=>{
    close();cur=sel;sel.setAttribute('data-open','1');
    pop=document.createElement('div');pop.className='cf-dd';pop.setAttribute('role','listbox');
    const add=(o)=>{const d=document.createElement('div');d.className='cf-dd-it';d.setAttribute('role','option');
      const s=o.value===sel.value;d.setAttribute('data-s',s?'1':'0');if(o.disabled)d.setAttribute('data-d','1');
      d.innerHTML='<span class="cf-dd-ck">'+(s?'✓':'')+'</span>';const tx=document.createElement('span');tx.textContent=o.textContent;d.appendChild(tx);
      if(!o.disabled){d.addEventListener('mousedown',e=>{e.preventDefault();pick(sel,o.value);});d.addEventListener('mousemove',()=>{const i=items.indexOf(d);if(i!==idx)setActive(i);});items.push(d);}
      pop.appendChild(d);};
    [...sel.children].forEach(ch=>{if(ch.tagName==='OPTGROUP'){const g=document.createElement('div');g.className='cf-dd-gr';g.textContent=ch.label;pop.appendChild(g);[...ch.children].forEach(add);}else add(ch);});
    document.body.appendChild(pop);
    const r=sel.getBoundingClientRect(),vh=window.innerHeight,vw=window.innerWidth;
    const w=Math.min(Math.max(r.width,pop.scrollWidth+4,180),vw-16);pop.style.minWidth=w+'px';pop.style.maxWidth=(vw-16)+'px';
    const below=vh-r.bottom-12,above=r.top-12,up=below<220&&above>below;
    pop.style.maxHeight=Math.max(140,Math.min(340,up?above:below))+'px';
    pop.style.left=Math.max(8,Math.min(r.left,vw-w-8))+'px';
    if(up)pop.style.bottom=(vh-r.top+6)+'px';else pop.style.top=(r.bottom+6)+'px';
    const si=items.findIndex(el=>el.getAttribute('data-s')==='1');setActive(si<0?0:si);
  };
  const isOurs=t=>t&&t.tagName==='SELECT'&&t.classList.contains('input')&&!t.multiple&&!t.disabled;
  document.addEventListener('mousedown',e=>{
    const t=e.target;
    if(isOurs(t)){e.preventDefault();if(cur===t){close();return;}t.focus();open(t);return;}
    if(pop&&!pop.contains(t))close();
  },true);
  document.addEventListener('keydown',e=>{
    const t=document.activeElement;
    if(pop&&cur){
      if(e.key==='ArrowDown'){e.preventDefault();setActive(Math.min(items.length-1,idx+1));}
      else if(e.key==='ArrowUp'){e.preventDefault();setActive(Math.max(0,idx-1));}
      else if(e.key==='Enter'||e.key===' '){e.preventDefault();const el=items[idx];if(el){const i=[...cur.options].filter(o=>!o.disabled)[idx];if(i)pick(cur,i.value);}}
      else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();const s=cur;close();s.focus();}
      else if(e.key==='Tab')close();
      return;
    }
    if(isOurs(t)&&(e.key==='Enter'||e.key===' '||e.key==='ArrowDown'||e.key==='ArrowUp')){e.preventDefault();open(t);}
  },true);
  window.addEventListener('resize',close);
  document.addEventListener('scroll',e=>{if(pop&&!pop.contains(e.target))close();},true);
})();

// Selectores de fecha y hora, casillas y deslizadores con el estilo de la app (sin controles nativos del sistema).
(function(){
  const css=document.createElement('style');
  css.textContent=`input[type=date]::-webkit-calendar-picker-indicator,input[type=time]::-webkit-calendar-picker-indicator{display:none}
input.input[type=date],input.input[type=time]{cursor:pointer;-webkit-appearance:none;appearance:none}
input[type=checkbox]{-webkit-appearance:none;appearance:none;width:20px;height:20px;margin:0;border-radius:6px;border:1.5px solid var(--color-neutral-400,#b7c2cc);background:#fff center/14px no-repeat;cursor:pointer;flex:none;transition:background-color .12s,border-color .12s}
input[type=checkbox]:checked{background-color:var(--color-accent);border-color:var(--color-accent);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E")}
input[type=checkbox]:focus-visible{outline:2px solid var(--color-accent-300);outline-offset:2px}
input[type=range]{-webkit-appearance:none;appearance:none;height:6px;border-radius:999px;background:var(--color-neutral-200,#e6ebf0);outline:none;cursor:pointer;margin:0}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#fff;border:3px solid currentColor;box-shadow:0 1px 4px rgba(20,50,80,.25);box-sizing:border-box}
input[type=range]::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:#fff;border:3px solid currentColor;box-shadow:0 1px 4px rgba(20,50,80,.25);box-sizing:border-box}
input[type=range]::-moz-range-track{height:6px;border-radius:999px;background:var(--color-neutral-200,#e6ebf0)}
input[type=range]:not([style*="color"]){color:var(--color-accent)}
.cf-pk{position:fixed;z-index:1000;background:#fff;border-radius:16px;box-shadow:0 12px 32px rgba(20,50,80,.18),0 0 0 1px rgba(20,50,80,.06);padding:12px;font-family:var(--font-body);font-size:14px;color:var(--color-text);animation:cfdd .12s ease-out;user-select:none;-webkit-user-select:none}
.cf-pk-h{display:flex;align-items:center;gap:6px;margin-bottom:8px}
.cf-pk-t{flex:1;text-align:center;font-weight:700;text-transform:capitalize}
.cf-pk-b{font:inherit;border:0;background:transparent;border-radius:10px;cursor:pointer;color:var(--color-text);min-width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center}
.cf-pk-b:hover{background:var(--color-accent-100)}
.cf-pk-g{display:grid;grid-template-columns:repeat(7,38px);gap:2px}
.cf-pk-w{font-size:11px;font-weight:700;color:var(--color-neutral-600);text-align:center;padding:4px 0}
.cf-pk-d{font:inherit;font-size:13px;border:0;background:transparent;border-radius:10px;height:36px;cursor:pointer;color:var(--color-text);font-variant-numeric:tabular-nums}
.cf-pk-d:hover{background:var(--color-accent-100)}
.cf-pk-d[data-o="1"]{color:var(--color-neutral-400,#b7c2cc)}
.cf-pk-d[data-t="1"]{box-shadow:inset 0 0 0 1.5px var(--color-accent-300)}
.cf-pk-d[data-s="1"]{background:var(--color-accent);color:#fff;font-weight:700}
.cf-pk-f{display:flex;justify-content:space-between;gap:8px;margin-top:8px;border-top:1px solid var(--color-divider,#e6ebf0);padding-top:8px}
.cf-pk-l{font:inherit;font-size:13px;font-weight:700;border:0;background:transparent;color:var(--color-accent-700);cursor:pointer;padding:6px 10px;border-radius:10px}
.cf-pk-l:hover{background:var(--color-accent-100)}
.cf-pk-tl{max-height:280px;overflow-y:auto;display:grid;grid-template-columns:repeat(4,64px);gap:4px}
.cf-pk-tl .cf-pk-d{height:34px}`;
  document.head.appendChild(css);
  let pop=null,cur=null;
  const MES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const p2=n=>String(n).padStart(2,'0'),iso=d=>d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate());
  const close=()=>{if(pop){pop.remove();pop=null;}cur=null;};
  const setVal=(inp,val)=>{if(inp._cb){inp._cb(val);return;}const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(inp,val);inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}));};
  const place=inp=>{document.body.appendChild(pop);const r=inp.getBoundingClientRect(),vh=window.innerHeight,vw=window.innerWidth,w=pop.offsetWidth,h=pop.offsetHeight;
    pop.style.left=Math.max(8,Math.min(r.left,vw-w-8))+'px';const up=vh-r.bottom<h+16&&r.top>vh-r.bottom;pop.style.top=Math.max(8,up?r.top-h-6:r.bottom+6)+'px';};
  const btn=(cls,txt,fn)=>{const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=txt;b.addEventListener('mousedown',e=>e.preventDefault());b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();fn();});return b;};
  const openDate=(inp,view)=>{
    const sel=inp.value,today=iso(new Date());let base=view||(sel?new Date(sel+'T12:00'):new Date());base=new Date(base.getFullYear(),base.getMonth(),1);
    if(pop)pop.remove();pop=document.createElement('div');pop.className='cf-pk';cur=inp;
    const h=document.createElement('div');h.className='cf-pk-h';
    h.appendChild(btn('cf-pk-b','‹',()=>openDate(inp,new Date(base.getFullYear(),base.getMonth()-1,1))));
    const t=document.createElement('span');t.className='cf-pk-t';t.textContent=MES[base.getMonth()]+' '+base.getFullYear();h.appendChild(t);
    h.appendChild(btn('cf-pk-b','›',()=>openDate(inp,new Date(base.getFullYear(),base.getMonth()+1,1))));pop.appendChild(h);
    const g=document.createElement('div');g.className='cf-pk-g';['L','M','X','J','V','S','D'].forEach(w=>{const s=document.createElement('span');s.className='cf-pk-w';s.textContent=w;g.appendChild(s);});
    const st=new Date(base);st.setDate(1-((base.getDay()+6)%7));
    for(let i=0;i<42;i++){const d=new Date(st.getFullYear(),st.getMonth(),st.getDate()+i),k=iso(d);if(i===35&&d.getMonth()!==base.getMonth())break;
      const b=btn('cf-pk-d',String(d.getDate()),()=>{setVal(inp,k);close();});b.setAttribute('data-o',d.getMonth()!==base.getMonth()?'1':'0');b.setAttribute('data-t',k===today?'1':'0');b.setAttribute('data-s',k===sel?'1':'0');
      if((inp.min&&k<inp.min)||(inp.max&&k>inp.max)){b.disabled=true;b.style.opacity='.35';b.style.cursor='default';}g.appendChild(b);}
    pop.appendChild(g);
    const f=document.createElement('div');f.className='cf-pk-f';f.appendChild(btn('cf-pk-l','Hoy',()=>{setVal(inp,today);close();}));
    if(!inp.required)f.appendChild(btn('cf-pk-l','Borrar',()=>{setVal(inp,'');close();}));pop.appendChild(f);place(inp);
  };
  const openTime=inp=>{
    close();pop=document.createElement('div');pop.className='cf-pk';cur=inp;
    const stp=Math.max(5,Math.round((Number(inp.step)||900)/60)),sel=(inp.value||'').slice(0,5),l=document.createElement('div');l.className='cf-pk-tl';let selB=null;
    const opts=[];for(let m=0;m<1440;m+=stp)opts.push(p2(Math.floor(m/60))+':'+p2(m%60));if(sel&&!opts.includes(sel)){opts.push(sel);opts.sort();}
    opts.forEach(v=>{const b=btn('cf-pk-d',v,()=>{setVal(inp,v);close();});b.setAttribute('data-s',v===sel?'1':'0');if(v===sel)selB=b;l.appendChild(b);});
    pop.appendChild(l);place(inp);
    const tgt=selB||[...l.children].find(b=>b.textContent>='09:00');if(tgt)l.scrollTop=tgt.offsetTop-l.clientHeight/2+17;
  };
  const isOurs=t=>t&&t.tagName==='INPUT'&&(t.type==='date'||t.type==='time')&&!t.disabled&&(!t.readOnly||t.dataset.cfpk==='1');
  const lock=root=>{(root.querySelectorAll?root.querySelectorAll('input[type=date],input[type=time]'):[]).forEach(i=>{if(i.dataset.cfpk)return;if(i.readOnly){i.dataset.cfpk='0';return;}i.dataset.cfpk='1';i.readOnly=true;i.setAttribute('inputmode','none');});};
  const mo=new MutationObserver(ms=>{ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType!==1)return;if(n.tagName==='INPUT')lock(n.parentNode||n);else lock(n);}));});
  const startMo=()=>{lock(document);mo.observe(document.documentElement,{childList:true,subtree:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startMo);else startMo();
  window.CFDate={open(el,value,cb,opts){const o=opts||{};const px={tagName:'X',value:value||'',min:o.min||'',max:o.max||'',required:o.required!==false,_cb:cb,getBoundingClientRect:()=>el.getBoundingClientRect()};if(cur&&cur._el===el){close();return;}px._el=el;openDate(px);}};
  const trigger=(e)=>{const t=e.target;if(isOurs(t)){e.preventDefault();if(cur===t){close();return;}if(t.type==='date')openDate(t);else openTime(t);return;}if(pop&&!pop.contains(t))close();};
  document.addEventListener('mousedown',trigger,true);
  document.addEventListener('touchstart',e=>{if(isOurs(e.target))trigger(e);else if(pop&&!pop.contains(e.target))close();},{capture:true,passive:false});
  document.addEventListener('keydown',e=>{const t=document.activeElement;
    if(pop&&e.key==='Escape'){e.preventDefault();e.stopPropagation();close();return;}
    if(isOurs(t)&&(e.key==='Enter'||e.key===' '||(e.key==='ArrowDown'&&e.altKey))){e.preventDefault();if(t.type==='date')openDate(t);else openTime(t);}
  },true);
  window.addEventListener('resize',close);
  document.addEventListener('scroll',e=>{if(pop&&!pop.contains(e.target))close();},true);
})();
