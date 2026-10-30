/* Cientia · movimiento suave (sin dependencias). CFMotion.enter(el,{y,x,o,d}) */
(function(){
  var E='cubic-bezier(.2,.8,.2,1)';
  function reduced(){try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}}
  function enter(el,o){
    if(!el||!el.animate||reduced())return;o=o||{};
    var y=o.y==null?6:o.y,x=o.x||0,op=o.o==null?0:o.o;
    try{
      if(el._cfm)el._cfm.cancel();
      el._cfm=el.animate([{opacity:op,transform:'translate('+x+'px,'+y+'px)'},{opacity:1,transform:'none'}],{duration:o.d||200,easing:E});
      el._cfm.onfinish=function(){el._cfm=null;};
    }catch(e){}
  }
  window.CFMotion={enter:enter,reduced:reduced};
})();
