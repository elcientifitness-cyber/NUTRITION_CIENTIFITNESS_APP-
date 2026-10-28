// Cientia · Ciclo menstrual: cálculo compartido (panel, app del asesorado). Datos en cf_daylogs.survey: mens 'p'|'s', mfl l|m|h, msy [], cycM.
(function(){
var DMS=864e5;
function dn(d){var p=String(d).split('-');return Math.round(Date.UTC(+p[0],+p[1]-1,+p[2])/DMS);}
function ds(n){return new Date(n*DMS).toISOString().slice(0,10);}
function add(d,k){return ds(dn(d)+k);}
function med(a){var b=a.slice().sort(function(x,y){return x-y;}),m=b.length>>1;return b.length?(b.length%2?b[m]:(b[m-1]+b[m])/2):0;}
var MODES=[['nat','Ciclo natural','Sin anticonceptivo hormonal. Se calculan las fases y la próxima regla.'],['horm','Anticonceptivo hormonal','Píldora, anillo, parche, DIU hormonal o implante. Sin fases: solo sangrado y síntomas.'],['preg','Embarazo o lactancia','Sin predicción. Puedes seguir apuntando síntomas.'],['meno','Perimenopausia o menopausia','Sin predicción. Apunta sangrados y síntomas si los hay.']];
var PH={men:['Regla','#A44A55','#A44A55'],fol:['Folicular','#9FB1BB','#3D5663'],ov:['Ovulación (estimada)','#C9A978','#7A5A2E'],lut:['Lútea','#7B6E9A','#5B4F80']};
function modeOf(map,def){var best=null;Object.keys(map||{}).forEach(function(d){var s=map[d];if(s&&s.cycM&&(!best||d>best))best=d;});return best?map[best].cycM:(def||'nat');}
function calc(map,today,mode){
  map=map||{};mode=mode||modeOf(map,'nat');
  var P=Object.keys(map).filter(function(d){return map[d]&&map[d].mens==='p'&&d<=today;}).sort(),starts=[];
  P.forEach(function(d){var l=starts.length?starts[starts.length-1]:null;if(l&&dn(d)-dn(l.e)<=3)l.e=d;else starts.push({d:d,e:d});});
  starts.forEach(function(s){s.pl=dn(s.e)-dn(s.d)+1;});
  var cyc=[];for(var i=1;i<starts.length;i++){var L=dn(starts[i].d)-dn(starts[i-1].d);cyc.push({from:starts[i-1].d,to:starts[i].d,len:L,out:L<21||L>45});}
  var typ=cyc.filter(function(c){return !c.out;}).slice(-6);
  if(typ.length>=3){var m0=med(typ.map(function(c){return c.len;}));cyc.forEach(function(c){if(!c.out&&Math.abs(c.len-m0)>12)c.out=true;});typ=cyc.filter(function(c){return !c.out;}).slice(-6);}
  var n=typ.length,lens=typ.map(function(c){return c.len;}),M=n?Math.round(med(lens)):28,mn=n>=2?Math.min.apply(null,lens):M-3,mx=n>=2?Math.max.apply(null,lens):M+3;
  var pls=starts.slice(-6).map(function(s){return s.pl;}).filter(function(x){return x>=2&&x<=10;}),pl=pls.length?Math.round(med(pls)):5;
  var last=starts.length?starts[starts.length-1]:null;
  var R={mode:mode,has:!!last,starts:starts,cycles:cyc,n:n,med:M,min:mn,max:mx,pl:pl,orient:n<2,irr:n>=3&&mx-mn>8,last:last?last.d:null,day:null,since:null,status:'empty',phase:null,next:null,ov:null,ovS:null,ovE:null};
  if(!last){R.status=mode==='nat'?'empty':(mode==='horm'?'horm':'nopred');return R;}
  R.day=dn(today)-dn(last.d)+1;R.since=R.day-1;
  if(mode!=='nat'){R.status=mode==='horm'?'horm':'nopred';return R;}
  if(R.day>=60){R.status='long';return R;}
  if(R.irr){R.status='irr';return R;}
  var oc=M-14;R.ovS=Math.max(pl+2,oc-2);R.ovE=Math.max(R.ovS,oc+2);
  R.next={a:add(last.d,mn),b:add(last.d,mx),p:add(last.d,M)};R.ov={a:add(last.d,R.ovS-1),b:add(last.d,R.ovE-1)};
  var bl=map[today]&&map[today].mens==='p';
  R.phase=bl||R.day<=Math.max(pl,last.pl)?'men':R.day<R.ovS?'fol':R.day<=R.ovE?'ov':'lut';
  R.status=R.day>mx+7?'late':R.day>mx?'due':'reg';
  return R;}
function phaseAt(R,d){if(!R||R.mode!=='nat'||R.irr||!R.starts.length)return null;var st=null;R.starts.forEach(function(s){if(s.d<=d)st=s;});if(!st)return null;var day=dn(d)-dn(st.d)+1;if(day<=st.pl)return 'men';if(day>60)return null;var ovS=Math.max(R.pl+2,R.med-16),ovE=Math.max(ovS,R.med-12);return day<ovS?'fol':day<=ovE?'ov':'lut';}
function dayOf(R,d){if(!R||!R.starts.length)return null;var st=null;R.starts.forEach(function(s){if(s.d<=d)st=s;});return st?dn(d)-dn(st.d)+1:null;}
window.CFCycle={calc:calc,phaseAt:phaseAt,dayOf:dayOf,modeOf:modeOf,MODES:MODES,PH:PH,add:add,dn:dn,ds:ds};
})();
