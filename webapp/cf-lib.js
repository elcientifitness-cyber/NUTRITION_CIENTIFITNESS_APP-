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
