import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
import {zoneDefaults,zoneDetails} from '../scripts/shared/zone-details.js';
import {saveZoneSettings,setDaySalesClosed} from '../scripts/shared/landowner-store.js';
import {loginUser} from '../scripts/shared/auth.js';

function reset(){
 const storage=()=>{const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};};
 globalThis.localStorage=storage();globalThis.sessionStorage=storage();globalThis.window=new EventTarget();
}
const details={description:'Ny beskrivelse',cardTitle:'Mitt døgnkort',cardInfo:'Informasjon',rules:'Lokale regler',price:'250',capacity:'4',closed:false};
const image={id:'uploaded',src:'data:image/jpeg;base64,aGVsbG8=',alt:'Elva ved fiskeplassen'};

test('initial card content matches the existing app descriptions and photos for each Holmesland card',()=>{
 reset();const context={};
 vm.runInNewContext(readFileSync(new URL('../scripts/data/inatur-offers.js',import.meta.url),'utf8')+';globalThis.offers=inaturOffers;',context);
 for(const letter of ['A','B','C','P']){
  const place=`Holmesland ${letter}`,defaults=zoneDetails(place),source=context.offers[place][0];
  assert.equal(defaults.description,source.description);assert.equal(defaults.images.length,source.images.length);
  defaults.images.forEach((photo,index)=>{assert.ok(existsSync(new URL(photo.src)));assert.ok(photo.src.endsWith(source.images[index].src.split('/').at(-1)));});
 }
 assert.deepEqual(zoneDefaults('Another place'),{});
});

test('saved text and images override defaults and removing all photos persists',async()=>{
 reset();await loginUser('landowner','a');await setDaySalesClosed('Holmesland A','2026-07-01',true);
 await saveZoneSettings('Holmesland A',{...details,images:[image]});
 assert.equal(zoneDetails('Holmesland A').description,details.description);
 assert.deepEqual(zoneDetails('Holmesland A').images,[image]);
 assert.deepEqual(zoneDetails('Holmesland A').closedDates,['2026-07-01']);
 assert.equal(zoneDetails('Holmesland B').images.length,3);
 await saveZoneSettings('Holmesland A',{...details,description:'',images:[]});
 assert.equal(zoneDetails('Holmesland A').description,'');assert.deepEqual(zoneDetails('Holmesland A').images,[]);
 await saveZoneSettings('Holmesland A',details);assert.deepEqual(zoneDetails('Holmesland A').images,[]);
});

test('photo changes respect card access and reject invalid or oversized image sets',async()=>{
 reset();await loginUser('landowner','a');
 await assert.rejects(saveZoneSettings('Holmesland B',{...details,images:[image]}),/ikke tilgang/);
 for(const images of [[{...image,src:'javascript:alert(1)'}],[{...image,src:'data:text/html;base64,ABC'}],[{...image,src:'data:image/jpeg;base64,'+'a'.repeat(500001)}],Array(9).fill(image)]){
  await assert.rejects(saveZoneSettings('Holmesland A',{...details,images}),/gyldige bilder/);
 }
 assert.equal(zoneDetails('Holmesland A').images.length,3);
});
