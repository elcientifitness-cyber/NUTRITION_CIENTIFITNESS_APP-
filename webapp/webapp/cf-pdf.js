// Cientia · PDF real (A4 vertical u horizontal) a partir de un bloque de la página. Igual en Chrome, Safari y móvil.
(function(){
var JS={};
function load(src){if(!JS[src])JS[src]=new Promise(function(ok,ko){var s=document.createElement('script');s.src=src;s.async=true;s.onload=ok;s.onerror=function(){delete JS[src];ko(new Error('load'));};document.head.appendChild(s);});return JS[src];}
function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
var TH='text-align:left;padding:9px 12px;background:var(--color-accent);color:#fff;font-size:11px;letter-spacing:.08em;text-transform:uppercase;font-weight:700';
// Tabla del plan publicada (plan.tbl) → HTML con estilos en línea
function tableHTML(G){return (G||[]).map(function(g){
  var h='<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:18px">';
  if(g.t)h+='<div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;padding:10px 16px;border-radius:12px;background:var(--cf-plan-bg,var(--color-accent-100));color:var(--cf-plan-ink,var(--color-accent-800))"><span style="font-weight:800;font-size:16px">'+esc(g.t)+'</span><span style="font-size:13px">'+esc(g.d||'')+'</span><span style="margin-left:auto;font-size:13px;font-weight:700">'+esc(g.k||'')+'</span></div>';
  h+='<div class="cf-tw" style="border:1px solid var(--color-divider);border-radius:10px;overflow:hidden"><table style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px;line-height:1.3"><thead><tr><th style="width:140px;'+TH+'">Comida</th>';
  (g.h||[]).forEach(function(x){h+='<th style="'+TH+';border-left:1px solid rgba(255,255,255,.25)"><span style="display:flex;align-items:center;gap:6px">'+(x.sw?'<span style="width:8px;height:8px;border-radius:50%;background:'+x.sw+';box-shadow:0 0 0 1.5px #fff;flex:none"></span>':'')+esc(x.l)+'</span></th>';});
  h+='</tr></thead><tbody>';
  (g.r||[]).forEach(function(r,ri){h+='<tr style="background:'+(ri%2?'var(--color-neutral-100)':'transparent')+'"><td style="vertical-align:top;padding:9px 12px;border-top:1px solid var(--color-divider)"><div style="display:flex;flex-direction:column;gap:3px">';
    if(r.n)h+='<span style="font-weight:800;font-size:13px">'+esc(r.n)+'</span>';
    if(r.sub)h+='<span style="font-size:11px;font-weight:800;color:var(--cf-plan-ink,var(--color-accent-700))">'+esc(r.sub)+'</span>';
    if(r.kc)h+='<span style="font-size:11px;color:var(--color-neutral-700)">'+esc(r.kc)+'</span>';
    if(r.gk)h+='<span style="font-size:10.5px;color:var(--color-neutral-600)">'+esc(r.gk)+'</span>';
    if(r.no)h+='<span style="font-size:11px;line-height:1.35;color:var(--cf-plan-ink,var(--color-accent-800));white-space:pre-wrap">'+esc(r.no)+'</span>';
    if(r.on)h+='<span style="font-size:11px;line-height:1.35;color:var(--cf-plan-ink,var(--color-accent-800));white-space:pre-wrap">'+esc(r.on)+'</span>';
    h+='</div></td>';
    (r.c||[]).forEach(function(c){h+='<td style="vertical-align:top;padding:9px 12px;border-top:1px solid var(--color-divider);border-left:1px solid var(--color-divider)">';
      if(!c){h+='<span style="color:var(--color-neutral-400)">—</span></td>';return;}
      if(c.h)h+='<div style="font-size:10.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--cf-plan-ink,var(--color-accent-700));margin-bottom:3px">'+esc(c.h)+'</div>';
      if(c.no)h+='<div style="font-size:11px;line-height:1.35;color:var(--cf-plan-ink,var(--color-accent-800));white-space:pre-wrap;margin-bottom:4px">'+esc(c.no)+'</div>';
      (c.l||[]).forEach(function(l){h+='<div style="display:flex;justify-content:space-between;align-items:baseline;gap:6px;padding:2px 0;border-bottom:1px dotted var(--color-neutral-300)"><span style="min-width:0;overflow-wrap:anywhere">'+esc(l[0])+(l[2]?'<span style="display:block;font-size:10.5px;color:var(--color-neutral-600)">'+esc(l[2])+'</span>':'')+'</span><strong style="white-space:nowrap;flex:none">'+esc(l[1])+'</strong></div>';});
      h+='</td>';});
    h+='</tr>';});
  return h+'</tbody></table></div></div>';}).join('');}
// Parte las tablas más altas que una página en varias (cada una repite la cabecera)
function splitTables(root,PH){[].slice.call(root.querySelectorAll('table')).forEach(function(t){
  if(t.getBoundingClientRect().height<=PH*0.92)return;var th=t.tHead,tb=t.tBodies[0];if(!tb)return;
  var hH=th?th.getBoundingClientRect().height:0,rows=[].slice.call(tb.rows),chunks=[],cur=[],hh=hH;
  rows.forEach(function(r){var rh=r.getBoundingClientRect().height;if(cur.length&&hh+rh>PH*0.92){chunks.push(cur);cur=[];hh=hH;}cur.push(r);hh+=rh;});if(cur.length)chunks.push(cur);
  if(chunks.length<2)return;var wrap=t.parentElement&&t.parentElement.classList.contains('cf-tw')?t.parentElement:t,par=wrap.parentNode;
  chunks.forEach(function(ch,i){var nt=t.cloneNode(false);if(th)nt.appendChild(th.cloneNode(true));var nb=tb.cloneNode(false);ch.forEach(function(r){nb.appendChild(r);});nt.appendChild(nb);
    var node=nt;if(wrap!==t){node=wrap.cloneNode(false);node.appendChild(nt);}if(i)node.style.marginTop='10px';par.insertBefore(node,wrap);});
  par.removeChild(wrap);});}
// src: elemento a convertir. o: {landscape, width, prep(clone), label, name}
async function make(src,o){o=o||{};var land=!!o.landscape,W=o.width||(land?1040:720),PW=land?297:210,PHm=land?210:297,mg=land?10:12;
  var R=document.documentElement,th0=R.getAttribute('data-theme'),cover=document.createElement('div'),box=document.createElement('div');
  cover.setAttribute('style','position:fixed;inset:0;z-index:9999;background:#1D3A4C;color:#F3F2EF;display:flex;align-items:center;justify-content:center;font:600 15px/1.4 system-ui,sans-serif;text-align:center;padding:24px');cover.textContent=o.label||'Preparando el PDF…';document.body.appendChild(cover);
  try{await Promise.all([load('https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js'),load('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js')]);
    var H2I=window.htmlToImage,JP=window.jspdf&&window.jspdf.jsPDF;if(!H2I||!JP)throw new Error('lib');
    R.setAttribute('data-theme','light');
    var cl=src.cloneNode(true);cl.removeAttribute('id');[].slice.call(cl.querySelectorAll('[data-noprint]')).forEach(function(e){e.remove();});if(o.prep)o.prep(cl);
    cl.style.cssText+=';width:'+W+'px;max-width:none;min-width:0;flex:none;padding:0;margin:0;border-radius:0;box-shadow:none;background:#fff;box-sizing:border-box';
    [].slice.call(cl.querySelectorAll('.cf-tw')).forEach(function(e){e.style.overflow='visible';});[].slice.call(cl.querySelectorAll('table')).forEach(function(t){t.style.minWidth='0';t.style.width='100%';});
    box.setAttribute('style','position:fixed;left:-14000px;top:0;width:'+W+'px;background:#fff;color:var(--color-text);font-family:var(--font-body)');box.appendChild(cl);document.body.appendChild(box);
    await new Promise(function(r){setTimeout(r,140);});await Promise.all([].slice.call(cl.querySelectorAll('img')).map(function(im){return im.complete?0:new Promise(function(r){im.onload=im.onerror=r;});}));
    var cw=PW-2*mg,sc=cw/W,PH=(PHm-2*mg-6)/sc;splitTables(cl,PH);
    var top0=cl.getBoundingClientRect().top,left0=cl.getBoundingClientRect().left,B=[],NO={TABLE:1,THEAD:1,TBODY:1,TR:1,UL:1,OL:1};
    (function walk(el,brk){[].slice.call(el.children).forEach(function(c){var r=c.getBoundingClientRect();if(r.height<1)return;var bk=brk||/page/.test((c.style&&c.style.breakBefore)||'');brk=false;if(r.height>PH*0.9&&c.children.length>1&&!NO[c.tagName])walk(c,bk);else B.push({el:c,t:r.top-top0,b:r.bottom-top0,l:r.left-left0,w:r.width,h:r.height,brk:bk});});})(cl,false);
    var fe='';try{fe=await H2I.getFontEmbedCSS(cl);}catch(e){}
    var opt={pixelRatio:2,backgroundColor:'#ffffff',cacheBust:false};if(fe)opt.fontEmbedCSS=fe;else opt.skipFonts=true;
    if(/iP(hone|ad|od)|Macintosh/.test(navigator.userAgent)&&B[0]){try{await H2I.toCanvas(B[0].el,opt);}catch(e){}}
    var pdf=new JP({unit:'mm',format:'a4',orientation:land?'landscape':'portrait',compress:true}),y=0,prevB=null;
    for(var i=0;i<B.length;i++){var k=B[i],nx=B[i+1],gap=prevB==null||y===0?0:Math.max(0,k.t-prevB);if(k.brk&&y>0){pdf.addPage();y=0;gap=0;}
      if(y>0&&k.h<70&&nx&&nx.h<=PH&&y+gap+k.h+Math.max(0,nx.t-k.b)+nx.h>PH){pdf.addPage();y=0;gap=0;}
      var cv=await H2I.toCanvas(k.el,opt);
      if(k.h<=PH){if(y>0&&y+gap+k.h>PH){pdf.addPage();y=0;}else y+=gap;pdf.addImage(cv.toDataURL('image/jpeg',0.92),'JPEG',mg+k.l*sc,mg+y*sc,k.w*sc,k.h*sc,undefined,'FAST');y+=k.h;}
      else{if(y>0){pdf.addPage();y=0;}var pxr=cv.height/k.h,off=0;while(off<k.h){var hh=Math.min(PH,k.h-off),c2=document.createElement('canvas');c2.width=cv.width;c2.height=Math.ceil(hh*pxr);var x2=c2.getContext('2d');x2.fillStyle='#fff';x2.fillRect(0,0,c2.width,c2.height);x2.drawImage(cv,0,Math.floor(off*pxr),cv.width,c2.height,0,0,cv.width,c2.height);pdf.addImage(c2.toDataURL('image/jpeg',0.92),'JPEG',mg+k.l*sc,mg,k.w*sc,hh*sc,undefined,'FAST');off+=hh;if(off<k.h)pdf.addPage();y=hh;}}
      prevB=k.b;}
    var n=pdf.getNumberOfPages();if(n>1)for(var p=1;p<=n;p++){pdf.setPage(p);pdf.setFontSize(8);pdf.setTextColor(140);pdf.text(p+' / '+n,PW-mg,PHm-5,{align:'right'});}
    var name=(o.name||'Plan de nutrición').replace(/[\\/:*?"<>|]/g,'')+'.pdf';
    return {blob:pdf.output('blob'),pages:n,name:name};
  }finally{if(th0)R.setAttribute('data-theme',th0);else R.removeAttribute('data-theme');if(window.cfSetTheme&&window.cfTheme)window.cfSetTheme(window.cfTheme());box.remove();cover.remove();}}
function download(res){var u=URL.createObjectURL(res.blob),a=document.createElement('a');a.href=u;a.download=res.name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},60000);}
window.CFPdf={make:make,download:download,tableHTML:tableHTML,splitTables:splitTables};
})();
