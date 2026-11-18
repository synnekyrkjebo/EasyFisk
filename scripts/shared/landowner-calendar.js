import {listLandownerBookings,seedLandownerBookings} from './demo-tickets.js';
import {bookingsForDay,sendBookingMessage} from './landowner-bookings.js';
import {monthDays} from './purchase-calendar.js';
import {localTime} from './fishing-sessions.js';
import {zoneSettings,isSalesClosed,setDaySalesClosed} from './landowner-store.js';

const $=selector=>document.querySelector(selector);
const el=(tag,text,className='')=>{const node=document.createElement(tag);node.textContent=text;node.className=className;return node;};
const dayLabel=key=>new Intl.DateTimeFormat('nb-NO',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${key}T12:00:00Z`));

export async function initializeLandownerCalendar(user,onMessage){
 let tickets=[],selected=localTime().slice(0,10),year=Number(selected.slice(0,4)),month=Number(selected.slice(5,7))-1,audience=[],busy=false,salesBusy=false;
 const ownedPlace=user.managedPlaces[0],dialog=$('#booking-message-dialog');
 function openMessage(entries){
  if(!entries.length)return;audience=entries;
  $('#booking-message-form').reset();$('#booking-message-status').textContent='';
  $('#booking-message-recipients').textContent=`${ownedPlace} · ${dayLabel(selected)} · Til: ${[...new Set(entries.map(ticket=>ticket.recipient.name))].join(', ')}`;
  dialog.showModal();
 }
 function renderDay(){
  const entries=bookingsForDay(tickets,ownedPlace,selected),settings=zoneSettings(ownedPlace);
  $('#booking-day-heading').textContent=dayLabel(selected);
  const closed=isSalesClosed(ownedPlace,selected);
  $('#booking-day-summary').textContent=`${ownedPlace} · ${entries.length} bestilte kort · ${closed?0:Math.max(0,(settings.capacity??4)-entries.length)} ledige${closed?' · Stengt for nye kortkjøp':''}`;
  const toggle=$('#booking-toggle-sales');toggle.textContent=closed?'Åpne kortsalget denne dagen':'Steng kortsalget denne dagen';toggle.disabled=Boolean(settings.closed)||salesBusy;
  toggle.setAttribute('aria-pressed',String(closed));
  $('#booking-sales-help').textContent=settings.closed?'Hele fiskeplassen er stengt for kortkjøp. Åpne den under Soner og fiskekort først.':'Eksisterende bestillinger beholdes når du stenger for nye kjøp.';
  $('#booking-message-all').disabled=!entries.length;
  const list=$('#booking-day-list');list.replaceChildren();
  if(!entries.length){list.append(el('p','Ingen bestillinger på dette fiskedøgnet.','account-status'));return;}
  for(const ticket of entries){
   const card=el('article','','owner-booking-person');
   card.append(el('h3',ticket.recipient.name),el('p',ticket.recipient.email,'account-status'));
   if(ticket.recipient.phone)card.append(el('p',ticket.recipient.phone,'account-status'));
   const type=ticket.booking.type==='group'?'Gruppekort':'Døgnkort';
   card.append(el('p',`${type} · ${ticket.buyerName?`Bestilt av ${ticket.buyerName}`:'Bestilling'}`,'account-status'));
   if(ticket.buyerEmail&&ticket.buyerEmail!==ticket.recipient.email.toLowerCase())card.append(el('p',`Bestillers e-post: ${ticket.buyerEmail}`,'account-status'));
   const actions=el('div','','owner-booking-actions'),message=el('button','Send melding','account-button');message.type='button';message.addEventListener('click',()=>openMessage([ticket]));
   const view=el('a','Se fiskekort ↗','account-button');const url=new URL('fiskekort.html',location.href);url.searchParams.set('kort',ticket.token);view.href=url.href;view.target='_blank';view.rel='noopener';
   actions.append(message,view);card.append(actions);list.append(card);
  }
 }
 function renderCalendar(focusDate){
  const {offset,dates}=monthDays(year,month),container=$('#booking-calendar-days');container.replaceChildren();
  $('#booking-calendar-month').textContent=new Intl.DateTimeFormat('nb-NO',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(year,month,15)));
  for(let i=0;i<offset;i++){const spacer=el('span','');spacer.setAttribute('aria-hidden','true');container.append(spacer);}
  const today=localTime().slice(0,10);
  for(const date of dates){
   const count=bookingsForDay(tickets,ownedPlace,date).length,button=el('button','','owner-calendar-day');button.type='button';button.dataset.date=date;
   const closed=isSalesClosed(ownedPlace,date);
   button.append(el('strong',String(Number(date.slice(8)))),el('span',closed?'Stengt':count?`${count} kort`:'Ledig'));
   if(closed){button.classList.add('is-sales-closed');if(count)button.append(el('span',`${count} kort`));}
   button.setAttribute('aria-label',`${dayLabel(date)}, ${count} bestilte kort${closed?', stengt for kortkjøp':''}`);button.setAttribute('aria-pressed',String(date===selected));
   if(date===today)button.setAttribute('aria-current','date');if(count)button.classList.add('has-bookings');
   button.addEventListener('click',()=>{selected=date;$('#booking-sales-status').textContent='';$('#booking-calendar-status').textContent='';renderCalendar(date);renderDay();});
   container.append(button);
  }
  if(focusDate)container.querySelector(`[data-date="${focusDate}"]`)?.focus();
 }
 async function reload(){
  try{tickets=await listLandownerBookings();$('#booking-calendar-status').textContent='';renderCalendar();renderDay();}
  catch{$('#booking-calendar-status').textContent='Kunne ikke hente bestillingene. Last siden på nytt.';}
 }
 for(const [id,step]of [['#booking-calendar-previous',-1],['#booking-calendar-next',1]])$(id).addEventListener('click',()=>{
  const next=new Date(Date.UTC(year,month+step,1));year=next.getUTCFullYear();month=next.getUTCMonth();selected=monthDays(year,month).dates[0];renderCalendar();renderDay();
 });
 $('#booking-toggle-sales').addEventListener('click',async()=>{
  if(salesBusy)return;const place=ownedPlace,date=selected,closed=!isSalesClosed(place,date);salesBusy=true;$('#booking-toggle-sales').disabled=true;
  try{
   await setDaySalesClosed(place,date,closed);
   $('#booking-sales-status').textContent=`${place} · ${dayLabel(date)}: Kortsalget er ${closed?'stengt':'åpnet'}.`;
  }catch(error){$('#booking-sales-status').textContent=error.message||'Kunne ikke endre kortsalget. Prøv igjen.';}
  finally{salesBusy=false;renderCalendar();renderDay();}
 });
 $('#booking-message-all').addEventListener('click',()=>openMessage(bookingsForDay(tickets,ownedPlace,selected)));
 $('#booking-message-cancel').addEventListener('click',()=>{if(!busy)dialog.close();});
 dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
 $('#booking-message-form').addEventListener('submit',async event=>{
  event.preventDefault();if(busy||!event.currentTarget.reportValidity())return;busy=true;$('#booking-message-send').disabled=true;$('#booking-message-cancel').disabled=true;
  try{
   await sendBookingMessage(ownedPlace,selected,audience.map(ticket=>ticket.token),$('#booking-message-title').value,$('#booking-message-text').value);
   const count=new Set(audience.map(ticket=>ticket.recipient.email.toLowerCase())).size;
   dialog.close();$('#booking-calendar-status').textContent=`Meldingen er sendt til ${count} ${count===1?'fisker':'fiskere'}.`;onMessage();
  }catch(error){$('#booking-message-status').textContent=error.message||'Kunne ikke sende meldingen. Prøv igjen.';}
  finally{busy=false;$('#booking-message-send').disabled=false;$('#booking-message-cancel').disabled=false;}
 });
 window.addEventListener('storage',event=>{if(event.key===null||event.key.startsWith('easyfisk.demo.order.')||event.key.startsWith('easyfisk.demo.ticket.')||event.key==='easyfisk.zones.settings')reload();});
 window.addEventListener('hashchange',()=>{if(location.hash==='#kalender')reload();});
 await seedLandownerBookings();
 await reload();
}
