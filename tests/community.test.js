import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateStatistics,achievements,challenges,personalRecordIds} from '../scripts/shared/statistics.js';
import {activityPosts,visiblePosts,zoneOverview} from '../scripts/shared/community.js';
import {saveSession,listSessions,listSharedSessions,listPublicProfileSessions} from '../scripts/shared/fishing-sessions.js';
import {getProfile,saveProfile,recordActivity,listActivity,getReactions,toggleReaction,addComment,publicProfileActivity} from '../scripts/shared/social-store.js';

const now=new Date('2026-10-07T12:00:00Z');
const place={name:'Bringsdal',zone:'Sone 2'};
const fish=(id,time,length=50,extra={})=>({id,time,species:'Laks',weight:2,length,outcome:'released',...extra});
const session=(id,start,end,catches=[],extra={})=>({id,start,end,catches,place,...extra});

test('completed zero-catch sessions count; active empty sessions are not zero-catch yet',()=>{
 const entries=[session('1','2026-10-01T08:00:00Z','2026-10-01T10:00:00Z'),session('2','2026-10-02T08:00:00Z','2026-10-02T09:00:00Z',[fish('a','2026-10-02T08:30:00Z')]),session('3','2026-10-07T11:00:00Z',null)];
 const stats=calculateStatistics(entries,now);assert.equal(stats.sessions,3);assert.equal(stats.hours,4);assert.equal(stats.zero,1);assert.equal(stats.catches,1);assert.equal(stats.rate,.25);
 assert.equal(calculateStatistics([],now).rate,0);
});
test('records require improvement; species, visited zones and consecutive days are distinct',()=>{
 const entries=[session('1','2026-10-01T04:00:00Z','2026-10-01T05:00:00Z',[fish('a','2026-10-01T04:30:00Z',50)]),session('2','2026-10-02T08:00:00Z','2026-10-02T09:00:00Z',[fish('b','2026-10-02T08:30:00Z',60)]),session('3','2026-10-03T08:00:00Z','2026-10-03T09:00:00Z',[fish('c','2026-10-03T08:30:00Z',60)])];
 const stats=calculateStatistics(entries,now);assert.equal(stats.recordBeats,1);assert.equal(stats.longestStreak,3);assert.equal(stats.records.Laks.length,60);assert.equal(stats.species.Laks,3);assert.equal(stats.mostVisited,'Bringsdal');assert.deepEqual([...personalRecordIds(entries)],['b']);
 const badges=achievements(entries,[],now);assert.ok(badges.find(b=>b.name==='Morgenfisker').unlocked);assert.ok(badges.find(b=>b.name==='Fiskestreak').unlocked);assert.equal(badges.find(b=>b.name==='Elveutforsker').value,1);
});
test('monthly comparison includes zero-catch trips and separates months in Oslo time',()=>{
 const entries=[session('sept','2026-09-01T08:00:00Z','2026-09-01T10:00:00Z'),session('oct','2026-09-30T22:30:00Z','2026-10-01T00:30:00Z')];
 const stats=calculateStatistics(entries,now);assert.equal(stats.current.sessions,1);assert.equal(stats.previous.sessions,1);assert.equal(stats.current.hours,2);assert.equal(challenges(entries,[],now).find(c=>c.name==='Hver tur teller').completed,true);
});
test('complete reports require GPS and photo; fast-report badge does not award historical/backdated reports',()=>{
 const complete=fish('a','2026-10-01T08:00:00Z',50,{gps:{lat:58,lng:7},photo:new Blob(['image'],{type:'image/png'}),createdAt:'2026-10-01T08:09:00Z'});
 const entries=[session('1','2026-10-01T07:00:00Z','2026-10-01T09:00:00Z',[complete,fish('b','2026-10-01T08:10:00Z',60,{createdAt:'2026-10-02T08:00:00Z'})])];
 const badges=achievements(entries,[],now);assert.equal(badges.find(b=>b.name==='Nøyaktig rapportør').value,1);assert.equal(badges.find(b=>b.name==='Rask rapportering').value,1);
});
test('feeds respect separate friends/zone choices and do not publish private fish via a shared session',()=>{
 const entries=[session('1','2026-10-01T08:00:00Z','2026-10-01T09:00:00Z',[fish('private','2026-10-01T08:15:00Z'),fish('friends','2026-10-01T08:30:00Z',50,{share:{friends:true,zone:false}})],{email:'kari@example.com',authorName:'Kari',share:{friends:true,zone:false}})];
 const posts=activityPosts(entries);assert.equal(posts.length,2);assert.ok(!posts.some(p=>p.id==='fish:private'));
 const profile={id:'ola@example.com',following:['kari@example.com'],zones:['Bringsdal']};assert.equal(visiblePosts(posts,profile,'friends').length,2);assert.equal(visiblePosts(posts,profile,'zones').length,0);assert.equal(visiblePosts(posts,{...profile,following:[]},'friends').length,0);
});
test('zone overview counts only public posts within seven days and excludes future entries',()=>{
 const post={kind:'catch',place,share:{zone:true},author:{email:'kari@example.com'}};
 const entries=[{...post,time:'2026-10-06T12:00:00Z'},{...post,time:'2026-09-29T12:00:00Z'},{...post,time:'2026-10-08T12:00:00Z'},{...post,time:'2026-10-06T12:00:00Z',share:{zone:false}}];
 assert.equal(zoneOverview(entries,'Bringsdal',now).catches,1);
});

// A small IndexedDB adapter exercises persistence without needing a browser.
const databases=new Map();
globalThis.indexedDB={open(name){const request={};setTimeout(()=>{
 let stores=databases.get(name),fresh=!stores;if(fresh){stores=new Map();databases.set(name,stores)}
 request.result={close(){},createObjectStore(name,options){stores.set(name,{data:new Map(),keyPath:options?.keyPath})},transaction(name){const tx={};tx.objectStore=()=>{
  const storage=stores.get(name);const result=value=>{const req={result:structuredClone(value)};setTimeout(()=>tx.oncomplete?.(),0);return req};
  return {get:key=>result(storage.data.get(key)),getAll:()=>result([...storage.data.values()]),put:(value,key)=>{const id=storage.keyPath?value[storage.keyPath]:key;storage.data.set(id,structuredClone(value));return result(id)}};
 };return tx}};
 if(fresh)request.onupgradeneeded?.();request.onsuccess();
 },0);return request}};
const user={email:'ola@example.com',name:'Ola'};
test('public session projection strips GPS/private catches and tracks a record against a private earlier fish',async()=>{
 databases.clear();const entries=session('stored','2020-07-01T08:00:00Z','2020-07-01T10:00:00Z',[fish('first','2020-07-01T08:30:00Z',50,{gps:{lat:58,lng:7}}),fish('second','2020-07-01T09:00:00Z',65,{share:{zone:true},gps:{lat:58,lng:7},photo:new Blob(['image'],{type:'image/png'})})]);
 await saveSession(user,entries);const shared=await listSharedSessions();assert.equal(shared[0].catches.length,1);assert.equal(shared[0].catches[0].gps,undefined);assert.equal(shared[0].catches[0].personalRecord,true);assert.ok(shared[0].catches[0].photo instanceof Blob);
 assert.equal((await listSessions({email:'other@example.com'})).length,0);assert.equal((await listPublicProfileSessions({id:user.email,visibility:'private'})).length,0);
 await saveSession(user,{...entries,catches:entries.catches.map(f=>({...f,share:{}}))});assert.equal((await listSharedSessions()).length,0);
});
test('profile changes, follows and avatar persist per user; private-profile activity is withheld',async()=>{
 databases.clear();const profile=await getProfile(user);assert.equal(profile.visibility,'private');profile.zones=['Bringsdal'];profile.bio='Ved elva';profile.avatar=new Blob(['avatar'],{type:'image/png'});await saveProfile(user,profile);
 assert.equal((await getProfile(user)).bio,'Ved elva');assert.equal((await getProfile({email:'other@example.com',name:'Other'})).zones.length,0);
 await recordActivity(user,'rules',{version:'2026-08-01'});await recordActivity(user,'rules',{version:'2026-08-01'});assert.equal((await listActivity(user)).length,1);assert.equal((await publicProfileActivity(profile)).length,0);
 const badges=achievements([],await listActivity(user),now);assert.ok(badges.find(b=>b.name==='Ansvarlig fisker').unlocked);
});
test('likes toggle without duplicates and comments persist with bounded text',async()=>{
 databases.clear();await toggleReaction('post',user);assert.equal((await getReactions('post')).likes.length,1);await toggleReaction('post',user);assert.equal((await getReactions('post')).likes.length,0);
 await addComment('post',user,' Fin fisk! ');assert.equal((await getReactions('post')).comments[0].text,'Fin fisk!');await assert.rejects(addComment('post',user,' '));await assert.rejects(addComment('post',user,'a'.repeat(501)));
});
