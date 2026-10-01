const PREFIX = "easyfisk.demo.ticket.";

export function createDemoTicket(booking, buyer, recipient, base) {
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
