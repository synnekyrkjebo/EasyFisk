const HELP = {
  "Kart": "Se fiskesoner på kartet og finn en fiskeplass.",
  "Fiskekort": "Se dine fiskekort og dokumenter, eller kjøp et nytt kort.",
  "Rapporter": "Start en fiskeøkt eller registrer en tidligere økt og fangst.",
  "Mine fiskekort": "Se dine fiskekort og vedlagte dokumenter.",
  "Til fiskekort": "Åpne kortoversikten for å kjøpe eller velge et fiskekort.",
  "Til kartet": "Gå tilbake til kartet over fiskesoner.",
  "Åpne fiskekort": "Vis fiskekortet og tidsrommet det gjelder for.",
  "Se mindre": "Gjør visningen av fiskeplassen mindre.",
  "Feed": "Åpne feeden.",
  "Min side": "Se profilen din, eller logg inn og opprett konto.",
  "Varsler": "Se varsler knyttet til profilen din.",
  "Finn min posisjon": "Sentrer kartet på deg. Den blå prikken følger posisjonen din.",
  "Lukk": "Lukk denne visningen.",
  "Les mer": "Utvid visningen for å lese om fiskeplassen og se bilder.",
  "Vis mindre": "Gjør visningen av fiskeplassen mindre.",
  "Kjøp fiskekort": "Velg fiskedøgn og antall fiskere før du bestiller.",
  "Forrige måned": "Vis den forrige måneden i kalenderen.",
  "Neste måned": "Vis den neste måneden i kalenderen.",
  "Vis tilgjengelige soner": "Finn soner med nok plass på alle valgte dager.",
  "Fortsett til kjøp →": "Gå videre med valgte fiskedøgn og antall fiskere.",
  "Velg sone": "Bruk denne sonen med dagene og antall fiskere du har valgt.",
  "Gå til betaling": "Fullfør bestillingen etter at mottakere og fiskeregler er bekreftet.",
  "Forhåndsvis kortmelding": "Se meldingen og kortlenken til mottakere du har lagt inn manuelt.",
  "Logg inn": "Logg inn med profilen din og fortsett der du var.",
  "Opprett konto": "Registrer navn, e-post og telefonnummer for profilen din.",
  "Registrer deg": "Opprett din egen brukerprofil.",
  "Registrer bruker": "Opprett din egen brukerprofil.",
  "Loggfør på dette kortet": "Start eller registrer en fiskeøkt på dette fiskekortet.",
  "Start fiskeøkt": "Start økten på valgt fiskekort. Timeren teller til du avslutter.",
  "Lagre tidligere økt": "Lagre den tidligere økten med start- og sluttidspunkt.",
  "Registrer fangst": "Legg til art, vekt, lengde, tidspunkt, GPS og bilde.",
  "Rediger fangst": "Endre opplysningene eller bildet for denne fangsten.",
  "Lagre fangst": "Lagre fangsten på den valgte fiskeøkten.",
  "Avslutt fiskeøkt": "Stopp timeren og lagre sluttidspunktet. Fangster kan fortsatt redigeres.",
  "Hent min posisjon": "Legg til GPS-posisjonen din nå. For tidligere fangst kan du skrive koordinatene selv.",
  "Velg fra fil": "Velg et fangstbilde som er lagret på enheten din.",
  "Ta bilde": "Ta et nytt fangstbilde med kameraet på mobil.",
  "Legg til dokument": "Last opp bilde eller PDF av beviset eller kvitteringen.",
  "Bytt dokument": "Erstatt vedlegget med et nytt bilde eller en PDF.",
  "Vis til oppsyn": "Åpne dokumentet i full størrelse for å vise det til oppsyn.",
  "Avbryt": "Lukk skjemaet uten å lagre endringene.",
};
const selector = "button, a, .document-upload";
const tooltip = document.createElement("div");
tooltip.id = "button-help-tooltip";
tooltip.className = "help-tooltip";
tooltip.setAttribute("role", "tooltip");
tooltip.hidden = true;
document.body.append(tooltip);
let active, helpMode = false;
const header = document.querySelector(".header, .purchase-header");
const toggle = document.createElement("button");
toggle.type = "button";
toggle.className = "help-toggle";
toggle.textContent = "?";
toggle.setAttribute("aria-label", "Vis hjelp for knapper");
toggle.setAttribute("aria-pressed", "false");
toggle.setAttribute("aria-controls", tooltip.id);
if (header?.classList.contains("header")) {
  header.classList.add("header--with-help");
  const actions = document.createElement("div"); actions.className = "header-actions";
  const notifications = header.querySelector(".icon-button");
  if (notifications) actions.append(notifications);
  actions.append(toggle); header.append(actions);
} else header?.append(toggle);

function annotate(root = document) {
  for (const control of root.querySelectorAll(selector)) {
    if (control === toggle || (control.dataset.help && !control.dataset.helpLabel)) continue;
    const label = control.getAttribute("aria-label") || control.textContent.trim();
    let help = HELP[label];
    if (control.classList.contains("calendar-day")) help = `${label}. Trykk for å velge eller fjerne dette fiskedøgnet.`;
    if (control.classList.contains("session-history-item")) help = "Åpne økten for å se eller redigere fangstene.";
    if (control.classList.contains("friend-choice")) help = "Velg denne vennen som mottaker av fiskekortet.";
    if (label.startsWith("Fjern ")) help = "Fjern dette fiskedøgnet fra valget ditt.";
    if (control.classList.contains("back-link")) help = label || "Gå tilbake til forrige side.";
    if (help) { control.dataset.help = help; control.dataset.helpLabel = label; }
  }
}
function target(event) { return event.target.closest?.("[data-help]"); }
function hide() {
  if (active) {
    const ids = (active.getAttribute("aria-describedby") || "").split(/\s+/).filter(id => id && id !== tooltip.id);
    if (ids.length) active.setAttribute("aria-describedby", ids.join(" ")); else active.removeAttribute("aria-describedby");
  }
  active = null; tooltip.hidden = true;
}
function show(control) {
  if (!control || control.closest("[hidden]")) return;
  hide(); active = control;
  // A tooltip inside a modal stays above the dialog's backdrop.
  (control.closest("dialog[open]") || document.body).append(tooltip);
  tooltip.textContent = control.dataset.help; tooltip.hidden = false;
  const ids = (control.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
  control.setAttribute("aria-describedby", [...ids, tooltip.id].join(" "));
  const box = control.getBoundingClientRect();
  const phone = document.querySelector(".phone, .purchase-page")?.getBoundingClientRect();
  const leftEdge = Math.max(8, (phone?.left || 0) + 8);
  const rightEdge = Math.min(window.innerWidth - 8, (phone?.right || window.innerWidth) - 8);
  tooltip.style.maxWidth = `${Math.min(280, rightEdge - leftEdge)}px`;
  const help = tooltip.getBoundingClientRect();
  tooltip.style.left = `${Math.max(leftEdge, Math.min(box.left + box.width / 2 - help.width / 2, rightEdge - help.width))}px`;
  tooltip.style.top = `${Math.max(8, Math.min(box.top > help.height + 16 ? box.top - help.height - 8 : box.bottom + 8, window.innerHeight - help.height - 8))}px`;
}
toggle.addEventListener("click", () => {
  helpMode = !helpMode; hide();
  toggle.setAttribute("aria-pressed", String(helpMode));
  document.body.classList.toggle("help-mode", helpMode);
  if (helpMode) { toggle.dataset.help = "Trykk på en knapp for å lese hjelpen. Trykk på ? igjen for å bruke knappene som vanlig."; show(toggle); }
});
document.addEventListener("pointerover", event => { if (event.pointerType === "mouse") show(target(event)); });
document.addEventListener("pointerout", event => {
  if (event.pointerType === "mouse" && active && !active.contains(event.relatedTarget) && !tooltip.contains(event.relatedTarget)) hide();
});
document.addEventListener("focusin", event => show(target(event)));
document.addEventListener("focusout", event => { if (!tooltip.contains(event.relatedTarget)) hide(); });
document.addEventListener("pointerdown", event => {
  const control = target(event);
  if (helpMode && control && !toggle.contains(event.target)) show(control);
}, true);
document.addEventListener("click", event => {
  if (toggle.contains(event.target)) return;
  const control = target(event);
  if (helpMode && control) { event.preventDefault(); event.stopImmediatePropagation(); show(control); }
  else if (!tooltip.contains(event.target)) hide();
}, true);
document.addEventListener("keydown", event => { if (event.key === "Escape") { hide(); helpMode = false; toggle.setAttribute("aria-pressed", "false"); document.body.classList.remove("help-mode"); } });
document.addEventListener("scroll", hide, true);
window.addEventListener("resize", hide);
// Dynamic calendars, recipient choices, sessions and document buttons also get help.
const observer = new MutationObserver(() => annotate());
observer.observe(document.body, { childList: true, subtree: true });
annotate();
