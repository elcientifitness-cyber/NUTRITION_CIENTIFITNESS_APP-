// Cientia · Lista de la compra: total por alimento con desglose (g/día × días · comida y opción). Compartido panel / app del asesorado.
(function(){
var PK=[[/clara/,'brick','bricks','de 500 g',500],[/huevo/,'docena','docenas','',660],[/yogur/,'pack','packs','de 4 (500 g)',500],[/leche|bebida de (avena|soja|almendra|arroz)/,'brick','bricks','de 1 L',1000],
 [/queso fresco batido|queso batido|skyr/,'tarrina','tarrinas','de 500 g',500],[/copos de avena|^avena/,'paquete','paquetes','de 500 g',500],[/arroz/,'paquete','paquetes','de 1 kg',1000],
 [/pasta|macarr|espagu|fideo/,'paquete','paquetes','de 500 g',500],[/pan de molde/,'paquete','paquetes','de 450 g',450],[/tortitas/,'paquete','paquetes','de 130 g',130],
 [/aceite/,'botella','botellas','de 1 L',920],[/garbanz|lentej|alubi|judias blancas/,'bote','botes','de 400 g',400],[/atun/,'lata','latas','(56 g escurrido)',56],
 [/pechuga|pollo|pavo/,'bandeja','bandejas','de 500 g',500],[/ternera|carne picada/,'bandeja','bandejas','de 400 g',400],[/jamon|lomo embuchado/,'sobre','sobres','de 100 g',100],
 [/arandan|frambues|moras/,'tarrina','tarrinas','de 125 g',125],[/fresa/,'tarrina','tarrinas','de 500 g',500],[/crema de cacahuete|mantequilla de cacahuete/,'bote','botes','de 350 g',350],
 [/almendra|nuez|nueces|anacardo|avellana|frutos secos/,'bolsa','bolsas','de 200 g',200],[/patata/,'malla','mallas','de 2 kg',2000],[/tomate (triturado|rallado|frito)/,'bote','botes','de 400 g',400],
 [/chocolate/,'tableta','tabletas','de 100 g',100],[/miel/,'tarro','tarros','de 500 g',500],[/hummus/,'tarrina','tarrinas','de 240 g',240]];
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
function n1(x){return (Math.round(x*10)/10).toLocaleString('es-ES');}
function half(x){return x>=3?Math.round(x):Math.round(x*2)/2;}
function hTxt(q){var w=Math.floor(q),f=q-w;return (w?w:'')+(f?(w?' ':'')+'½':'');}
function fq(g,u){if(u&&u.g>0){var p=half(g/u.g);if(p<0.5)p=0.5;return hTxt(p)+' '+(p>1?u.pl:u.n);}if(g>=1000)return n1(g/1000).replace(/,0$/,'')+' kg';return Math.round(g)+' g';}
function hm(g,hu){if(!hu||!(hu.g>0))return '';var q=half(g/hu.g);if(q<0.5)return '';return '≈ '+hTxt(q)+' '+(q>1?hu.pl:hu.n);}
function pack(name,g){var s=norm(name);for(var i=0;i<PK.length;i++){var p=PK[i];if(p[0].test(s)){if(g<p[4]*0.25)return '';var c=Math.max(1,Math.ceil(g/p[4]-0.15));return c+' '+(c>1?p[2]:p[1])+(p[3]?' '+p[3]:'');}}return '';}
function even(meals){var o={};(meals||[]).forEach(function(M){var k=M.opts.length,a=[];for(var i=0;i<k;i++)a.push(Math.floor(M.n/k)+(i<M.n%k?1:0));o[M.k]=a;});return o;}
function fix(meals,al){var E=even(meals),o={};(meals||[]).forEach(function(M){var a=al&&al[M.k];o[M.k]=Array.isArray(a)&&a.length===M.opts.length&&a.reduce(function(s,x){return s+x;},0)===M.n&&a.every(function(x){return x>=0;})?a.slice():E[M.k];});return o;}
function list(X,al){if(!X||!X.items)return [];al=fix(X.meals,al);var S={};
  X.items.forEach(function(it){var ps=[],tot=0;(it.parts||[]).forEach(function(p){var d=p.m!=null?((al[p.m]||[])[p.o]||0):p.d;if(!(d>0)||!(p.g>0))return;tot+=p.g*d;ps.push({g:p.g,d:d,w:p.w||''});});if(!(tot>0))return;
    var br=ps.length===1&&ps[0].d===1?ps[0].w:ps.map(function(p){return fq(p.g,it.u)+' × '+p.d+(p.d===1?' día':' días')+(p.w?' · '+p.w:'');}).join('  +  ');
    var sub=[it.u?'':hm(tot,it.hu),pack(it.n,tot)].filter(Boolean).join(' · ');
    (S[it.cat]=S[it.cat]||[]).push({n:it.n,tot:fq(tot,it.u),sub:sub,br:br});});
  var ord=(X.sec||[]).concat(Object.keys(S).filter(function(k){return (X.sec||[]).indexOf(k)<0;}));
  return ord.filter(function(k){return S[k];}).map(function(k){return {cat:k,items:S[k]};});}
function daysTxt(X,al){al=fix(X&&X.meals,al);return ((X&&X.meals)||[]).map(function(M){return {k:M.k,name:M.name,n:M.n,txt:M.opts.map(function(l,i){return String.fromCharCode(65+i)+' '+al[M.k][i]+(al[M.k][i]===1?' día':' días');}).join(' · ')};});}
function step(X,al,k,i,up){al=fix(X.meals,al);var M=(X.meals||[]).find(function(q){return q.k===k;});if(!M)return al;var a=al[k];
  if(up){if(a[i]>=M.n)return al;var j=-1;a.forEach(function(x,q){if(q!==i&&x>0&&(j<0||x>=a[j]))j=q;});if(j<0)return al;a[j]--;a[i]++;}
  else{if(a[i]<=0||a.length<2)return al;a[i]--;a[(i+1)%a.length]++;}return al;}
window.CFShop={list:list,even:even,fix:fix,daysTxt:daysTxt,step:step,fq:fq};
})();
