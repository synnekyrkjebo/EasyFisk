export const SPECIES = ["Laks", "Sjøørret", "Ørret", "Regnbueørret", "Pukkellaks", "Annen art"];

export function localTime(value = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Oslo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value)).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function parseTime(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value || "")) throw new Error("Velg et gyldig tidspunkt.");
  let date = new Date(value + "Z");
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 16) !== value) throw new Error("Velg et gyldig tidspunkt.");
  for (let i = 0; i < 3; i++) {
    const difference = new Date(value + "Z") - new Date(localTime(date) + "Z");
    if (!difference) return date.toISOString();
    date = new Date(date.getTime() + difference);
  }
  throw new Error("Tidspunktet finnes ikke på grunn av overgangen til sommertid. Velg et annet tidspunkt.");
}

export function startBlockReason(place, instant, tickets) {
  const date = localTime(instant).slice(0, 10);
  const year = date.slice(0, 4);
  const end = place.zone === "Sone 4" ? "09-15" : "08-31";
  if (year !== "2026") return "Fisketidene for dette året er ikke tilgjengelige ennå.";
  if (date.slice(5) < "06-01" || date.slice(5) > end) return `Fiskesesongen i ${place.zone} er 1. juni–${end === "09-15" ? "15. september" : "31. august"}. Du kan ikke starte fiske nå.`;
  const hour = Number(localTime(instant).slice(11, 13));
  const previous = new Date(`${date}T12:00:00Z`);
  previous.setUTCDate(previous.getUTCDate() - 1);
  const permitDate = hour >= 18 ? date : previous.toISOString().slice(0, 10);
  if (!tickets.some(ticket => ticket.booking.place.name === place.name && ticket.booking.dates.includes(permitDate))) return "Du har ikke et fiskekort som gjelder for denne sonen akkurat nå.";
  return "";
}

export function validateSession(session, now = new Date()) {
  const start = new Date(session.start);
  const end = session.end ? new Date(session.end) : now;
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start > end || end > now) throw new Error("Økten må starte før den avsluttes og kan ikke ligge i fremtiden.");
  for (const fish of session.catches) validateCatch(fish, session, now);
}

export function validateCatch(fish, session, now = new Date()) {
  if (!SPECIES.includes(fish.species) || !Number.isFinite(fish.weight) || fish.weight <= 0 || !Number.isFinite(fish.length) || fish.length <= 0) throw new Error("Velg art og fyll inn vekt og lengde over null.");
  const time = new Date(fish.time);
  if (!Number.isFinite(time.getTime()) || time.getTime() < Math.floor(new Date(session.start).getTime() / 60000) * 60000 || time > new Date(session.end || now) || time > now) throw new Error("Fangsttidspunktet må være innenfor økten og kan ikke ligge i fremtiden.");
  if (fish.gps && (!Number.isFinite(fish.gps.lat) || Math.abs(fish.gps.lat) > 90 || !Number.isFinite(fish.gps.lng) || Math.abs(fish.gps.lng) > 180)) throw new Error("GPS-koordinatene er ugyldige.");
  if (!["released", "kept"].includes(fish.outcome)) throw new Error("Velg om fisken ble gjenutsatt eller avlivet.");
  if (fish.photo && (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(fish.photo.type) || fish.photo.size > 10 * 1024 * 1024)) throw new Error("Velg et bilde på maks 10 MB (JPG, PNG, WebP eller GIF).");
}

function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("easyfisk.sessions", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("sessions", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function transaction(mode, operation) {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("sessions", mode);
      const request = operation(tx.objectStore("sessions"));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
export async function listSessions(user) {
  const sessions = await transaction("readonly", store => store.getAll());
  return sessions.filter(session => session.email === user.email.toLowerCase()).sort((a, b) => new Date(b.start) - new Date(a.start));
}
export async function saveSession(user, session) {
  validateSession(session);
  return transaction("readwrite", store => store.put({ ...session, email: user.email.toLowerCase(), authorName: user.name }));
}

export function ticketCoversSession(ticket, start, end = start) {
  if (!ticket) return false;
  const startTime = new Date(start).getTime(), endTime = new Date(end).getTime();
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime < startTime) return false;
  const periods = ticket.booking.dates.map(day => {
    const next = new Date(`${day}T12:00:00Z`); next.setUTCDate(next.getUTCDate() + 1);
    return [new Date(parseTime(`${day}T18:00`)).getTime(), new Date(parseTime(`${next.toISOString().slice(0, 10)}T18:00`)).getTime()];
  }).sort((a, b) => a[0] - b[0]);
  let covered = startTime;
  for (const [from, to] of periods) {
    if (from <= covered && covered < to) {
      if (endTime < to) return true;
      covered = to;
    }
  }
  return false;
}

export async function listSharedSessions() {
  const sessions = await transaction("readonly", store => store.getAll());
  const recordIds = new Set(), lengths = {};
  for (const entry of sessions.flatMap(session => session.catches.map(fish => ({...fish,email:session.email}))).sort((a,b) => new Date(a.time)-new Date(b.time))) {
    const key = `${entry.email}:${entry.species}`;
    if (lengths[key] && entry.length > lengths[key]) recordIds.add(entry.id);
    lengths[key] = Math.max(lengths[key] || 0, entry.length);
  }
  return sessions.map(session => ({ id: session.id, email: session.email, authorName: session.authorName || "Fisker",
    place: session.place, start: session.start, end: session.end, share: session.share || {}, caption: session.caption || "",
    catches: session.catches.filter(fish => fish.share?.friends || fish.share?.zone).map(({id,species,weight,length,time,photo,share,caption,createdAt}) => ({id,species,weight,length,time,photo,share,caption,createdAt,personalRecord:recordIds.has(id)}))
  })).filter(session => session.share.friends || session.share.zone || session.catches.length);
}

export async function listPublicProfileSessions(profile) {
  if (profile.visibility !== "public") return [];
  return (await transaction("readonly", store => store.getAll())).filter(session => session.email === profile.id);
}
