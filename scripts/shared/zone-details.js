import {zoneSettings} from './landowner-store.js';

const sharedImages=[
 new URL('../../assets/inatur/5a4ca9abe4b0209d64304e1f-1.jpg',import.meta.url).href,
 new URL('../../assets/inatur/5a4ca9abe4b0209d64304e1f-2.jpg',import.meta.url).href,
 new URL('../../assets/inatur/5a4ca9abe4b0209d64304e1f-3.jpg',import.meta.url).href,
];
const facilities={A:'Mulighet for teltoppstilling ved sonen, gapahuk og toalett med enkel standard.',B:'Båt er inkludert i fiskekortet.',C:'Gapahuk og toalett med enkel standard.',P:'Gapahuk og toalett med enkel standard.'};
export function zoneDefaults(place){
 const letter=place.replace('Holmesland ','');
 if(!place.startsWith('Holmesland ')||!Object.hasOwn(facilities,letter))return {};
 return {
  cardTitle:`Døgnkort – ${place}`,
  description:`${place} er en av fire delsoner på vestsiden av Mandalselva i Øvre Holum. ${facilities[letter]} Dagskort gjelder kl. 18.00–17.59 neste dag. Gruppekort tilbys når alle kortene i sonen er ledige. Kartmarkøren viser en veiledende plassering; se Inatur og lokal oppmerking for fiskeområdet. Bildene er fra Holmeslands felles salgsside.`,
  cardInfo:'Dagskort gjelder kl. 18.00–17.59 neste dag. Gruppekort tilbys når alle kortene i sonen er ledige.',
  rules:'',price:null,capacity:4,closed:false,
  images:sharedImages.map((src,index)=>({id:`inatur:${index}`,src,alt:`Bilde ${index+1} fra Holmeslands felles salgsside på Inatur`})),
 };
}
export function zoneDetails(place){return {...zoneDefaults(place),...zoneSettings(place)};}
