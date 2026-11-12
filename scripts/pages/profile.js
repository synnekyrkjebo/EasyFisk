import {profileConnections} from '../shared/profile-connections.js';
import {ZONE_FEED_ENABLED} from "../shared/features.js";
import {exampleProfileHistory} from '../shared/example-profiles.js';
import {getCurrentUser} from '../shared/auth.js';
import {listSessions,listPublicProfileSessions} from '../shared/fishing-sessions.js';
import {getProfile,getProfiles,saveProfile,listActivity,recordActivity,exampleProfile,publicProfileActivity} from '../shared/social-store.js';
import {calculateStatistics} from '../shared/statistics.js';
import {searchFriends} from '../shared/recipients.js';
import {el,photo,profileAvatar,revokePhotos,metrics,number,renderAchievements,renderChallenges,renderGallery} from '../shared/community-ui.js';
const $=s=>document.querySelector(s);let user,profile,sessions=[],activity=[],own=true,busy=false;
for(const [id,page] of [['#profile-login','logginn.html'],['#profile-signup','registrer.html']]){const url=new URL(page,location.href);url.searchParams.set('tilbake',location.pathname+location.search);$(id).href=url.href;}
for(const place of fishingPlaces){const option=el('option',`${place.zone} – ${place.name}`);option.value=place.name;$('#environment-place').append(option);}
function render(){
 revokePhotos();$('#profile-name').textContent=profile.name;$('#profile-bio').textContent=own||profile.visibility==='public'?profile.bio:'';
 $('#profile-avatar').replaceChildren(profileAvatar(profile,'avatar-image'));
 $('#profile-visibility').textContent=profile.visibility==='public'?'Offentlig profil':'Privat profil';
 const visible=own||profile.visibility==='public';$('#profile-details').hidden=!visible;$('#profile-private').hidden=visible;$('#profile-metrics').hidden=!visible;
 for(const node of document.querySelectorAll('.owner-only'))node.hidden=!own;
 connections?.render(profile);
 if(!visible)return;
 const stats=calculateStatistics(sessions);metrics($('#profile-metrics'),[['Økter',stats.sessions],['Timer',number(stats.hours)],['Fangster',stats.catches]]);
 $('#profile-records').replaceChildren();if(!Object.keys(stats.records).length)$('#profile-records').append(el('p','Ingen rekorder ennå.','account-status'));
 for(const [species,record]of Object.entries(stats.records)){const row=el('div','','record-row');row.append(el('strong',species),el('span',`${number(record.length)} cm · ${number(record.weight)} kg`));$('#profile-records').append(row);}
 const displayedActivity=own?[...exampleProfileHistory(profile,true).activity,...activity]:activity;
 renderAchievements($('#profile-badges'),sessions,displayedActivity);
 if(own)renderChallenges($('#profile-challenges'),sessions,displayedActivity);
 const gallerySessions=own?sessions:sessions.map(s=>({...s,catches:s.catches.filter(f=>(ZONE_FEED_ENABLED&&f.share?.zone)||(f.share?.friends&&user&&viewerFollowing.includes(profile.id)))}));
 $('#profile-gallery-heading').textContent=own?'Min fangst':'Delte fangster';
 renderGallery($('#profile-gallery'),gallerySessions,{includePrivate:own});
 connections?.render(profile);
 $('#profile-friends').replaceChildren();for(const friend of searchFriends('').filter(friend=>profile.following.includes(friend.email))){const link=el('a',friend.name,'follow-chip');const url=new URL('minside.html',location.href);url.searchParams.set('bruker',friend.email);link.href=url.href;$('#profile-friends').append(link);}
 $('#profile-zones').replaceChildren();for(const zone of profile.zones)$('#profile-zones').append(el('span',zone,'follow-chip'));
 if(own){$('#profile-email').textContent=user.email;$('#profile-phone').textContent=user.phone||'Ikke registrert';}
}
let viewerFollowing=[],connections;
$('#edit-profile').addEventListener('click',()=>{$('#profile-edit-name').value=profile.name;$('#profile-edit-bio').value=profile.bio;$('#profile-edit-visibility').value=profile.visibility;$('#profile-edit-photo').value='';$('#profile-edit-status').textContent='';$('#profile-dialog').showModal()});
$('#cancel-profile').addEventListener('click',()=>$('#profile-dialog').close());
$('#profile-form').addEventListener('submit',async event=>{
 event.preventDefault();if(busy||!$('#profile-form').reportValidity())return;busy=true;$('#save-profile').disabled=true;
 try{const updated={...profile,name:$('#profile-edit-name').value.trim(),bio:$('#profile-edit-bio').value.trim(),visibility:$('#profile-edit-visibility').value,avatar:$('#profile-edit-photo').files[0]||profile.avatar};await saveProfile(user,updated);profile=updated;render();$('#profile-dialog').close();$('#profile-status').textContent='Profilen er lagret.'}catch(error){$('#profile-edit-status').textContent=error.name==='Error'?error.message:'Kunne ikke lagre profilen.'}finally{busy=false;$('#save-profile').disabled=false}
});
$('#rules-form').addEventListener('submit',async event=>{
 event.preventDefault();if(busy||!$('#rules-form').reportValidity())return;busy=true;
 try{await recordActivity(user,'rules',{version:'2026-08-01'});activity=await listActivity(user);render();$('#rules-result').textContent='Fiskereglene er bekreftet. Merket ditt er oppdatert.'}catch{$('#rules-result').textContent='Kunne ikke lagre bekreftelsen.'}finally{busy=false}
});
$('#environment-form').addEventListener('submit',async event=>{
 event.preventDefault();if(busy||!$('#environment-form').reportValidity())return;busy=true;$('#save-environment').disabled=true;
 try{
  const text=$('#environment-text').value.trim(),location=$('#environment-location').value.trim();
  if(!text||!location){$('#environment-result').textContent='Beskriv problemet og hvor det er.';return;}
  await recordActivity(user,'environment',{category:$('#environment-kind').value,place:$('#environment-place').value,location,text});
  activity=await listActivity(user);render();$('#environment-form').reset();$('#environment-result').textContent='Meldingen er lagret lokalt.';
 }catch{$('#environment-result').textContent='Kunne ikke lagre meldingen. Prøv igjen.'}finally{busy=false;$('#save-environment').disabled=false}
});
getCurrentUser().then(async account=>{
 user=account;const requested=new URLSearchParams(location.search).get('bruker');own=!requested||requested===user?.email?.toLowerCase();
 $('#profile-back').hidden=own;
 $('#profile-heading').hidden=!own;
 $('#profile-guest').hidden=Boolean(user)||!own;$('#profile-account').hidden=!user&&own;if(!user&&own)return;
 if(own){
  [profile,sessions,activity]=await Promise.all([getProfile(user),listSessions(user),listActivity(user)]);
  sessions=[...exampleProfileHistory(profile,true).sessions,...sessions];
 }
 else{
  const profiles=await getProfiles();profile=profiles.find(p=>p.id===requested);const friend=searchFriends('').find(f=>f.email===requested);
  if(!profile&&friend)profile=exampleProfile(friend);
  if(!profile){$('#profile-account').hidden=true;$('#profile-status').textContent='Profilen er ikke tilgjengelig.';return;}
  [sessions,activity]=await Promise.all([listPublicProfileSessions(profile),publicProfileActivity(profile)]);$('#profile-account').hidden=false;
  const examples=exampleProfileHistory(profile);
  sessions=[...examples.sessions,...sessions];activity=[...examples.activity,...activity];
  if(user)viewerFollowing=(await getProfile(user)).following;
 }
 connections=await profileConnections(user,following=>{viewerFollowing=following;if(own)profile={...profile,following};render();});
 render();
}).catch(()=>{$('#profile-status').textContent='Kunne ikke hente profilen. Prøv igjen.'});
