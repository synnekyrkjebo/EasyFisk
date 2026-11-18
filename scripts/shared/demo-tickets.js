import {zoneSettings,canManagePlace,isSalesClosed} from './landowner-store.js';
import {getCurrentUser,getDemoProfile} from './auth.js';
import {localTime} from './fishing-sessions.js';
const PREFIX = "easyfisk.demo.ticket.";
function requireOpenPlace(booking){if(zoneSettings(booking.place.name).closed||booking.dates.some(date=>isSalesClosed(booking.place.name,date)))throw new Error('Kortsalget er stengt for ett eller flere av de valgte fiskedøgnene.');}

export function createDemoTicket(booking, buyer, recipient, base) {
  requireOpenPlace(booking);
  const token = crypto.randomUUID();
  const ticket = { demo: true, booking, buyerName: buyer.name, recipient,
    createdAt: new Date().toISOString() };
  localStorage.setItem(PREFIX + token, JSON.stringify(ticket));
  const url = new URL("fiskekort.html", base);
  url.searchParams.set("kort", token);
  return url;
}

export function readDemoTicket(token) {
  if (!/^[a-f0-9-]{36}$/.test(token || "")) return null;
  try {
    const ticket = readOrders().flatMap(order => order.tickets).find(ticket => ticket.token === token)
      || JSON.parse(localStorage.getItem(PREFIX + token) || "null");
    if (ticket?.demo !== true || typeof ticket.booking?.place?.name !== "string" || typeof ticket.booking?.place?.zone !== "string"
      || typeof ticket.recipient?.name !== "string" || typeof ticket.recipient?.email !== "string" || typeof ticket.buyerName !== "string"
      || !Array.isArray(ticket.booking.dates) || !ticket.booking.dates.length) return null;
    if (!ticket.booking.dates.every(key => typeof key === "string" && /^\d{4}-\d{2}-\d{2}$/.test(key)
      && Number.isFinite(new Date(`${key}T12:00:00Z`).getTime())
      && new Date(`${key}T12:00:00Z`).toISOString().slice(0, 10) === key)) return null;
    return ticket;
  } catch { return null; }
}

const ORDER_PREFIX = "easyfisk.demo.order.";

export function completeDemoOrder(booking, buyer, recipients, acceptedRules) {
  requireOpenPlace(booking);
  if (!acceptedRules || !buyer?.email || recipients.length !== booking.people
    || recipients.some(person => !person.name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email))
    || new Set(recipients.map(person => person.email.toLowerCase())).size !== recipients.length) {
    throw new Error("Ugyldig bestilling");
  }
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const order = { id, buyerEmail: buyer.email.toLowerCase(), rulesAcceptedAt: createdAt,
    tickets: recipients.map(recipient => ({ token: crypto.randomUUID(), demo: true, booking,
      buyerName: buyer.name, recipient, createdAt })) };
  localStorage.setItem(ORDER_PREFIX + id, JSON.stringify(order));
  return id;
}

export function listDemoTickets(user) {
  if (!user?.email) return [];
  return readOrders().flatMap(order => order.tickets.filter(ticket => ticket.recipient?.email?.toLowerCase() === user.email.toLowerCase()));
}

export function readDemoOrder(id, user) {
  return readOrders().find(order => order.id === id && order.buyerEmail === user?.email?.toLowerCase()) || null;
}

export async function listLandownerBookings(){
  const user=await getCurrentUser();
  if(user?.role!=='landowner')throw new Error('Logg inn som grunneier for å se bestillinger.');
  const tickets=new Map();
  function add(ticket,orderId,buyerEmail){
    if(!ticket?.token||!canManagePlace(user,ticket.booking?.place?.name)||!ticket.recipient?.email||!ticket.recipient?.name||!Array.isArray(ticket.booking?.dates))return;
    tickets.set(ticket.token,{...ticket,orderId,buyerEmail});
  }
  for(const order of readOrders())for(const ticket of order.tickets)add(ticket,order.id,order.buyerEmail);
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i);if(!key?.startsWith(PREFIX))continue;
    try{const token=key.slice(PREFIX.length);if(!tickets.has(token))add({...JSON.parse(localStorage.getItem(key)),token},null,null);}catch{ /* Skip damaged legacy tickets. */ }
  }
  return [...tickets.values()];
}

export async function seedLandownerBookings(now=new Date()){
  const user=await getCurrentUser();
  if(user?.role!=='landowner')throw new Error('Logg inn som grunneier for å legge til mockbestillinger.');
  const today=localTime(now).slice(0,10),month=today.slice(0,7),day=Number(today.slice(8));
  const [year,monthNumber]=month.split('-').map(Number);
  const daysInMonth=new Date(Date.UTC(year,monthNumber,0)).getUTCDate();
  const date=offset=>`${month}-${String((day-1+offset)%daysInMonth+1).padStart(2,'0')}`;
  const own=getDemoProfile();
  const people=[
    {name:'Kari Hansen',email:'kari@example.com',phone:'90000001'},
    {name:'Per Olsen',email:'per@example.com',phone:'90000002'},
    {name:'Anne Berg',email:'anne@example.com',phone:'90000003'},
    {name:own.name,email:own.email,phone:own.phone},
  ];
  for(const place of user.managedPlaces.filter(name=>['Holmesland A','Holmesland B','Holmesland C','Holmesland P'].includes(name))){
    const id=`mock:${month}:${place}`,key=ORDER_PREFIX+id;
    if(localStorage.getItem(key)!==null)continue;
    const createdAt=new Date(now.getTime()-86400000).toISOString();
    const groups=[{dates:[date(0)],people:people.slice(0,2)},{dates:[date(2)],people:[people[2]]},{dates:[date(5)],people},{dates:[date(9),date(10)].sort(),people:[people[3]]}];
    const tickets=groups.flatMap(group=>group.people.map(recipient=>({
      token:crypto.randomUUID(),demo:true,mock:true,
      booking:{place:{name:place,zone:'Sone 2'},dates:group.dates,people:group.people.length,type:group.people.length>1?'group':'single'},
      buyerName:own.name,recipient:{...recipient},createdAt,
    })));
    localStorage.setItem(key,JSON.stringify({id,mock:true,buyerEmail:own.email.toLowerCase(),rulesAcceptedAt:createdAt,tickets}));
  }
}

function readOrders() {
  const orders = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(ORDER_PREFIX)) continue;
    try {
      const order = JSON.parse(localStorage.getItem(key));
      if (typeof order?.buyerEmail === "string" && order.rulesAcceptedAt && Array.isArray(order.tickets)) orders.push(order);
    } catch { /* Skip damaged local records. */ }
  }
  return orders;
}
