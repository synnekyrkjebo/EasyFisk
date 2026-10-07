import {ZONE_FEED_ENABLED} from "./features.js";
import {getCurrentUser} from './auth.js';
import {getProfile} from './social-store.js';
import {listSharedSessions} from './fishing-sessions.js';
import {activityPosts,initialPosts,visiblePosts,prettyTime} from './community.js';

const trigger=document.querySelector('button[aria-label="Varsler"]');
if(trigger){
 const dialog=document.createElement('dialog');dialog.className='message-dialog';dialog.setAttribute('aria-labelledby','notifications-heading');
 const heading=document.createElement('h2');heading.id='notifications-heading';heading.textContent='Varsler';
 const status=document.createElement('p');status.className='account-status';status.setAttribute('role','status');
 const list=document.createElement('div');
 const close=document.createElement('button');close.type='button';close.className='account-button dialog-cancel';close.textContent='Lukk';close.addEventListener('click',()=>dialog.close());
 dialog.append(heading,status,list,close);document.body.append(dialog);
 trigger.addEventListener('click',async()=>{
  dialog.showModal();status.textContent='Henter aktivitet …';list.replaceChildren();
  try{
   const user=await getCurrentUser();if(!user){status.textContent='Logg inn for å se aktivitet fra venner du følger.';return;}
   const profile=await getProfile(user),posts=[...initialPosts(),...activityPosts(await listSharedSessions())];
   const entries=[...new Map([...visiblePosts(posts,profile,'friends'),...(ZONE_FEED_ENABLED?visiblePosts(posts,profile,'zones'):[])].map(post=>[post.id,post])).values()]
     .filter(post=>Date.now()-new Date(post.time)>=0&&Date.now()-new Date(post.time)<=7*86400000).sort((a,b)=>new Date(b.time)-new Date(a.time));
   status.textContent=entries.length?'Aktivitet fra de siste sju dagene.':'Ingen nye innlegg fra venner de siste sju dagene.';
   for(const post of entries){
    const item=document.createElement('a');item.className='notification-item';item.href='feed.html';
    item.textContent=`${post.author.name} delte ${post.kind==='catch'?'en fangst':'en fiskeøkt'} i ${post.place.name}. ${prettyTime(post.time)}`;list.append(item);
   }
   if(ZONE_FEED_ENABLED&&profile.zones.length){const zones=document.createElement('a');zones.className='account-button';zones.href='feed.html?vis=soner';zones.textContent='Se soner, forhold og fiskekort';list.append(zones);}
  }catch{status.textContent='Kunne ikke hente varsler. Prøv igjen.';}
 });
}
