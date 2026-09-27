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
