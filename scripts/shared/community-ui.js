import {ZONE_FEED_ENABLED} from "./features.js";
import { calculateStatistics, achievements, challenges } from "./statistics.js";
import { monthLabel, prettyTime } from "./community.js";
export const el = (tag, text = "", className = "") => { const node = document.createElement(tag); node.textContent = text; if(className)node.className=className; return node; };
export const number = (value, decimals = 1) => new Intl.NumberFormat("nb-NO", {maximumFractionDigits:decimals}).format(value);
export const imageUrls = [];
export function photo(blob, alt, className = "community-photo") { const img=el("img","",className);img.src=URL.createObjectURL(blob);img.alt=alt;imageUrls.push(img.src);return img; }
export function revokePhotos() { imageUrls.splice(0).forEach(url=>URL.revokeObjectURL(url)); }
window.addEventListener("pagehide", revokePhotos);
export function metrics(container, items) {
  container.replaceChildren();
  for(const [label,value] of items){const card=el("div","","metric");card.append(el("strong",String(value)),el("span",label));container.append(card);}
}
export function renderStatistics(container, sessions, now=new Date()) {
  container.replaceChildren();const stats=calculateStatistics(sessions,now);
  const grid=el("div","","metrics");metrics(grid,[["Fiskeøkter",stats.sessions],["Fisketimer",number(stats.hours)],["Fangster",stats.catches],["Fangst per time",number(stats.rate,2)],["Nullfangstøkter",stats.zero],["Fiskedager",stats.days]]);container.append(grid);
  container.append(el("p",`Mest besøkte sone: ${stats.mostVisited}`,"account-status"),el("p","Avsluttede økter uten fangst teller med. Fisketid inkluderer pågående økter.","account-status"));
  const records=el("section","","community-section");records.append(el("h2","Største fisk per art"));
  if(!Object.keys(stats.records).length)records.append(el("p","Registrer en fangst for å se dine personlige rekorder.","account-status"));
  for(const [species,record] of Object.entries(stats.records)){const row=el("div","","record-row");row.append(el("strong",species),el("span",`${number(record.length)} cm · ${number(record.weight)} kg`));records.append(row);}container.append(records);
  const distribution=el("section","","community-section");distribution.append(el("h2","Fangster fordelt på art"));bars(distribution,Object.entries(stats.species).map(([name,count])=>[name,count]));container.append(distribution);
  const monthly=el("section","","community-section");monthly.append(el("h2","Aktivitet per måned"));
  const [year,month]=stats.currentMonth.split('-').map(Number);
  const rows=Array.from({length:12},(_,i)=>new Date(Date.UTC(year,month-12+i,15)).toISOString().slice(0,7)).map(key=>[monthLabel(key),stats.months[key]?.sessions||0,`${stats.months[key]?.sessions||0} økter · ${stats.months[key]?.catches||0} fangster`]);bars(monthly,rows);container.append(monthly);
  const progress=el("section","","community-section");progress.append(el("h2","Din fremgang"),el("p",`${monthLabel(stats.currentMonth)} mot ${monthLabel(stats.previousMonth)}`,"account-status"));
  const diff=stats.current.sessions-stats.previous.sessions, catchDiff=stats.current.catches-stats.previous.catches;
  progress.append(el("p",`${diff>=0?'+':''}${diff} økter · ${catchDiff>=0?'+':''}${catchDiff} fangster · ${number(stats.current.hours-stats.previous.hours)} timer`));
  const currentYear=stats.currentMonth.slice(0,4),previousYear=String(Number(currentYear)-1);
  const current=calculateStatistics(sessions.filter(s=>s.start && new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Oslo',year:'numeric'}).format(new Date(s.start))===currentYear),now);
  const previous=calculateStatistics(sessions.filter(s=>s.start && new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Oslo',year:'numeric'}).format(new Date(s.start))===previousYear),now);
  progress.append(el("p",`${currentYear}: ${current.sessions} økter, ${current.catches} fangster og ${number(current.hours)} timer. ${previousYear}: ${previous.sessions} økter, ${previous.catches} fangster og ${number(previous.hours)} timer.`,"account-status"));container.append(progress);
}
function bars(container,rows){
 if(!rows.length){container.append(el("p","Ingen fangster registrert ennå.","account-status"));return;}
 const maximum=Math.max(1,...rows.map(row=>row[1]));
 for(const [name,value,label] of rows){const row=el("div","","chart-row");const title=el("div");title.append(el("span",name),el("strong",label||String(value)));const progress=el("progress");progress.max=maximum;progress.value=value;progress.setAttribute('aria-label',`${name}: ${label||value}`);row.append(title,progress);container.append(row);}
}
export function renderAchievements(container,sessions,activity){
 container.replaceChildren();for(const badge of achievements(sessions,activity)){
  const item=el("article","",`badge-card${badge.unlocked?' is-earned':''}`);const icon=el("span",badge.icon,"badge-icon");icon.setAttribute('aria-hidden','true');
  item.append(icon,el("h3",badge.name),el("p",badge.requirement),el("strong",badge.unlocked?"Oppnådd":`${Math.min(badge.value,badge.goal)} / ${badge.goal}`));container.append(item);
 }
 for(const challenge of challenges(sessions,activity).filter(item=>item.completed)){
  const item=el("article","","badge-card is-earned");item.append(el("span","🌿","badge-icon"),el("h3",challenge.name),el("p","Frivillig utfordring fullført"),el("strong","Oppnådd"));container.append(item);
 }
}
export function renderChallenges(container,sessions,activity){
 container.replaceChildren();for(const challenge of challenges(sessions,activity)){
  const card=el("article","",`challenge-card${challenge.completed?' is-complete':''}`);card.append(el("h3",challenge.name),el("p",challenge.requirement));
  const bar=el("progress");bar.max=challenge.goal;bar.value=Math.min(challenge.value,challenge.goal);bar.setAttribute('aria-label',`${challenge.name}: ${challenge.value} av ${challenge.goal}`);card.append(bar);
  card.append(el("strong",challenge.completed?"✓ Utfordring fullført":`${Math.min(challenge.value,challenge.goal)} / ${challenge.goal}`));
  if(!challenge.completed){const link=el("a","Bli med","account-button");link.href=challenge.href;card.append(link);}container.append(card);
 }
}
export function renderGallery(container,sessions){
 container.replaceChildren();const catches=sessions.flatMap(s=>s.catches).filter(f=>f.photo&&(f.share?.friends||(ZONE_FEED_ENABLED&&f.share?.zone)));
 if(!catches.length)container.append(el("p","Bilder av fangster du deler, vises her.","account-status"));
 for(const fish of catches){const figure=el("figure");figure.append(photo(fish.photo,`${fish.species}, ${fish.length} cm`),el("figcaption",`${fish.species} · ${fish.length} cm · ${prettyTime(fish.time)}`));container.append(figure);}
}
