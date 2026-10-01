import { readDemoTicket, listDemoTickets, readDemoOrder } from "../shared/demo-tickets.js";
import { addDays } from "../shared/purchase-calendar.js";
import { getCurrentUser } from "../shared/auth.js";
import { showFishingDocuments } from "../shared/fishing-documents.js";

const token = new URLSearchParams(window.location.search).get("kort");
const ticket = readDemoTicket(token);
if (!token) {
  document.querySelector("#ticket-list").hidden = false;
  const status = document.querySelector("#ticket-list-status");
  const login = document.querySelector("#list-login");
  const loginUrl = new URL("logginn.html", window.location.href);
  loginUrl.searchParams.set("tilbake", window.location.pathname);
  login.href = loginUrl.href;
  getCurrentUser().then(user => {
    login.hidden = Boolean(user);
    if (!user) {
      status.textContent = "Logg inn for å se kortene dine.";
      return;
    }
    showFishingDocuments(user);
    const tickets = listDemoTickets(user);
    status.textContent = tickets.length ? "" : "Du har ingen fiskekort ennå.";
    const order = readDemoOrder(new URLSearchParams(window.location.search).get("bestilt"), user);
    if (order) {
      const ownCards = order.tickets.some(card => card.recipient.email.toLowerCase() === user.email.toLowerCase());
      status.textContent = ownCards
        ? "Bestillingen er fullført. Du finner dine fiskekort her."
        : "Bestillingen er fullført. Kortene tilhører mottakerne og vises ikke blant dine fiskekort.";
    }
    for (const card of tickets.slice().reverse()) {
      const section = document.createElement("section");
      section.className = "selection-card";
      const heading = document.createElement("h2");
      const name = card.booking.place.name === "Mandalselva Sone 3" ? "Mandalselva" : card.booking.place.name;
      heading.textContent = `${card.booking.place.zone} – ${name}`;
      const recipient = document.createElement("p");
      recipient.textContent = card.recipient.name;
      const dates = document.createElement("p");
      dates.className = "account-status";
      const format = new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
      const dateLabel = key => format.format(new Date(`${key}T12:00:00Z`));
      for (const key of card.booking.dates) {
        const period = document.createElement("span");
        period.style.display = "block";
        period.textContent = `${dateLabel(key)} kl. 18.00 – ${dateLabel(addDays(key, 1))} kl. 17.59`;
        dates.append(period);
      }
      const logLink = document.createElement("a");
      logLink.className = "account-button";
      const logUrl = new URL("loggfor.html", window.location.href);
      logUrl.searchParams.set("kort", card.token);
      logLink.href = logUrl.href;
      logLink.textContent = "Loggfør på dette kortet";
      section.append(heading, recipient, dates, logLink);
      document.querySelector("#ordered-tickets").append(section);
    }
  }).catch(() => { status.textContent = "Kunne ikke hente fiskekortene. Prøv å logge inn på nytt."; });
} else if (!ticket) {
  document.querySelector("#ticket-missing").hidden = false;
} else {
  document.querySelector("#ticket-content").hidden = false;
  const { booking, recipient } = ticket;
  const name = booking.place.name === "Mandalselva Sone 3" ? "Mandalselva" : booking.place.name;
  document.querySelector("#ticket-place").textContent = `${booking.place.zone} – ${name}`;
  document.querySelector("#ticket-recipient").textContent = recipient.name;
  document.querySelector("#ticket-buyer").textContent = `Valgt til deg av ${ticket.buyerName}.`;
  const format = new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const dateLabel = key => format.format(new Date(`${key}T12:00:00Z`));
  for (const key of booking.dates) {
    const item = document.createElement("li");
    const start = document.createElement("strong");
    start.textContent = `${dateLabel(key)} kl. 18.00`;
    const end = document.createElement("span");
    end.textContent = `til ${dateLabel(addDays(key, 1))} kl. 17.59`;
    item.append(start, end);
    document.querySelector("#ticket-periods").append(item);
  }
  for (const [page, id] of [["registrer.html", "#ticket-signup-link"], ["logginn.html", "#ticket-login-link"]]) {
    const url = new URL(page, window.location.href);
    url.searchParams.set("tilbake", window.location.pathname + window.location.search);
    document.querySelector(id).href = url.href;
  }
  getCurrentUser().then(user => {
    if (user?.email.toLowerCase() === recipient.email.toLowerCase()) {
      document.querySelector("#ticket-signup").hidden = true;
      showFishingDocuments(user);
    }
  });
}
