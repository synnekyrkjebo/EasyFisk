import test from 'node:test';
import assert from 'node:assert/strict';
import {loginUser,logoutUser,getCurrentUser,registerUser} from '../scripts/shared/auth.js';
import {saveZoneSettings,zoneSettings,canManagePlace,publishLandownerNotice,landownerNotices} from '../scripts/shared/landowner-store.js';
import {exampleAvailability} from '../scripts/shared/purchase-calendar.js';
import {noticeKey,unreadNotices} from '../scripts/shared/notification-state.js';

const storage=()=>{const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};};
function reset(){globalThis.localStorage=storage();globalThis.sessionStorage=storage();globalThis.window=new EventTarget();}
const details={description:'Adkomst fra parkeringen.',cardTitle:'Døgnkort Holmesland A',cardInfo:'Gjelder én fisker.',rules:'Følg merkede stier.',price:'350',capacity:'6',closed:false};

test('only the assigned landowner can edit a place or publish notices',async()=>{
 reset();await assert.rejects(saveZoneSettings('Holmesland A',details),/ikke tilgang/);
 await loginUser();assert.equal((await getCurrentUser()).role,'fisher');
 await assert.rejects(publishLandownerNotice('Holmesland A','Stengt','Fiskestans.'),/ikke tilgang/);
 await loginUser('landowner');const owner=await getCurrentUser();assert.ok(canManagePlace(owner,'Holmesland A'));
 assert.equal(canManagePlace(owner,'Smeland'),false);
 assert.equal(canManagePlace(owner,'Bringsdal'),false);
 assert.deepEqual(owner.managedPlaces,['Holmesland A','Holmesland B','Holmesland C','Holmesland P']);
 await assert.rejects(saveZoneSettings('Smeland',details),/ikke tilgang/);
 await assert.rejects(publishLandownerNotice('Smeland','Stengt','Fiskestans.'),/ikke tilgang/);
 await saveZoneSettings('Holmesland A',details);assert.equal(zoneSettings('Holmesland A').price,350);
 assert.equal(exampleAvailability('Holmesland A','2026-06-01').total,6);
 await saveZoneSettings('Holmesland A',{...details,closed:true});assert.equal(exampleAvailability('Holmesland A','2026-06-01').remaining,0);
 assert.equal(exampleAvailability('Smeland','2026-06-01').total,4);
 await logoutUser();assert.equal(await getCurrentUser(),null);
});

test('notices persist and trigger unread state without changing previously read notices',async()=>{
 reset();await loginUser('landowner');let events=0;window.addEventListener('easyfisk:notices-changed',()=>events++);
 const first=await publishLandownerNotice('Holmesland A','Fiskestans','Stengt inntil videre.');
 const second=await publishLandownerNotice('Holmesland B','Ny informasjon','Oppdaterte lokale regler.');
 assert.equal(events,2);assert.equal(landownerNotices().length,2);
 assert.equal(first.author,'grunneier@easyfisk.no');
 assert.deepEqual(unreadNotices(landownerNotices(),[noticeKey(first)]).map(item=>item.id),[second.id]);
 await assert.rejects(publishLandownerNotice('Holmesland A','  ','Tom overskrift'),/overskrift/);
 await assert.rejects(saveZoneSettings('Holmesland A',{...details,capacity:'0'}),/antall kort/);
});

test('registration and ordinary login cannot inherit a landowner role',async()=>{
 reset();await loginUser('landowner');
 await registerUser({name:'Test Fisker',email:'test@example.com',phone:'90000000',role:'landowner'});
 const fisher=await getCurrentUser();assert.equal(fisher.role,'fisher');assert.deepEqual(fisher.managedPlaces,[]);
 await loginUser('landowner');await loginUser();assert.equal((await getCurrentUser()).role,'fisher');
 await assert.rejects(loginUser('admin'),/gyldig rolle/);
});
