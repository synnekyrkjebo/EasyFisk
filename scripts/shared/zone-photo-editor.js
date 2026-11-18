const $=selector=>document.querySelector(selector);

async function preparePhoto(file,place){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024)throw new Error('Velg JPG, PNG eller WebP på maks 10 MB.');
 const bitmap=await createImageBitmap(file);
 try{
  const scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);
  let src=canvas.toDataURL('image/jpeg',0.8);
  if(src.length>500000)src=canvas.toDataURL('image/jpeg',0.55);
  if(src.length>500000)throw new Error('Bildet er for stort etter komprimering. Velg et mindre bilde.');
  return {id:crypto.randomUUID(),src,alt:`Bilde fra ${place}`};
 }finally{bitmap.close();}
}

export function zonePhotoEditor(place){
 let images=[],pending=false;
 const input=$('#owner-photo-upload'),grid=$('#owner-photo-grid'),status=$('#owner-photo-status');
 function render(){
  grid.replaceChildren();
  if(!images.length){const empty=document.createElement('p');empty.className='account-status';empty.textContent='Ingen bilder. Legg til et bilde av fiskeplassen.';grid.append(empty);}
  images.forEach((image,index)=>{
   const card=document.createElement('figure');
   const preview=document.createElement('img');preview.src=image.src;preview.alt=image.alt;preview.loading='lazy';
   const label=document.createElement('label');label.className='checkout-label';label.textContent='Bildetekst';label.htmlFor=`owner-photo-alt-${index}`;
   const text=document.createElement('input');text.id=label.htmlFor;text.className='checkout-input';text.value=image.alt;text.maxLength=200;text.addEventListener('input',()=>{image.alt=text.value;});
   const remove=document.createElement('button');remove.type='button';remove.className='account-button';remove.textContent='Fjern bilde';remove.setAttribute('aria-label',`Fjern bilde ${index+1}`);
   remove.addEventListener('click',()=>{images=images.filter(item=>item.id!==image.id);render();status.textContent='Bildet fjernes når du lagrer fiskekortet.';grid.querySelector('button')?.focus();});
   card.append(preview,label,text,remove);grid.append(card);
  });
 }
 input.addEventListener('change',async()=>{
  const files=[...input.files];if(!files.length||pending)return;
  if(images.length+files.length>8){status.textContent='Du kan ha maks åtte bilder. Fjern noen før du legger til flere.';input.value='';return;}
  pending=true;input.disabled=true;$('#owner-settings').querySelector('[type=submit]').disabled=true;status.textContent='Klargjør bilder …';
  try{const added=[];for(const file of files)added.push(await preparePhoto(file,place));images.push(...added);render();status.textContent='Bildene er klare. Lagre fiskekortet for å publisere endringene.';}
  catch(error){status.textContent=error.message||'Kunne ikke lese bildet. Prøv et annet bilde.';}
  finally{pending=false;input.disabled=false;input.value='';$('#owner-settings').querySelector('[type=submit]').disabled=false;}
 });
 return {load(value){images=value.map(image=>({...image}));render();status.textContent='';},getImages(){return images.map(image=>({...image}));}};
}
