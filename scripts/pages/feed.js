import {ZONE_FEED_ENABLED} from "../shared/features.js";
import {getCurrentUser} from '../shared/auth.js';
import {getProfile,getProfiles,saveProfile,getReactions,toggleReaction,addComment} from '../shared/social-store.js';
import {listSharedSessions} from '../shared/fishing-sessions.js';
import {activityPosts,visiblePosts,zoneOverview,initialPosts,prettyTime} from '../shared/community.js';
import {searchFriends} from '../shared/recipients.js';
import {el,photo,revokePhotos,number} from '../shared/community-ui.js';
const $=s=>document.querySelector(s);
let user,profile,posts=[],profiles=[],type='friends',followBusy=false,renderVersion=0;
for(const [id,page] of [['#feed-login','logginn.html'],['#feed-signup','registrer.html']]){const url=new URL(page,location.href);url.searchParams.set('tilbake',location.pathname);$(id).href=url.href;}
async function render(){
 const version=++renderVersion;revokePhotos();$('#feed-posts').replaceChildren();$('#zone-overview').replaceChildren();
 const entries=visiblePosts(posts,profile,type);
 if(type==='zones'){
  for(const name of profile.zones){const place=fishingPlaces.find(p=>p.name===name);if(!place)continue;const overview=zoneOverview(posts,name);
   const card=el('details','','zone-overview-card');card.append(el('summary',`${place.zone} – ${name}`));
   card.append(el('p',`Det er registrert ${overview.catches} fangster i denne sonens feed de siste 7 dagene.`),el('p',`${overview.sessions} delte fiskeøkter · ${overview.posts} innlegg denne uken`,'account-status'));
   const actions=el('div','','session-actions');const buy=el('a','Fiskekort og ledighet','account-button');const url=new URL('kjop.html',location.href);url.searchParams.set('sted',name);buy.href=url.href;
   const rules=el('a','Regler og stenginger','account-button');rules.href='https://lakseelver.no/nb/elver/mandalselva/about';rules.target='_blank';rules.rel='noopener';
   const conditions=el('a','Vannstand og forhold','account-button');conditions.href='https://www.villakssenteret.no/';conditions.target='_blank';conditions.rel='noopener';actions.append(buy,rules,conditions);card.append(actions);$('#zone-overview').append(card);
  }
 }
 if(!entries.length){$('#feed-posts').append(el('p',type==='zones'?'Følg en sone for å se offentlige innlegg og aktivitet.':'Ingen delte innlegg fra personene du følger ennå.','feed-empty'));return;}
 for(const post of entries){
  const card=el('article','','feed-post');const header=el('div','','post-header');
  const authorProfile=profiles.find(p=>p.id===post.author.email);const name=authorProfile?.name||post.author.name;
  const author=el('a',name,'post-author');const authorUrl=new URL('minside.html',location.href);authorUrl.searchParams.set('bruker',post.author.email);author.href=authorUrl.href;
  const avatar=authorProfile?.avatar?photo(authorProfile.avatar,`Profilbilde av ${name}`,'avatar avatar-small'):el('span',name.slice(0,1),'avatar avatar-small');
  header.append(avatar,author,el('span',post.kind==='session'?'Fiskeøkt':'Fangst','post-kind'));card.append(header);
  if(post.photo)card.append(photo(post.photo,`${post.species}, ${post.length} cm`));
  if(post.kind==='catch'){
   card.append(el('h2',`${post.species} · ${number(post.length)} cm${post.weight?` · ${number(post.weight)} kg`:''}`));
   if(post.personalRecord)card.append(el('span','🏆 Personlig rekord','record-label'));
  }else card.append(el('h2',`Fiskeøkt · ${number((new Date(post.end)-new Date(post.start))/3600000)} timer`));
  card.append(el('p',`${prettyTime(post.time)} · ${post.place.zone} – ${post.place.name}`,'account-status'));
  if(post.caption)card.append(el('p',post.caption,'post-caption'));
  const interactions=el('div','','post-interactions');card.append(interactions);$('#feed-posts').append(card);
  const reactions=await getReactions(post.id);if(version!==renderVersion)return;
  renderInteractions(interactions,post,reactions);
 }
}
function renderInteractions(container,post,data){
 container.replaceChildren();let busy=false;
 const like=el('button',`♥ ${data.likes.length}`,'reaction-button');like.type='button';like.setAttribute('aria-label','Lik innlegget');like.setAttribute('aria-pressed',String(data.likes.includes(user.email.toLowerCase())));
 like.addEventListener('click',async()=>{if(busy)return;busy=true;like.disabled=true;try{renderInteractions(container,post,await toggleReaction(post.id,user))}catch{$('#feed-status').textContent='Kunne ikke lagre reaksjonen.'}finally{busy=false;like.disabled=false}});
 const comments=el('details','','post-comments');comments.append(el('summary',`Kommentarer (${data.comments.length})`));
 for(const comment of data.comments){const row=el('div','','comment');row.append(el('strong',comment.name),el('p',comment.text));comments.append(row);}
 const form=el('form','','comment-form'),input=el('input','','checkout-input');input.placeholder='Skriv en kommentar';input.maxLength=500;input.required=true;input.setAttribute('aria-label','Kommentar til innlegget');
 const send=el('button','Publiser','account-button');send.type='submit';form.append(input,send);comments.append(form);
 form.addEventListener('submit',async event=>{event.preventDefault();if(busy||!form.reportValidity())return;busy=true;send.disabled=true;try{const updated=await addComment(post.id,{...user,name:profile.name},input.value);renderInteractions(container,post,updated);container.querySelector('details').open=true;}catch{$('#feed-status').textContent='Kunne ikke lagre kommentaren.'}finally{busy=false;send.disabled=false}});
 container.append(like,comments);
}
function setTab(next){type=ZONE_FEED_ENABLED?next:'friends';$('#friends-tab').setAttribute('aria-selected',String(type==='friends'));$('#zones-tab').setAttribute('aria-selected',String(type==='zones'));$('#friends-tab').tabIndex=type==='friends'?0:-1;$('#zones-tab').tabIndex=type==='zones'?0:-1;$('#feed-panel').setAttribute('aria-labelledby',type==='friends'?'friends-tab':'zones-tab');render().catch(()=>{$('#feed-status').textContent='Kunne ikke hente feeden.'});}
$('#friends-tab').addEventListener('click',()=>setTab('friends'));$('#zones-tab').addEventListener('click',()=>setTab('zones'));
for(const tab of ['#friends-tab','#zones-tab'])$(tab).addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();setTab(event.key==='Home'?'friends':event.key==='End'?'zones':type==='friends'?'zones':'friends');$(type==='friends'?'#friends-tab':'#zones-tab').focus()}});
function renderFollows(){
 const query=$('#follow-search').value.trim().toLocaleLowerCase('nb-NO');$('#friend-options').replaceChildren();$('#zone-options').replaceChildren();
 function choice(container,label,value,key){const row=el('label','','follow-choice'),input=el('input');input.type='checkbox';input.checked=profile[key].includes(value);input.disabled=followBusy;row.append(input,el('span',label));container.append(row);
  input.addEventListener('change',async()=>{if(followBusy)return;followBusy=true;const old=profile[key].slice();profile[key]=input.checked?[...profile[key],value]:profile[key].filter(p=>p!==value);renderFollows();try{await saveProfile(user,profile);await render();$('#follow-status').textContent='Valgene dine er lagret.'}catch{profile[key]=old;$('#follow-status').textContent='Kunne ikke lagre. Prøv igjen.'}finally{followBusy=false;renderFollows()}});
 }
 const friends=searchFriends(query).filter(friend=>friend.email!==user.email.toLowerCase());for(const friend of friends)choice($('#friend-options'),friend.name,friend.email,'following');
 const places=ZONE_FEED_ENABLED?fishingPlaces.filter(p=>`${p.zone} ${p.name}`.toLocaleLowerCase('nb-NO').includes(query)):[];for(const place of places)choice($('#zone-options'),`${place.zone} – ${place.name}`,place.name,'zones');
 if(!friends.length)$('#friend-options').append(el('p','Ingen venner funnet.','account-status'));if(!places.length)$('#zone-options').append(el('p','Ingen soner funnet.','account-status'));
}
$('#manage-follows').addEventListener('click',()=>{renderFollows();$('#follow-dialog').showModal()});$('#close-follows').addEventListener('click',()=>$('#follow-dialog').close());$('#follow-search').addEventListener('input',renderFollows);
getCurrentUser().then(async account=>{user=account;$('#manage-follows').hidden=!user;$('#feed-guest').hidden=Boolean(user);$('#feed-account').hidden=!user;if(!user)return;[profile,profiles]=await Promise.all([getProfile(user),getProfiles()]);posts=[...initialPosts(),...activityPosts(await listSharedSessions())];
 $("#feed-tabs").hidden=!ZONE_FEED_ENABLED;$("#follow-zone-section").hidden=!ZONE_FEED_ENABLED;
 if(ZONE_FEED_ENABLED && new URLSearchParams(location.search).get("vis")==="soner"){type="zones";$("#friends-tab").setAttribute("aria-selected","false");$("#zones-tab").setAttribute("aria-selected","true");$("#friends-tab").tabIndex=-1;$("#zones-tab").tabIndex=0;$("#feed-panel").setAttribute("aria-labelledby","zones-tab");}
 await render();}).catch(()=>{$('#feed-status').textContent='Kunne ikke hente feeden. Prøv igjen.'});
