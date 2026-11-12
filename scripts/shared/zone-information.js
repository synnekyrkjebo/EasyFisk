import {zoneSettings} from './landowner-store.js';
export function renderZoneInformation(container,place,{days=1,people=1}={}){
 const settings=zoneSettings(place.name);
 container.replaceChildren();
 if(!Object.keys(settings).length){container.hidden=true;return;}
 container.hidden=false;
 const add=(tag,text)=>{if(!text)return;const node=document.createElement(tag);node.textContent=text;container.append(node);};
 add('h3',settings.cardTitle);add('p',settings.description);add('p',settings.cardInfo);add('p',settings.rules);
 if(settings.price!==null&&settings.price!==undefined){
  const currency=value=>new Intl.NumberFormat('nb-NO',{style:'currency',currency:'NOK'}).format(value);
  add('p',`${currency(settings.price)} per person per fiskedøgn`);
  if(days*people>1)add('p',`Totalt: ${currency(settings.price*days*people)} for ${people} ${people===1?'fisker':'fiskere'} og ${days} fiskedøgn`);
 }
 if(settings.closed)add('p','Fiskeplassen er stengt for nye kortkjøp.');
}
