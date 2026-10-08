// CientiFitness · Cuestionarios: plantillas por defecto y utilidades compartidas
// (panel del entrenador, app del asesorado y página pública cuestionario.html)
(function(){
var S=function(id,label){return {id:id,type:'sec',label:label};};
var Q=function(id,type,label,o){var q={id:id,type:type,label:label};if(o)for(var k in o)q[k]=o[k];return q;};
var INICIAL={id:'f-inicial',kind:'inicial',name:'Cuestionario inicial',
  intro:'Gracias por confiar en nosotros. Con estas preguntas preparamos tu plan a tu medida. Tardarás unos 10 minutos y puedes dejarlo a medias: se guarda en este dispositivo.',
  qs:[
  S('s1','Datos personales'),
  Q('nombre','text','Nombre y apellidos',{req:true,map:'name'}),
  Q('email','text','Email',{map:'email'}),
  Q('tel','text','Teléfono (WhatsApp)',{map:'phone'}),
  Q('sexo','one','Sexo',{opts:['Mujer','Hombre'],req:true,map:'sexo'}),
  Q('edad','num','Edad',{unit:'años',req:true,map:'edad'}),
  Q('altura','num','Altura',{unit:'cm',req:true,map:'altura'}),
  Q('peso','num','Peso actual',{unit:'kg',req:true,map:'peso'}),
  S('s2','Tu objetivo'),
  Q('objetivo','one','Objetivo principal',{opts:['Perder grasa','Ganar masa muscular','Recomposición corporal','Rendimiento deportivo','Salud y hábitos','Preparar una competición'],req:true}),
  Q('plazo','text','¿Tienes una fecha o evento en mente?',{help:'Boda, competición, verano… Déjalo en blanco si no.'}),
  Q('meta3','long','¿Qué te gustaría haber conseguido en 3 meses?'),
  S('s3','Salud'),
  Q('patol','long','Enfermedades o patologías diagnosticadas',{help:'Diabetes, tiroides, hipertensión, digestivas… Escribe «Ninguna» si no tienes.',req:true,alert:true,alertLabel:'Salud'}),
  Q('lesion','long','Lesiones actuales o pasadas',{req:true,alert:true,alertLabel:'Lesiones'}),
  Q('medic','long','¿Tomas alguna medicación? ¿Cuál?',{req:true,alert:true,alertLabel:'Medicación'}),
  Q('suple','long','Suplementos que tomas ahora'),
  Q('alerg','long','Alergias o intolerancias alimentarias',{req:true,alert:true,alertLabel:'Alergias',map:'allergies'}),
  S('s4','Alimentación'),
  Q('dieta','one','Tipo de alimentación',{opts:['Omnívora','Vegetariana','Vegana','Pescetariana','Otra']}),
  Q('nogusta','long','Alimentos que no te gustan o no comes',{map:'allergies'}),
  Q('gusta','long','Alimentos que te encantan y quieres mantener'),
  Q('ncom','one','¿Cuántas comidas haces al día?',{opts:['2','3','4','5','6 o más']}),
  Q('fuera','one','¿Comes fuera de casa?',{opts:['Casi nunca','1–2 veces por semana','3–5 veces por semana','A diario']}),
  S('s5','Horarios y rutina'),
  Q('horario','text','Horario de trabajo o estudios',{help:'Por ejemplo: 8:00–15:00 de lunes a viernes'}),
  Q('levanta','text','¿A qué hora te levantas?'),
  Q('acuesta','text','¿A qué hora te acuestas?'),
  Q('trabajo','one','Tu trabajo es…',{opts:['Sentado casi todo el día','De pie','Físico (cargas, mucho movimiento)','Mixto']}),
  Q('pasos','one','Pasos diarios aproximados',{opts:['Menos de 5.000','5.000–8.000','8.000–12.000','Más de 12.000','No lo sé']}),
  S('s6','Entrenamiento'),
  Q('exp','one','Experiencia entrenando',{opts:['Ninguna','Menos de 1 año','1–3 años','Más de 3 años']}),
  Q('dias','one','Días de entrenamiento por semana',{opts:['0','1–2','3–4','5–6','7']}),
  Q('tipo','multi','Tipo de entrenamiento',{opts:['Fuerza / pesas','Cardio','Running','Crossfit','Deporte de equipo','Clases dirigidas','Otro']}),
  Q('hentreno','text','¿A qué hora sueles entrenar?'),
  S('s7','Hábitos'),
  Q('sueno','num','Horas de sueño por noche',{unit:'h'}),
  Q('csueno','scale','Calidad del sueño',{lo:'Muy mala',hi:'Excelente'}),
  Q('estres','scale','Nivel de estrés',{lo:'Nada',hi:'Muchísimo'}),
  Q('agua','one','Agua al día',{opts:['Menos de 1 L','1–2 L','2–3 L','Más de 3 L']}),
  Q('alcohol','one','Alcohol',{opts:['Nunca','Ocasional','Fines de semana','Varias veces por semana']}),
  Q('tabaco','yesno','¿Fumas?'),
  S('s8','Consentimiento'),
  Q('rgpd','consent','Acepto que mi entrenador trate mis datos personales y de salud para elaborar y seguir mi plan de nutrición y entrenamiento. Puedo pedir su consulta, corrección o eliminación cuando quiera.',{req:true})
]};
var REVISION={id:'f-revision',kind:'revision',name:'Revisión semanal',
  intro:'Un repaso rápido de tu semana para ajustar el plan. Son 2 minutos.',
  qs:[
  S('r1','Tu semana'),
  Q('peso','num','Peso de esta semana (en ayunas)',{unit:'kg'}),
  Q('adh','scale','¿Cuánto has cumplido la dieta?',{lo:'Nada',hi:'Al 100 %',req:true}),
  Q('adhe','scale','¿Cuánto has cumplido el entrenamiento?',{lo:'Nada',hi:'Al 100 %',req:true}),
  Q('hambre','scale','Hambre',{lo:'Ninguna',hi:'Muchísima'}),
  Q('energia','scale','Energía',{lo:'Agotado',hi:'Genial'}),
  Q('csueno','scale','Calidad del sueño',{lo:'Muy mala',hi:'Excelente'}),
  Q('estres','scale','Estrés',{lo:'Nada',hi:'Muchísimo'}),
  Q('digest','one','Digestiones',{opts:['Buenas','Normales','Malas']}),
  S('r2','Comentarios'),
  Q('bien','long','¿Qué ha ido bien?'),
  Q('cuesta','long','¿Qué te ha costado más?'),
  Q('cambio','long','¿Quieres cambiar algo del plan?'),
  Q('molest','long','Molestias o lesiones nuevas',{alert:true,alertLabel:'Molestias'})
]};
var DEFS=[INICIAL,REVISION];
var TYPES=[['text','Texto corto'],['long','Texto largo'],['num','Número'],['one','Elegir una'],['multi','Elegir varias'],['scale','Escala 1–10'],['yesno','Sí / No'],['consent','Aceptación'],['sec','Sección']];
var MAPS=[['','No pasa a la ficha'],['name','Nombre'],['email','Email'],['phone','Teléfono'],['sexo','Sexo'],['edad','Edad'],['altura','Altura (cm)'],['peso','Peso (kg)'],['allergies','Alergias / vetos']];
var NONE=/^(no|ningun[oa]?s?|nada|-+|—|n\/?a|no tengo( ninguna?)?|ninguna conocida|sin (alergias|lesiones|medicaci[oó]n))\.?$/i;
function empty(v){return v==null||v===''||(Array.isArray(v)&&!v.length)||v===false;}
function numv(v){var n=parseFloat(String(v).replace(',','.'));return isNaN(n)?null:n;}
function fmt(q,v){if(v==null||v===''||(Array.isArray(v)&&!v.length))return '—';
  if(Array.isArray(v))return v.join(', ');
  if(q.type==='scale')return v+' / 10';
  if(q.type==='yesno')return v===true||v==='Sí'?'Sí':'No';
  if(q.type==='consent')return v?'Aceptado':'No aceptado';
  if(q.type==='num')return String(v).replace('.',',')+(q.unit?' '+q.unit:'');
  return String(v);}
function alerts(form,ans){ans=ans||{};var out=[];(form.qs||[]).forEach(function(q){if(!q.alert)return;var v=ans[q.id];if(empty(v))return;var t=String(Array.isArray(v)?v.join(', '):v).trim();if(!t||NONE.test(t))return;out.push({label:q.alertLabel||q.label,txt:t});});return out;}
function missing(form,ans,qs){ans=ans||{};return (qs||form.qs||[]).filter(function(q){return q.req&&q.type!=='sec'&&empty(ans[q.id]);});}
// Pasa las respuestas a la ficha. full=false: solo rellena lo vacío (nombre, email, teléfono, alergias).
function apply(cl,form,ans,full){ans=ans||{};var done=[];cl.calc=cl.calc||{};
  (form.qs||[]).forEach(function(q){var v=ans[q.id];if(!q.map||empty(v))return;var s=String(v).trim();
    if(q.map==='name'&&!String(cl.name||'').trim()){cl.name=s;done.push('nombre');}
    else if(q.map==='email'&&!cl.email&&/@/.test(s)){cl.email=s.toLowerCase();done.push('email');}
    else if(q.map==='phone'&&!cl.phone){cl.phone=s;done.push('teléfono');}
    else if(q.map==='allergies'){if(NONE.test(s))return;var cur=String(cl.allergies||''),have=cur.toLowerCase();var add=s.split(/[,;\n]+/).map(function(x){return x.trim();}).filter(function(x){return x&&!NONE.test(x)&&have.indexOf(x.toLowerCase())<0;});if(add.length){cl.allergies=(cur?cur.replace(/[,\s]+$/,'')+', ':'')+add.join(', ');done.push('alergias / vetos');}}
    else if(full){var n=numv(v);
      if(q.map==='sexo'){cl.calc.sexo=/mujer/i.test(s)?'mujer':'hombre';done.push('sexo');}
      else if(q.map==='edad'&&n){cl.calc.edad=Math.round(n);done.push('edad');}
      else if(q.map==='altura'&&n){cl.calc.altura=n<3?Math.round(n*100):Math.round(n);done.push('altura');}
      else if(q.map==='peso'&&n){cl.calc.peso=n;done.push('peso');}}});
  return done;}
function hasCalc(form,ans){return (form.qs||[]).some(function(q){return ['sexo','edad','altura','peso'].indexOf(q.map)>=0&&!empty((ans||{})[q.id]);});}
function clone(f){return JSON.parse(JSON.stringify(f));}
function uid(){return Math.random().toString(36).slice(2,9);}
window.CFForms={DEFS:DEFS,TYPES:TYPES,MAPS:MAPS,fmt:fmt,alerts:alerts,missing:missing,apply:apply,hasCalc:hasCalc,empty:empty,clone:clone,uid:uid};
})();
