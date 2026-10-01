import { getCurrentUser } from "../shared/auth.js";
import { listDemoTickets } from "../shared/demo-tickets.js";
import { SPECIES, localTime, parseTime, validateCatch, listSessions, saveSession, ticketCoversSession } from "../shared/fishing-sessions.js";

const $ = selector => document.querySelector(selector);
let user, tickets = [], sessions = [], current, editingFish, selectedPhoto, previewUrl, busy = false;
const imageUrls = [];
const format = value => new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Oslo" }).format(new Date(value));
const past = () => $("input[name=mode]:checked").value === "past";
const selectedTicket = () => tickets.find(ticket => ticket.token === $("#session-ticket").value);
const message = error => error instanceof Error && error.name === "Error" ? error.message : "Kunne ikke lagre. Prøv igjen.";
const element = (tag, text, className) => { const node = document.createElement(tag); if (text) node.textContent = text; if (className) node.className = className; return node; };

function loadTickets() {
  tickets = listDemoTickets(user);
  $("#session-ticket").replaceChildren();
  for (const ticket of tickets) {
    const option = element("option", `${ticket.booking.place.zone} – ${ticket.booking.place.name} · ${ticket.booking.dates.join(", ")}`);
    option.value = ticket.token;
    $("#session-ticket").append(option);
  }
  const requested = new URLSearchParams(location.search).get("kort");
  const chosen = tickets.find(ticket => ticket.token === requested)
    || tickets.find(ticket => ticketCoversSession(ticket, new Date())) || tickets.at(-1);
  if (chosen) $("#session-ticket").value = chosen.token;
  $("#session-ticket-picker").hidden = tickets.length < 2;
  $("#session-buy-ticket").hidden = Boolean(tickets.length);
}
function defaultPastTimes() {
  const ticket = selectedTicket();
  if (!past() || !ticket) return;
  const date = [...ticket.booking.dates].sort().filter(day => day <= localTime().slice(0, 10)).at(-1);
  if (!date) return;
  const start = parseTime(`${date}T18:00`);
  if (new Date(start) > new Date()) return;
  $("#session-start").value = localTime(start);
  $("#session-end").value = localTime(new Date(Math.min(Date.now(), new Date(start).getTime() + 2 * 3600000)));
}
for (const species of SPECIES) $("#fish-species").append(element("option", species));
for (const [id, page] of [["#session-login", "logginn.html"], ["#session-signup", "registrer.html"]]) {
  const url = new URL(page, location.href); url.searchParams.set("tilbake", location.pathname + location.search); $(id).href = url.href;
}
$("#session-start").value = localTime(new Date(Date.now() - 3600000));
$("#session-end").value = localTime();
function updateStart() {
  if (!user) return;
  $("#past-times").hidden = !past();
  $("#session-start").required = past(); $("#session-end").required = past();
  $("#session-start").disabled = !past(); $("#session-end").disabled = !past();
  $("#session-start").max = localTime(); $("#session-end").max = localTime();
  const ticket = selectedTicket();
  $("#selected-ticket").textContent = ticket ? `${ticket.booking.place.zone} – ${ticket.booking.place.name}. Økten loggføres på dette fiskekortet.` : "";
  const reason = !ticket ? "Du trenger et fiskekort for å loggføre en økt." : !past() ? sessions.some(session => !session.end) ? "Du har allerede en aktiv fiskeøkt. Avslutt den før du starter en ny." : "" : "";
  $("#start-reason").textContent = reason;
  $("#start-session").disabled = busy || Boolean(reason);
  $("#start-session").textContent = past() ? "Lagre tidligere økt" : "Start fiskeøkt";
}
for (const node of document.querySelectorAll("input[name=mode], #session-ticket")) node.addEventListener("change", () => { defaultPastTimes(); updateStart(); });
async function refresh(id = current?.id) {
  sessions = await listSessions(user);
  current = sessions.find(session => session.id === id) || sessions.find(session => !session.end);
  render(); updateStart();
}
function tick() {
  if (!current || current.end) return;
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(current.start)) / 1000));
  $("#session-timer").textContent = `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
function render() {
  imageUrls.splice(0).forEach(url => URL.revokeObjectURL(url));
  $("#history-empty").hidden = sessions.length > 0;
  $("#session-list").replaceChildren();
  for (const session of sessions) {
    const button = element("button", "", "selection-card session-history-item"); button.type = "button";
    button.append(element("strong", `${session.place.zone} – ${session.place.name}`), element("span", `${format(session.start)} · ${session.end ? "Avsluttet" : "Pågår"} · ${session.catches.length} fangster`));
    button.addEventListener("click", () => { current = session; render(); $("#session-detail").scrollIntoView({ behavior: "smooth", block: "start" }); });
    $("#session-list").append(button);
  }
  $("#session-detail").hidden = !current;
  if (!current) return;
  $("#session-title").textContent = `${current.place.zone} – ${current.place.name}`;
  $("#session-period").textContent = `${format(current.start)}${current.end ? ` – ${format(current.end)}` : " · Økten pågår"}`;
  $("#session-timer").hidden = Boolean(current.end); tick();
  $("#end-session").hidden = Boolean(current.end);
  $("#catch-list").replaceChildren();
  if (!current.catches.length) $("#catch-list").append(element("p", "Ingen fangster registrert ennå.", "account-status"));
  for (const fish of current.catches) {
    const card = element("article", "", "logged-catch");
    card.append(element("h3", `${fish.species} · ${fish.weight} kg · ${fish.length} cm`), element("p", `${format(fish.time)} · ${fish.outcome === "released" ? "Gjenutsatt" : "Avlivet"}`, "account-status"));
    if (fish.gps) card.append(element("p", `GPS: ${fish.gps.lat.toFixed(5)}, ${fish.gps.lng.toFixed(5)}`, "account-status"));
    if (fish.photo) {
      const img = element("img", "", "document-image"); img.src = URL.createObjectURL(fish.photo); imageUrls.push(img.src); img.alt = `Fangst av ${fish.species.toLowerCase()}`; card.append(img);
    }
    const edit = element("button", "Rediger fangst", "account-button"); edit.type = "button"; edit.addEventListener("click", () => openCatch(fish)); card.append(edit); $("#catch-list").append(card);
  }
}
$("#start-form").addEventListener("submit", async event => {
  event.preventDefault(); if (busy || !$("#start-form").reportValidity()) return;
  busy = true; updateStart(); $("#session-status").textContent = "";
  try {
    const historical = past();
    const ticket = selectedTicket();
    if (!ticket) throw new Error("Velg et fiskekort først.");
    if (!historical && sessions.some(session => !session.end)) throw new Error("Avslutt den aktive økten først.");
    const session = { id: crypto.randomUUID(), ticketToken: ticket.token, place: ticket.booking.place, start: historical ? parseTime($("#session-start").value) : new Date().toISOString(), end: historical ? parseTime($("#session-end").value) : null, catches: [] };
    await saveSession(user, session); await refresh(session.id);
    $("#session-status").textContent = historical ? "Tidligere økt er lagret. Du kan nå legge til fangster." : "Fiskeøkten er startet.";
    $("#session-detail").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) { $("#session-status").textContent = message(error); }
  finally { busy = false; updateStart(); }
});
$("#end-session").addEventListener("click", async () => {
  if (busy || !current || current.end) return;
  busy = true;
  try { await saveSession(user, { ...current, end: new Date().toISOString() }); await refresh(); $("#session-status").textContent = "Økten er avsluttet. Du kan fortsatt legge til eller redigere fangst."; }
  catch (error) { $("#session-status").textContent = message(error); }
  finally { busy = false; updateStart(); }
});
function lengthWarning() { $("#length-warning").hidden = Number($("#fish-length").value) <= 65; }
$("#fish-length").addEventListener("input", lengthWarning);
function preview(photo) {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = photo ? URL.createObjectURL(photo) : null;
  $("#fish-photo-preview").hidden = !previewUrl;
  if (previewUrl) $("#fish-photo-preview").src = previewUrl;
}
function openCatch(fish) {
  editingFish = fish || null; selectedPhoto = fish?.photo || null; $("#catch-form").reset();
  $("#catch-heading").textContent = fish ? "Rediger fangst" : "Registrer fangst";
  $("#fish-species").value = fish?.species || SPECIES[0];
  $("#fish-weight").value = fish?.weight || ""; $("#fish-length").value = fish?.length || "";
  $("#fish-outcome").value = fish?.outcome || "released";
  $("#fish-time").value = localTime(fish?.time || current.end || new Date());
  $("#fish-time").min = localTime(current.start); $("#fish-time").max = localTime(current.end || new Date());
  $("#fish-lat").value = fish?.gps?.lat ?? ""; $("#fish-lng").value = fish?.gps?.lng ?? "";
  $("#catch-status").textContent = ""; $("#gps-status").textContent = "";
  lengthWarning(); preview(fish?.photo); $("#catch-dialog").showModal();
}
$("#add-catch").addEventListener("click", () => openCatch());
$("#cancel-catch").addEventListener("click", () => $("#catch-dialog").close());
for (const id of ["#fish-photo", "#fish-camera"]) {
  $(id).addEventListener("change", () => {
    const photo = $(id).files[0];
    if (!photo) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(photo.type) || photo.size > 10 * 1024 * 1024) {
      $("#catch-status").textContent = "Velg et bilde på maks 10 MB (JPG, PNG, WebP eller GIF).";
      $(id).value = "";
      return;
    }
    selectedPhoto = photo;
    $("#catch-status").textContent = "";
    preview(selectedPhoto);
  });
}
$("#capture-gps").addEventListener("click", () => {
  if (!navigator.geolocation) { $("#gps-status").textContent = "GPS er ikke tilgjengelig. Legg inn koordinatene manuelt."; return; }
  $("#capture-gps").disabled = true; $("#gps-status").textContent = "Henter posisjon …";
  navigator.geolocation.getCurrentPosition(position => {
    $("#fish-lat").value = position.coords.latitude; $("#fish-lng").value = position.coords.longitude;
    $("#gps-status").textContent = "Nåværende posisjon er lagt til."; $("#capture-gps").disabled = false;
  }, () => { $("#gps-status").textContent = "Kunne ikke hente posisjon. Tillat posisjonstilgang eller legg inn koordinatene."; $("#capture-gps").disabled = false; }, { enableHighAccuracy: true, timeout: 15000 });
});
$("#catch-form").addEventListener("submit", async event => {
  event.preventDefault(); if (busy || !$("#catch-form").reportValidity()) return;
  busy = true; $("#save-catch").disabled = true;
  try {
    const lat = $("#fish-lat").value, lng = $("#fish-lng").value;
    if (Boolean(lat) !== Boolean(lng)) throw new Error("Fyll inn begge GPS-koordinatene eller la begge stå tomme.");
    const fish = { id: editingFish?.id || crypto.randomUUID(), species: $("#fish-species").value, weight: Number($("#fish-weight").value), length: Number($("#fish-length").value), time: parseTime($("#fish-time").value), outcome: $("#fish-outcome").value, gps: lat && lng ? { lat: Number(lat), lng: Number(lng) } : null, photo: selectedPhoto || null };
    validateCatch(fish, current);
    const catches = editingFish ? current.catches.map(item => item.id === editingFish.id ? fish : item) : [...current.catches, fish];
    await saveSession(user, { ...current, catches }); await refresh(); $("#catch-dialog").close(); $("#session-status").textContent = "Fangsten er lagret.";
  } catch (error) { $("#catch-status").textContent = message(error); }
  finally { busy = false; $("#save-catch").disabled = false; }
});
$("#cancel-edit").addEventListener("click", () => $("#edit-dialog").close());
$("#edit-form").addEventListener("submit", async event => {
  event.preventDefault(); if (busy || !$("#edit-form").reportValidity()) return;
  busy = true; $("#save-edit").disabled = true;
  try {
    const changed = { ...current, start: parseTime($("#edit-start").value), end: current.end ? parseTime($("#edit-end").value) : null };
    await saveSession(user, changed); await refresh(); $("#edit-dialog").close();
  }
  catch (error) { $("#edit-status").textContent = message(error); }
  finally { busy = false; $("#save-edit").disabled = false; }
});
getCurrentUser().then(async account => {
  user = account; $("#session-guest").hidden = Boolean(user); $("#session-account").hidden = !user;
  if (user) { loadTickets(); await refresh(); }
}).catch(() => { $("#session-status").textContent = "Kunne ikke hente øktene. Prøv igjen."; });
const timer = setInterval(() => { tick(); updateStart(); }, 1000);
window.addEventListener("pagehide", () => { clearInterval(timer); imageUrls.forEach(url => URL.revokeObjectURL(url)); if (previewUrl) URL.revokeObjectURL(previewUrl); });
