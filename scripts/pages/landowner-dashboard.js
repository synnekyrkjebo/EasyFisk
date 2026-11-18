import {getCurrentUser,logoutUser} from '../shared/auth.js';
import {saveZoneSettings,publishLandownerNotice,landownerNotices} from '../shared/landowner-store.js';
import {initializeLandownerCalendar} from '../shared/landowner-calendar.js';
import {zoneDetails} from '../shared/zone-details.js';
import {zonePhotoEditor} from '../shared/zone-photo-editor.js';

const $=selector=>document.querySelector(selector);
const node=(tag,text,className='')=>{const element=document.createElement(tag);element.textContent=text;element.className=className;return element;};

async function initialize(){
 const user=await getCurrentUser();
 if(user?.role!=='landowner'){
  $('#access-message').textContent=user?'Denne siden er for grunneiere. Bytt til grunneierbrukeren for å fortsette.':'Logg inn som grunneier for å administrere dine soner og fiskekort.';
  return;
 }
 $('#dashboard-access').hidden=true;$('#landowner-panel').hidden=false;
 $('#owner-estate').textContent=user.managedPlaces[0];$('#owner-card-label').textContent=user.managedPlaces[0];$('#owner-account-badge').textContent=`${user.managedPlaces[0]} · Grunneier`;
 const ownNotices=()=>landownerNotices().filter(notice=>user.managedPlaces.includes(notice.place));
 const ownedPlace=user.managedPlaces[0];
 const photoEditor=zonePhotoEditor(ownedPlace);
 for(const label of document.querySelectorAll('[data-owner-place]'))label.textContent=ownedPlace;
 function noticeCard(notice){
  const card=node('article','','dashboard-notice');
  card.append(node('p',notice.place,'dashboard-eyebrow'),node('h3',notice.title),node('p',notice.text));
  if(notice.recipientEmails)card.append(node('p',`Sendt til ${notice.recipientEmails.length} ${notice.recipientEmails.length===1?'fisker':'fiskere'} · ${notice.bookingDate}`,'account-status'));
  if(notice.time){const time=node('time',new Intl.DateTimeFormat('nb-NO',{dateStyle:'medium',timeStyle:'short'}).format(new Date(notice.time)));time.dateTime=notice.time;card.append(time);}
  return card;
 }
 function renderPublished(){
  const container=$('#owner-published');container.replaceChildren();
  const notices=ownNotices().filter(notice=>notice.place===ownedPlace);
  if(!notices.length)container.append(node('p','Ingen varsler for denne fiskeplassen ennå.','account-status'));
  for(const notice of notices)container.append(noticeCard(notice));
 }
 function loadSettings(){
  const place=ownedPlace,settings=zoneDetails(place);
  for(const field of ['description','cardTitle','cardInfo','rules'])$(`#owner-${field}`).value=settings[field]??'';
  photoEditor.load(settings.images??[]);
  $('#owner-price').value=settings.price??'';$('#owner-capacity').value=settings.capacity??4;$('#owner-closed').checked=Boolean(settings.closed);
  $('#owner-save-status').textContent='';
 }
 function showView(focus=false){
  const requested=location.hash.slice(1),view=['kalender','soner','varsler'].includes(requested)?requested:'kalender';
  for(const section of document.querySelectorAll('[data-dashboard-view]'))section.hidden=section.dataset.dashboardView!==view;
  for(const link of document.querySelectorAll('[data-dashboard-nav]')){
   if(link.dataset.dashboardNav===view)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
  }
  const heading=document.querySelector(`[data-dashboard-view="${view}"] h1`);
  document.title=`${heading.textContent} – Grunneier – EasyFisk`;
  if(focus){heading.focus({preventScroll:true});window.scrollTo(0,0);}
 }
 window.addEventListener('hashchange',()=>showView(true));
 $('#owner-settings').addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget,button=form.querySelector('[type=submit]');if(button.disabled||!form.reportValidity())return;button.disabled=true;
  try{
   const details=Object.fromEntries(['description','cardTitle','cardInfo','rules','price','capacity'].map(field=>[field,$(`#owner-${field}`).value]));details.closed=$('#owner-closed').checked;
   details.images=photoEditor.getImages();
   await saveZoneSettings(ownedPlace,details);$('#owner-save-status').textContent='Sone og fiskekort er oppdatert.';
  }catch(error){$('#owner-save-status').textContent=error.message||'Kunne ikke lagre. Prøv igjen.';}finally{button.disabled=false;}
 });
 $('#owner-notice-form').addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget,button=form.querySelector('[type=submit]');if(button.disabled||!form.reportValidity())return;button.disabled=true;
  try{
   await publishLandownerNotice(ownedPlace,$('#owner-notice-title').value,$('#owner-notice-text').value);
   form.reset();renderPublished();$('#owner-notice-status').textContent='Varselet er publisert og vises i fiskernes varslingsbjelle.';
  }catch(error){$('#owner-notice-status').textContent=error.message||'Kunne ikke publisere. Prøv igjen.';}finally{button.disabled=false;}
 });
 $('#owner-logout').addEventListener('click',async()=>{
  try{await logoutUser();location.assign(new URL('grunneier-logginn.html',location.href).href);}catch{$('#dashboard-status').textContent='Kunne ikke logge ut. Prøv igjen.';}
 });
 loadSettings();renderPublished();showView();
 await initializeLandownerCalendar(user,()=>{renderPublished();});
}
initialize().catch(()=>{$('#access-message').textContent='Kunne ikke hente dashboardet. Last siden på nytt.';$('#dashboard-status').textContent='Kunne ikke hente dashboardet. Last siden på nytt.';});
