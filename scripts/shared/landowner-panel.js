import {getCurrentUser} from './auth.js';
import {zoneSettings,saveZoneSettings,publishLandownerNotice,landownerNotices} from './landowner-store.js';

const $=selector=>document.querySelector(selector);
async function initialize(){
const user=await getCurrentUser();
const panel=$('#landowner-panel');
if(user?.role==='landowner'&&!new URLSearchParams(location.search).has('bruker')){
 panel.hidden=false;
 $('#account-role').textContent='Grunneier';
 for(const place of user.managedPlaces){const option=document.createElement('option');option.value=place;option.textContent=place;$('#owner-place').append(option);}
 function load(){
  const place=$('#owner-place').value,settings=zoneSettings(place);
  for(const field of ['description','cardTitle','cardInfo','rules'])$(`#owner-${field}`).value=settings[field]|| (field==='cardTitle'?`Døgnkort – ${place}`:'');
  $('#owner-price').value=settings.price??'';$('#owner-capacity').value=settings.capacity??4;$('#owner-closed').checked=Boolean(settings.closed);
  $('#owner-save-status').textContent='';$('#owner-notice-status').textContent='';
  $('#owner-published').replaceChildren();
  for(const notice of landownerNotices().filter(item=>item.place===place)){
   const row=document.createElement('article');row.className='notification-item';
   const title=document.createElement('h3');title.textContent=notice.title;
   const text=document.createElement('p');text.textContent=notice.text;row.append(title,text);$('#owner-published').append(row);
  }
 }
 $('#owner-place').addEventListener('change',load);load();
 for(const [id,action,statusId]of [
  ['#owner-settings',async()=>{
   const details=Object.fromEntries(['description','cardTitle','cardInfo','rules','price','capacity'].map(field=>[field,$(`#owner-${field}`).value]));details.closed=$('#owner-closed').checked;
   await saveZoneSettings($('#owner-place').value,details);return 'Sone og fiskekort er oppdatert.';
  },'#owner-save-status'],
  ['#owner-notice-form',async()=>{
   await publishLandownerNotice($('#owner-place').value,$('#owner-notice-title').value,$('#owner-notice-text').value);
   $('#owner-notice-form').reset();load();return 'Varselet er publisert.';
  },'#owner-notice-status']
 ]){
  $(id).addEventListener('submit',async event=>{
   event.preventDefault();const button=$(id).querySelector('[type=submit]');if(button.disabled||!$(id).reportValidity())return;button.disabled=true;
   try{$(statusId).textContent=await action();}catch(error){$(statusId).textContent=error.message||'Kunne ikke lagre. Prøv igjen.';}finally{button.disabled=false;}
  });
 }
}else if(user){$('#account-role').textContent='Fisker';}

}
initialize().catch(()=>{document.querySelector("#owner-save-status").textContent="Kunne ikke hente grunneierpanelet. Prøv igjen.";});
