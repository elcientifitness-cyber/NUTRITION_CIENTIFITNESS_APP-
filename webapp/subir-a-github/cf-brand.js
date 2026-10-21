/* CientiFitness · tema de marca del entrenador (Premium). Usado por index.html y asesorado.html */
(function(){
  const PAL=[['cf','CientiFitness','#1180c2','#f2a497'],['pet','Petróleo','#1f6f5c','#f0a35e'],['mar','Marino','#23324a','#e4b363'],['gra','Granate','#b0413e','#2f4858'],
    ['ind','Índigo','#5b4bb7','#7fd1b9'],['grf','Grafito','#1b1b1f','#d7ff5a'],['tej','Teja','#c2571a','#2b4c3f'],['lag','Laguna','#0e7490','#fbbf77'],
    ['fra','Frambuesa','#9d2b6b','#f5c2d8'],['oli','Oliva','#4d6a2e','#e9d8a6'],['piz','Pizarra','#3d4f63','#9ad0ec'],['cac','Cacao','#7a4b2a','#f2d0a4']];
  const FONTS={sora:['Sora','',"Sora"],outfit:['Outfit','Outfit:wght@500;600;700;800',"Outfit"],jakarta:['Plus Jakarta Sans','Plus+Jakarta+Sans:wght@500;600;700;800',"'Plus Jakarta Sans'"],lora:['Lora','Lora:wght@500;600;700',"Lora"]};
  const MACS={cf:['CientiFitness',{prot:'#f2a497',carb:'#efc95e',fat:'#b3a2ea',veg:'#8ed2aa'}],vivid:['Intensos',{prot:'#e5604a',carb:'#e9a826',fat:'#7b61d6',veg:'#34a86a'}],soft:['Sobrios',{prot:'#c9a49a',carb:'#d2c08e',fat:'#a9a3c4',veg:'#9fbfad'}]};
  const CFMAC={prot:['#f2a497','#fde8e3','#963a2b'],carb:['#efc95e','#fdf3d4','#77560a'],fat:['#b3a2ea','#eee9fc','#51408d'],veg:['#8ed2aa','#e0f4e8','#21633d']};
  const hx=h=>{h=String(h||'').trim().replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');if(!/^[0-9a-f]{6}$/i.test(h))return null;return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16));};
  const toHex=c=>'#'+c.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
  const mix=(a,b,t)=>{const A=hx(a),B=hx(b);if(!A||!B)return a;return toHex(A.map((v,i)=>v*(1-t)+B[i]*t));};
  const lum=h=>{const c=hx(h);if(!c)return 0;const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);};return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2]);};
  const contrast=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);};
  const valid=h=>!!hx(h);
  /* principal: el texto blanco encima debe leerse (≥ 4.5:1); si no, se oscurece */
  const fixP=p=>{if(!valid(p))return {c:'#1180c2',adj:false};let c=toHex(hx(p)),i=0;while(contrast(c,'#ffffff')<4.5&&i<30){c=mix(c,'#000000',0.06);i++;}return {c,adj:i>0};};
  const onColor=c=>contrast(c,'#ffffff')>=contrast(c,'#1b2b3c')?'#ffffff':'#1b2b3c';
  const inkFor=(c,bg)=>{let k=mix(c,'#000000',0.35),i=0;while(contrast(k,bg)<4.6&&i<30){k=mix(k,'#000000',0.08);i++;}return k;};
  const macTrio=c=>{const bg=mix(c,'#ffffff',0.84);return [c,bg,inkFor(c,bg)];};
  function resolve(b){if(!b||!valid(b.p))return null;const P=fixP(b.p),p=P.c,a=valid(b.a)?toHex(hx(b.a)):mix(p,'#ffffff',0.5);
    const tint=b.bg!=='light';const mk=b.mac||'cf';
    let mac=null;if(mk==='custom'&&b.mc){mac={};['prot','carb','fat','veg'].forEach(k=>{mac[k]=valid(b.mc[k])?macTrio(b.mc[k]):CFMAC[k];});}else if(MACS[mk]&&mk!=='cf'){mac={};Object.entries(MACS[mk][1]).forEach(([k,c])=>{mac[k]=macTrio(c);});}
    return {p,pAdj:P.adj,a,aOn:onColor(a),tint,font:FONTS[b.font]?b.font:'sora',mac};}
  function css(b){const R=resolve(b);if(!R)return '';const p=R.p,W='#ffffff',K='#000000';
    const sc={100:mix(p,W,0.88),200:mix(p,W,0.76),300:mix(p,W,0.6),400:mix(p,W,0.38),500:mix(p,W,0.16),600:mix(p,K,0.12),700:mix(p,K,0.26),800:mix(p,K,0.42),900:mix(p,K,0.6)};
    const t1=R.tint?mix(p,W,0.92):'#f4f6f8',t2=R.tint?mix(p,W,0.84):'#ffffff';
    const F=FONTS[R.font];let v='--color-accent:'+p+';'+Object.entries(sc).map(([k,c])=>'--color-accent-'+k+':'+c).join(';')+';--cf-tint:'+t1+';--cf-tint-2:'+t2+';--cf-acc:'+R.a+';--cf-acc-on:'+R.aOn+';--cf-acc-bg:'+mix(R.a,W,0.8)+';--cf-acc-ink:'+inkFor(R.a,mix(R.a,W,0.8))+';--cf-plan-ink:'+sc[700]+';--cf-plan-bg:'+sc[100]+';';
    if(R.font!=='sora')v+='--font-heading:'+F[2]+',system-ui,sans-serif;';
    if(R.mac)Object.entries(R.mac).forEach(([k,[c,bg,ink]])=>{v+='--'+k+':'+c+';--'+k+'-bg:'+bg+';--'+k+'-ink:'+ink+';';});
    let s=':root{'+v+'}body{background:'+t1+'!important}::selection{background:'+sc[200]+'}'+
      '.btn-primary{background:'+p+'!important;box-shadow:none!important;color:#fff!important}.btn-primary:hover{background:'+sc[600]+'!important}'+
      '.cf-nav-count{background:var(--cf-acc-bg)!important;color:var(--cf-acc-ink)!important}'+
      '.cf-side{background:'+t2+'!important;border-color:'+(R.tint?t2:'var(--color-divider)')+'!important}'+
      '.cf-lift:hover{box-shadow:0 0 0 1px '+sc[300]+'!important}';
    if(R.tint)s+='.cf-nav-btn:hover{background:rgba(255,255,255,.55)!important}.cf-nav-btn[data-on="1"]{background:#fff!important;color:'+sc[800]+'!important}';
    return s;}
  function apply(b){const H=document.head;let st=document.getElementById('cf-brand-css');const s=css(b);
    if(!s){if(st)st.remove();const fl=document.getElementById('cf-brand-font');if(fl)fl.remove();setTheme(null);return;}
    if(!st){st=document.createElement('style');st.id='cf-brand-css';H.appendChild(st);}st.textContent=s;
    const R=resolve(b),F=FONTS[R.font];let fl=document.getElementById('cf-brand-font');
    if(F[1]){if(!fl){fl=document.createElement('link');fl.id='cf-brand-font';fl.rel='stylesheet';H.appendChild(fl);}const u='https://fonts.googleapis.com/css2?family='+F[1]+'&display=swap';if(fl.href!==u)fl.href=u;}else if(fl)fl.remove();
    setTheme(R.tint?mix(R.p,'#ffffff',0.84):'#ffffff');}
  let _tc=null;function setTheme(c){const m=document.querySelector('meta[name="theme-color"]');if(!m)return;if(_tc==null)_tc=m.getAttribute('content')||'';m.setAttribute('content',c||_tc);}
  /* icono y nombre al instalar la app (asesorado) */
  let _ic=null,_mn=null,_tt=null,_mu=null;
  function icon(src,name,start){const H=document.head;let l=document.querySelector('link[rel="apple-touch-icon"]'),m=document.querySelector('link[rel="manifest"]'),t=document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if(_ic==null&&l)_ic=l.getAttribute('href');if(_mn==null&&m)_mn=m.getAttribute('href');if(_tt==null&&t)_tt=t.getAttribute('content');
    if(_mu){try{URL.revokeObjectURL(_mu);}catch(e){}_mu=null;}
    if(!src&&!name){if(l&&_ic!=null)l.setAttribute('href',_ic);if(m&&_mn!=null)m.setAttribute('href',_mn);if(t&&_tt!=null)t.setAttribute('content',_tt);return;}
    if(src){if(!l){l=document.createElement('link');l.rel='apple-touch-icon';H.appendChild(l);}l.setAttribute('href',src);}
    if(name&&t)t.setAttribute('content',name.slice(0,24));
    if(m&&_mn){fetch(_mn).then(r=>r.json()).then(j=>{const base=new URL(_mn,location.href);j.start_url=new URL(j.start_url||start||'./',base).href;j.scope=new URL(j.scope||'./',base).href;
      if(j.icons)j.icons=j.icons.map(x=>({...x,src:new URL(x.src,base).href}));if(src)j.icons=[{src,sizes:'256x256',type:'image/png',purpose:'any'}].concat(j.icons||[]);
      if(name){j.name=name;j.short_name=name.slice(0,24);}_mu=URL.createObjectURL(new Blob([JSON.stringify(j)],{type:'application/manifest+json'}));m.setAttribute('href',_mu);}).catch(()=>{});}}
  window.CFBrand={PAL,FONTS,MACS,CFMAC,mix,contrast,valid,fixP,resolve,css,apply,icon};
})();
