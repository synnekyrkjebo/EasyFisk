import {getCurrentUser} from './auth.js';
const SETTINGS='easyfisk.zones.settings';
export const NOTICES_KEY='easyfisk.zones.notices';
function read(key,fallback){
 try{const value=JSON.parse(localStorage.getItem(key)||'null');return value&&typeof value==='object'&&Array.isArray(value)===Array.isArray(fallback)?value:fallback;}catch{return fallback;}
}
export function zoneSettings(place){return read(SETTINGS,{})[place]||{};}
export function isSalesClosed(place,date){const settings=zoneSettings(place);return Boolean(settings.closed||settings.closedDates?.includes(date));}
export function landownerNotices(){return read(NOTICES_KEY,[]).filter(item=>item&&typeof item.id==='string'&&typeof item.text==='string');}
export function canManagePlace(user,place){return user?.role==='landowner'&&user.managedPlaces?.includes(place);}
async function requireOwner(place){const user=await getCurrentUser();if(!canManagePlace(user,place))throw new Error('Du har ikke tilgang til å endre denne fiskeplassen.');return user;}
export async function saveZoneSettings(place,details){
 await requireOwner(place);
 const {description,cardTitle,cardInfo,rules}=details;
 if([description,cardInfo,rules].some(value=>typeof value!=='string'||value.length>2000)||typeof cardTitle!=='string'||!cardTitle.trim()||cardTitle.length>120)throw new Error('Fyll ut kortnavn og kontroller tekstfeltene.');
 const price=details.price===''?null:Number(details.price),capacity=Number(details.capacity);
 if((price!==null&&(!Number.isFinite(price)||price<0))||!Number.isInteger(capacity)||capacity<1||capacity>100)throw new Error('Kontroller pris og antall kort (1–100).');
 if(details.images!==undefined){
  if(!Array.isArray(details.images)||details.images.length>8||details.images.some(image=>typeof image.id!=='string'||typeof image.alt!=='string'||image.alt.length>200||typeof image.src!=='string'||image.src.length>500000||!(/^(https?:\/\/|data:image\/(jpeg|png|webp);base64,)/.test(image.src))))throw new Error('Velg maks åtte gyldige bilder.');
 }
 const settings=read(SETTINGS,{});
 settings[place]={...settings[place],description:description.trim(),cardTitle:cardTitle.trim(),cardInfo:cardInfo.trim(),rules:rules.trim(),price,capacity,closed:Boolean(details.closed),updatedAt:new Date().toISOString()};
 if(details.images!==undefined)settings[place].images=details.images.map(({id,src,alt})=>({id,src,alt}));
 try{localStorage.setItem(SETTINGS,JSON.stringify(settings));}
 catch(error){if(error.name==='QuotaExceededError')throw new Error('Det er ikke nok lagringsplass til bildene. Fjern et bilde eller velg mindre bilder og prøv igjen.');throw error;}
}
export async function setDaySalesClosed(place,date,closed){
 await requireOwner(place);
 if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(new Date(`${date}T12:00:00Z`).getTime())||new Date(`${date}T12:00:00Z`).toISOString().slice(0,10)!==date||typeof closed!=='boolean')throw new Error('Velg et gyldig fiskedøgn.');
 const settings=read(SETTINGS,{}),current=settings[place]||{},dates=new Set(current.closedDates||[]);
 if(closed)dates.add(date);else dates.delete(date);
 settings[place]={...current,closedDates:[...dates].sort(),updatedAt:new Date().toISOString()};
 localStorage.setItem(SETTINGS,JSON.stringify(settings));
}
export function visibleLandownerNotices(user){
 const email=user?.email?.toLowerCase();
 return landownerNotices().filter(notice=>!Array.isArray(notice.recipientEmails)||(email&&notice.recipientEmails.includes(email)));
}
export async function publishLandownerNotice(place,title,text,audience=null){
 const user=await requireOwner(place);title=title.trim();text=text.trim();
 if(!title||title.length>120||!text||text.length>2000)throw new Error('Skriv en overskrift og melding (maks 2000 tegn).');
 const notices=landownerNotices();
 const notice={id:crypto.randomUUID(),place,title,text,sender:`Grunneier · ${place}`,author:user.email,time:new Date().toISOString()};
 if(audience){
  if(!Array.isArray(audience.recipientEmails)||!audience.recipientEmails.length||audience.recipientEmails.some(email=>typeof email!=='string'||!email.includes('@')))throw new Error('Velg minst én mottaker.');
  notice.recipientEmails=[...new Set(audience.recipientEmails.map(email=>email.toLowerCase()))];notice.bookingDate=audience.bookingDate;
 }
 localStorage.setItem(NOTICES_KEY,JSON.stringify([notice,...notices]));
 window.dispatchEvent(new Event('easyfisk:notices-changed'));return notice;
}
