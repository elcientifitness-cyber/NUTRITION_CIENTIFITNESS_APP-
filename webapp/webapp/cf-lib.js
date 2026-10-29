// Utilidades compartidas entre la app del coach y la de asesorados: fotos de progreso.
(function(){
  const BUCKET='cf-fotos';
  const compress=(file,max=1400,q=0.82)=>new Promise((res,rej)=>{
    const img=new Image(),url=URL.createObjectURL(file);
    img.onload=()=>{const s=Math.min(1,max/Math.max(img.width,img.height)),w=Math.round(img.width*s),h=Math.round(img.height*s);
      const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);URL.revokeObjectURL(url);
      c.toBlob(b=>b?res(b):rej(new Error('No se pudo procesar la imagen')),'image/jpeg',q);};
    img.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('Formato de imagen no válido'));};img.src=url;});
  const toDataUrl=b=>new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(b);});
  const rid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36);
  // Pinta su contenido directamente en <body> (para ventanas a pantalla completa que no queden recortadas).
  window.CFPortal=function(p){const RD=window.ReactDOM;return RD&&RD.createPortal?RD.createPortal(p.children,document.body):p.children;};
  window.CFL={
    compress,toDataUrl,rid,
    async listPhotos(sb,coach,key){
      const {data,error}=await sb.from('cf_photos').select('id,day,path,uploaded_by').eq('coach_id',coach).eq('client_key',key).order('day',{ascending:true});
      if(error)throw error;if(!data.length)return [];
      const {data:urls,error:e2}=await sb.storage.from(BUCKET).createSignedUrls(data.map(p=>p.path),3600);if(e2)throw e2;
      const m={};(urls||[]).forEach(u=>{m[u.path]=u.signedUrl;});
      return data.map(p=>({id:p.id,day:p.day,path:p.path,by:p.uploaded_by,url:m[p.path]}));
    },
    async uploadPhoto(sb,coach,key,day,file,by){
      const blob=await compress(file),path=coach+'/'+key+'/'+day+'-'+rid()+'.jpg';
      const {error}=await sb.storage.from(BUCKET).upload(path,blob,{contentType:'image/jpeg'});if(error)throw error;
      const {error:e2}=await sb.from('cf_photos').insert({coach_id:coach,client_key:key,day,path,uploaded_by:by});if(e2)throw e2;
    },
    async deletePhoto(sb,p){await sb.storage.from(BUCKET).remove([p.path]);const {error}=await sb.from('cf_photos').delete().eq('id',p.id);if(error)throw error;}
  };
})();

// Barras deslizables (.cf-rail): degradado en el borde si hay más, rueda vertical = desplazamiento lateral, arrastre con ratón.
(function(){
  if(window.__cfRail)return;window.__cfRail=1;
  const upd=el=>{const l=el.scrollLeft>2,r=el.scrollLeft+el.clientWidth<el.scrollWidth-2,v=(l?'l':'')+(r?'r':'');if((el.getAttribute('data-ov')||'')!==v)el.setAttribute('data-ov',v);};
  let q=false;const all=()=>{q=false;document.querySelectorAll('.cf-rail').forEach(upd);};
  const sched=()=>{if(!q){q=true;requestAnimationFrame(all);}};
  const start=()=>{new MutationObserver(sched).observe(document.body,{childList:true,subtree:true,characterData:true});sched();};
  if(document.body)start();else document.addEventListener('DOMContentLoaded',start);
  window.addEventListener('resize',sched);
  document.addEventListener('scroll',e=>{const t=e.target;if(t&&t.classList&&t.classList.contains('cf-rail'))upd(t);},true);
  const railOf=t=>t&&t.closest?t.closest('.cf-rail'):null,canX=el=>el&&el.scrollWidth>el.clientWidth+1;
  document.addEventListener('wheel',e=>{const el=railOf(e.target);if(!canX(el)||e.ctrlKey||Math.abs(e.deltaX)>=Math.abs(e.deltaY))return;
    const max=el.scrollWidth-el.clientWidth,nx=Math.max(0,Math.min(max,el.scrollLeft+e.deltaY));if(nx===el.scrollLeft)return;el.scrollLeft=nx;e.preventDefault();},{passive:false});
  let d=null;
  document.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;const el=railOf(e.target);if(!canX(el))return;d={el,x:e.clientX,s:el.scrollLeft,moved:false};},true);
  document.addEventListener('pointermove',e=>{if(!d)return;const dx=e.clientX-d.x;if(!d.moved&&Math.abs(dx)>6){d.moved=true;d.el.classList.add('cf-dragging');}if(d.moved)d.el.scrollLeft=d.s-dx;},true);
  const end=()=>{if(!d)return;const m=d.moved;d.el.classList.remove('cf-dragging');d=null;
    if(m){const kill=ev=>{ev.stopPropagation();ev.preventDefault();};window.addEventListener('click',kill,true);setTimeout(()=>window.removeEventListener('click',kill,true),60);}};
  document.addEventListener('pointerup',end,true);document.addEventListener('pointercancel',end,true);
})();

// Archivos en el chat: el mensaje lleva [[cf:file|ruta|tipo|bytes|nombre]] y el archivo va a cf-fotos/coach/cliente/chat/
(function(){
  const MAX=50*1024*1024,RE=/\[\[cf:file\|([^|\]]+)\|([^|\]]*)\|(\d*)\|([^\]]*)\]\]/;
  const kind=t=>/^image\//.test(t)?'img':/^video\//.test(t)?'vid':'file';
  const size=n=>{n=+n||0;return n>=1048576?(n/1048576).toFixed(1).replace('.',',')+' MB':Math.max(1,Math.round(n/1024))+' KB';};
  const parse=b=>{const m=RE.exec(String(b||''));if(!m)return null;let nm='';try{nm=decodeURIComponent(m[4]);}catch(e){nm=m[4];}return {p:m[1],t:m[2],n:+m[3]||0,name:nm||'archivo',kind:kind(m[2]),size:size(m[3])};};
  const label=(k,nm)=>k==='img'?'Foto':k==='vid'?'Vídeo':'Archivo: '+nm;
  async function upload(sb,base,file){if(!file)throw new Error('Sin archivo');
    let b=file,t=file.type||'application/octet-stream',nm=String(file.name||'archivo').slice(-80);
    if(/^image\/(jpeg|png|webp)$/i.test(t)&&file.size>1.5e6&&window.CFL&&CFL.compress){try{b=await CFL.compress(file,2000,0.85);t='image/jpeg';nm=nm.replace(/\.[^.]+$/,'')+'.jpg';}catch(e){b=file;}}
    if(b.size>MAX)throw new Error('pesa '+size(b.size)+' y el máximo es 50 MB');
    const xm=/\.([a-z0-9]{1,6})$/i.exec(nm),ext=t==='image/jpeg'?'jpg':(xm?xm[1].toLowerCase():'bin'),rid=(window.CFL&&CFL.rid?CFL.rid():Math.random().toString(36).slice(2))+Date.now().toString(36);
    const p=sb?base+'/chat/'+rid+'.'+ext:'demo/'+rid,body=label(kind(t),nm)+'\n[[cf:file|'+p+'|'+t+'|'+b.size+'|'+encodeURIComponent(nm)+']]';
    if(sb){const {error}=await sb.storage.from('cf-fotos').upload(p,b,{contentType:t,cacheControl:'3600'});if(error)throw error;}
    return {body,p,url:URL.createObjectURL(b)};}
  window.CFChat={MAX,parse,upload,size,kind};
})();
