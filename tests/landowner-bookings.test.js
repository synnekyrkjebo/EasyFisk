import test from 'node:test';
import assert from 'node:assert/strict';
import {loginUser,getCurrentUser} from '../scripts/shared/auth.js';
import {completeDemoOrder,createDemoTicket,listLandownerBookings,seedLandownerBookings,readDemoTicket} from '../scripts/shared/demo-tickets.js';
import {bookingsForDay,sendBookingMessage} from '../scripts/shared/landowner-bookings.js';
import {visibleLandownerNotices,setDaySalesClosed,isSalesClosed,saveZoneSettings} from '../scripts/shared/landowner-store.js';
import {exampleAvailability} from '../scripts/shared/purchase-calendar.js';

function reset(){
 const values=new Map();
 globalThis.localStorage={get length(){return values.size;},key:index=>[...values.keys()][index],getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 const session=new Map();globalThis.sessionStorage={getItem:key=>session.get(key)??null,setItem:(key,value)=>session.set(key,value),removeItem:key=>session.delete(key)};
 globalThis.window=new EventTarget();
}
const buyer={name:'Ola Nordmann',email:'demo@easyfisk.no'};
const kari={name:'Kari Hansen',email:'kari@example.com',phone:'90000001'};
const per={name:'Per Olsen',email:'per@example.com'};
const booking=(place,dates=['2026-06-15'],people=1)=>({place:{name:place,zone:'Sone 2'},dates,people,type:people>1?'group':'single'});

test('calendar lists only owned places, counts group members per day and includes legacy cards once',async()=>{
 reset();
 completeDemoOrder(booking('Holmesland A',['2026-06-15','2026-06-16'],2),buyer,[kari,per],true);
 completeDemoOrder(booking('Holmesland B'),buyer,[buyer],true);
 completeDemoOrder(booking('Bringsdal'),buyer,[per],true);
 const url=createDemoTicket(booking('Holmesland P'),buyer,kari,'https://easyfisk.test/');
 localStorage.setItem('easyfisk.demo.order.damaged','invalid');
 await loginUser('fisher');await assert.rejects(listLandownerBookings(),/grunneier/);
 await loginUser('landowner');const tickets=await listLandownerBookings();
 assert.equal(tickets.length,2);assert.ok(tickets.every(ticket=>ticket.booking.place.name==='Holmesland A'));
 const day=bookingsForDay(tickets,'Holmesland A','2026-06-15');
 assert.equal(day.length,2);assert.equal(day[0].buyerEmail,buyer.email);assert.equal(day[0].buyerName,buyer.name);
 assert.equal(bookingsForDay(tickets,'Holmesland A','2026-06-16').length,2);
 assert.equal(bookingsForDay(tickets,'Holmesland A','2026-06-17').length,0);
 await loginUser('landowner','p');
 assert.equal((await listLandownerBookings()).filter(ticket=>ticket.token===url.searchParams.get('kort')).length,1);
 await loginUser('landowner','b');assert.equal((await listLandownerBookings()).length,1);
});

test('booking messages are scoped to the selected day and visible only to recipients',async()=>{
 reset();completeDemoOrder(booking('Holmesland A',['2026-06-15'],2),buyer,[kari,per],true);
 await loginUser('landowner');const tickets=await listLandownerBookings();
 const kariCard=tickets.find(ticket=>ticket.recipient.email===kari.email);
 const notice=await sendBookingMessage('Holmesland A','2026-06-15',[kariCard.token],'Ny adkomst','Bruk øvre parkering.');
 assert.deepEqual(notice.recipientEmails,[kari.email]);assert.equal(notice.bookingDate,'2026-06-15');
 assert.equal(visibleLandownerNotices(kari).length,1);assert.equal(visibleLandownerNotices(per).length,0);
 assert.equal(visibleLandownerNotices(buyer).length,0);assert.equal(visibleLandownerNotices(null).length,0);
 assert.equal(visibleLandownerNotices({...kari,email:kari.email.toUpperCase()}).length,1);
 await assert.rejects(sendBookingMessage('Holmesland A','2026-06-16',[kariCard.token],'Feil dato','Melding'),/Velg fiskere/);
 await assert.rejects(sendBookingMessage('Holmesland B','2026-06-15',[kariCard.token],'Feil sted','Melding'),/Velg fiskere/);
 await assert.rejects(sendBookingMessage('Holmesland A','2026-06-15',[],'Ingen','Melding'),/Velg fiskere/);
 await assert.rejects(sendBookingMessage('Holmesland A','2026-06-15',['unknown'],'Ukjent','Melding'),/Velg fiskere/);
 await loginUser('fisher');await assert.rejects(sendBookingMessage('Holmesland A','2026-06-15',[kariCard.token],'Nei','Melding'),/grunneier/);
 assert.equal((await getCurrentUser()).role,'fisher');
});

test('message to everyone deduplicates recipient addresses and excludes unrelated days',async()=>{
 reset();completeDemoOrder(booking('Holmesland C'),buyer,[kari],true);
 completeDemoOrder(booking('Holmesland C'),buyer,[kari],true);
 completeDemoOrder(booking('Holmesland C',['2026-06-16']),buyer,[per],true);
 await loginUser('landowner','c');const day=bookingsForDay(await listLandownerBookings(),'Holmesland C','2026-06-15');
 const notice=await sendBookingMessage('Holmesland C','2026-06-15',day.map(ticket=>ticket.token),'Fiskestans','Fisket er midlertidig stanset.');
 assert.deepEqual(notice.recipientEmails,[kari.email]);assert.equal(visibleLandownerNotices(per).length,0);
});

test('mock bookings populate the current month, open valid cards and support targeted messages without duplicating or overwriting orders',async()=>{
 reset();completeDemoOrder(booking('Holmesland A'),buyer,[per],true);
 await loginUser('fisher');await assert.rejects(seedLandownerBookings(),/grunneier/);
 await loginUser('landowner');
 const now=new Date('2026-11-12T12:00:00Z');await seedLandownerBookings(now);
 const tickets=await listLandownerBookings();assert.equal(tickets.length,9);
 for(const place of ['Holmesland A']){
  assert.equal(bookingsForDay(tickets,place,'2026-11-12').length,2);
  assert.equal(bookingsForDay(tickets,place,'2026-11-14').length,1);
  assert.equal(bookingsForDay(tickets,place,'2026-11-17').length,4);
  assert.equal(bookingsForDay(tickets,place,'2026-11-21').length,1);
  assert.equal(bookingsForDay(tickets,place,'2026-11-22').length,1);
 }
 const mock=tickets.find(ticket=>ticket.mock);assert.ok(readDemoTicket(mock.token));
 const currentDay=bookingsForDay(tickets,'Holmesland A','2026-11-12');
 const sent=await sendBookingMessage('Holmesland A','2026-11-12',currentDay.map(ticket=>ticket.token),'Velkommen','Bruk parkeringen ved innkjørselen.');
 assert.deepEqual(sent.recipientEmails.sort(),[kari.email,per.email].sort());
 await seedLandownerBookings(now);await seedLandownerBookings(new Date('2026-11-13T12:00:00Z'));
 assert.deepEqual((await listLandownerBookings()).map(ticket=>ticket.token).sort(),tickets.map(ticket=>ticket.token).sort());
 assert.equal(bookingsForDay(await listLandownerBookings(),'Holmesland A','2026-06-15').length,1);
});

test('mock dates remain valid at month end and in leap years',async()=>{
 for(const instant of ['2026-11-30T12:00:00Z','2028-02-29T12:00:00Z']){
  reset();await loginUser('landowner');await seedLandownerBookings(new Date(instant));
  for(const ticket of await listLandownerBookings()){
   for(const date of ticket.booking.dates){assert.equal(new Date(`${date}T12:00:00Z`).toISOString().slice(0,10),date);assert.equal(date.slice(0,7),instant.slice(0,7));}
  }
 }
});

test('closing individual days blocks new sales, preserves bookings and survives settings changes',async()=>{
 reset();completeDemoOrder(booking('Holmesland A'),buyer,[kari],true);
 await loginUser('landowner');
 const existing=(await listLandownerBookings())[0];
 await setDaySalesClosed('Holmesland A','2026-06-15',true);
 await setDaySalesClosed('Holmesland A','2026-06-16',true);
 assert.equal(isSalesClosed('Holmesland A','2026-06-15'),true);
 assert.equal(isSalesClosed('Holmesland A','2026-06-17'),false);
 assert.equal(isSalesClosed('Holmesland B','2026-06-15'),false);
 assert.equal(exampleAvailability('Holmesland A','2026-06-15').remaining,0);
 assert.ok(readDemoTicket(existing.token));assert.equal((await listLandownerBookings()).length,1);
 assert.throws(()=>completeDemoOrder(booking('Holmesland A'),buyer,[per],true),/Kortsalget er stengt/);
 assert.throws(()=>createDemoTicket(booking('Holmesland A',['2026-06-14','2026-06-15']),buyer,per,'https://easyfisk.test/'),/Kortsalget er stengt/);
 const details={description:'Oppdatert',cardTitle:'Døgnkort',cardInfo:'',rules:'',price:'350',capacity:'6',closed:false};
 await saveZoneSettings('Holmesland A',details);assert.equal(isSalesClosed('Holmesland A','2026-06-15'),true);
 await setDaySalesClosed('Holmesland A','2026-06-15',false);
 assert.equal(isSalesClosed('Holmesland A','2026-06-15'),false);assert.equal(isSalesClosed('Holmesland A','2026-06-16'),true);
 assert.equal(exampleAvailability('Holmesland A','2026-06-15').total,6);
 completeDemoOrder(booking('Holmesland A'),buyer,[per],true);assert.equal((await listLandownerBookings()).length,2);
 await saveZoneSettings('Holmesland A',{...details,closed:true});
 await setDaySalesClosed('Holmesland A','2026-06-16',false);
 assert.equal(isSalesClosed('Holmesland A','2026-06-16'),true);
});

test('only an assigned landowner can close valid calendar dates',async()=>{
 reset();await loginUser('fisher');await assert.rejects(setDaySalesClosed('Holmesland A','2026-06-15',true),/ikke tilgang/);
 await loginUser('landowner');await assert.rejects(setDaySalesClosed('Bringsdal','2026-06-15',true),/ikke tilgang/);
 for(const date of ['2026-02-30','2026-13-01','2026-6-1','invalid'])await assert.rejects(setDaySalesClosed('Holmesland A',date,true),/gyldig fiskedøgn/);
 await assert.rejects(setDaySalesClosed('Holmesland A','2026-06-15','false'),/gyldig fiskedøgn/);
});

test('calendar, mock bookings, closure controls and recipient messages stay isolated between accounts',async()=>{
 reset();const now=new Date('2026-11-12T12:00:00Z');const tokens=new Map();
 for(const account of ['a','b','c','p']){
  await loginUser('landowner',account);await seedLandownerBookings(now);
  const tickets=await listLandownerBookings(),place=`Holmesland ${account.toUpperCase()}`;
  assert.equal(tickets.length,8);assert.ok(tickets.every(ticket=>ticket.booking.place.name===place));
  tokens.set(account,bookingsForDay(tickets,place,'2026-11-12')[0].token);
 }
 for(const account of ['a','b','c','p']){
  await loginUser('landowner',account);
  for(const other of ['a','b','c','p'].filter(value=>value!==account)){
   const place=`Holmesland ${other.toUpperCase()}`;
   await assert.rejects(setDaySalesClosed(place,'2026-11-12',true),/ikke tilgang/);
   await assert.rejects(sendBookingMessage(place,'2026-11-12',[tokens.get(other)],'Melding','Kan ikke sendes fra feil konto.'),/Velg fiskere/);
  }
 }
});
