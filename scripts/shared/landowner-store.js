import {getCurrentUser} from './auth.js';
const SETTINGS='easyfisk.zones.settings';
export const NOTICES_KEY='easyfisk.zones.notices';
function read(key,fallback){
 try{const value=JSON.parse(localStorage.getItem(key)||'null');return value&&typeof value==='object'&&Array.isArray(value)===Array.isArray(fallback)?value:fallback;}catch{return fallback;}
}
export function zoneSettings(place){return read(SETTINGS,{})[place]||{};}
export function landownerNotices(){return read(NOTICES_KEY,[]).filter(item=>item&&typeof item.id==='string'&&typeof item.text==='string');}
export function canManagePlace(user,place){return user?.role==='landowner'&&user.managedPlaces?.includes(place);}
async function requireOwner(place){const user=await getCurrentUser();if(!canManagePlace(user,place))throw new Error('Du har ikke tilgang til å endre denne fiskeplassen.');return user;}
export async function saveZoneSettings(place,details){
 await requireOwner(place);
 const {description,cardTitle,cardInfo,rules}=details;
 if([description,cardInfo,rules].some(value=>typeof value!=='string'||value.length>2000)||typeof cardTitle!=='string'||!cardTitle.trim()||cardTitle.length>120)throw new Error('Fyll ut kortnavn og kontroller tekstfeltene.');
 const price=details.price===''?null:Number(details.price),capacity=Number(details.capacity);
 if((price!==null&&(!Number.isFinite(price)||price<0))||!Number.isInteger(capacity)||capacity<1||capacity>100)throw new Error('Kontroller pris og antall kort (1–100).');
 const settings=read(SETTINGS,{});
 settings[place]={description:description.trim(),cardTitle:cardTitle.trim(),cardInfo:cardInfo.trim(),rules:rules.trim(),price,capacity,closed:Boolean(details.closed),updatedAt:new Date().toISOString()};
 localStorage.setItem(SETTINGS,JSON.stringify(settings));
}
export async function publishLandownerNotice(place,title,text){
 const user=await requireOwner(place);title=title.trim();text=text.trim();
 if(!title||title.length>120||!text||text.length>2000)throw new Error('Skriv en overskrift og melding (maks 2000 tegn).');
 const notices=landownerNotices();
 const notice={id:crypto.randomUUID(),place,title,text,sender:`Grunneier · ${place}`,author:user.email,time:new Date().toISOString()};
 localStorage.setItem(NOTICES_KEY,JSON.stringify([notice,...notices]));
 window.dispatchEvent(new Event('easyfisk:notices-changed'));return notice;
}
