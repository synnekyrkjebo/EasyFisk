import {getProfiles,getProfile,saveProfile,exampleProfile} from './social-store.js';
import {searchFriends} from './recipients.js';
import {el,profileAvatar} from './community-ui.js';

export async function profileConnections(user, onChange) {
  const saved=await getProfiles();
  const people=new Map(searchFriends('').map(friend=>{const p=exampleProfile(friend);return [p.id,p];}));
  for(const person of saved)people.set(person.id,person);
  let viewer=user?await getProfile(user):null;
  if(viewer)people.set(viewer.id,viewer);
  let current, updating=false;
  const dialog=el('dialog','','message-dialog connections-dialog');
  dialog.setAttribute('aria-labelledby','connections-title');
  document.body.append(dialog);
  function members(kind){
    return [...people.values()].filter(person=>person.id!==current.id && (kind==='following'?current.following.includes(person.id):person.following.includes(current.id)));
  }
  function followButton(person){
    if(!viewer||person.id===viewer.id)return null;
    const follows=viewer.following.includes(person.id);
    const button=el('button',follows?'Slutt å følge':'Følg','account-button connection-follow');button.type='button';button.disabled=updating;
    button.setAttribute('aria-label',`${follows?'Slutt å følge':'Følg'} ${person.name}`);
    button.setAttribute('aria-pressed',String(follows));
    button.addEventListener('click',async()=>{
      if(updating)return;updating=true;button.disabled=true;
      try{
        const latest=await getProfile(user);
        const following=follows?latest.following.filter(id=>id!==person.id):[...new Set([...latest.following,person.id])];
        const updated={...latest,following};await saveProfile(user,updated);viewer=updated;people.set(viewer.id,viewer);
        if(current.id===viewer.id)current=viewer;
        onChange(following);render(current);
        if(dialog.open)showList(dialog.dataset.kind);
      }catch{const status=dialog.open?dialog.querySelector('[role=status]'):document.querySelector('#profile-status');status.textContent='Kunne ikke lagre. Prøv igjen.';}
      finally{updating=false;for(const control of document.querySelectorAll('.connection-follow'))control.disabled=false;}
    });return button;
  }
  function showList(kind){
    dialog.dataset.kind=kind;dialog.replaceChildren();
    const heading=el('h2',kind==='following'?'Følger':'Følgere');heading.id='connections-title';dialog.append(heading);
    const tabs=el('div','','connection-counts');
    for(const [value,label]of [['followers','Følgere'],['following','Følger']]){
      const tab=el('button',`${label} (${members(value).length})`,'account-button');tab.type='button';tab.setAttribute('aria-pressed',String(kind===value));tab.addEventListener('click',()=>showList(value));tabs.append(tab);
    }
    dialog.append(tabs);
    const entries=members(kind);
    if(!entries.length)dialog.append(el('p','Ingen personer ennå.','account-status'));
    for(const person of entries){
      const row=el('div','','connection-row');const link=el('a','','connection-person');
      const url=new URL('minside.html',location.href);if(person.id!==viewer?.id)url.searchParams.set('bruker',person.id);link.href=url.href;
      link.append(profileAvatar(person),el('span',person.name));row.append(link);
      if(kind==='followers'&&current.id===viewer?.id){
        const remove=el('button','Fjern følger','account-button connection-follow');remove.type='button';remove.disabled=updating;remove.setAttribute('aria-label',`Fjern ${person.name} som følger`);
        remove.addEventListener('click',async()=>{
          if(updating)return;updating=true;remove.disabled=true;
          try{
            const latest=(await getProfiles()).find(p=>p.id===person.id)||person;
            const updated={...latest,following:latest.following.filter(id=>id!==viewer.id)};
            await saveProfile({email:person.id},updated);people.set(person.id,updated);
            render(current);showList(kind);
          }catch{dialog.querySelector('[role=status]').textContent='Kunne ikke fjerne følgeren. Prøv igjen.';}
          finally{updating=false;for(const control of document.querySelectorAll('.connection-follow'))control.disabled=false;}
        });row.append(remove);
      }else{const button=followButton(person);if(button)row.append(button);}
      dialog.append(row);
    }
    const status=el('p','','account-status');status.setAttribute('role','status');dialog.append(status);
    const close=el('button','Lukk','account-button');close.type='button';close.addEventListener('click',()=>dialog.close());dialog.append(close);
    if(!dialog.open)dialog.showModal();
  }
  function render(profile){
    current=profile;people.set(profile.id,profile);
    const container=document.querySelector('#profile-follows');container.replaceChildren();
    for(const [kind,label]of [['followers','følgere'],['following','følger']]){
      const button=el('button','','connection-count');button.type='button';button.setAttribute('aria-haspopup','dialog');
      button.append(el('strong',String(members(kind).length)),el('span',label));
      button.addEventListener('click',()=>showList(kind));container.append(button);
    }
    const action=document.querySelector('#profile-follow-action');action.replaceChildren();
    const button=followButton(profile);if(button)action.append(button);
  }
  document.querySelector('#manage-profile-connections').addEventListener('click',()=>showList('following'));
  return {render};
}
