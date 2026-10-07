import { recordActivity } from "../shared/social-store.js";
import { readBooking, bookingUrl } from "../shared/booking.js";
import { addDays } from "../shared/purchase-calendar.js";
import { getCurrentUser } from "../shared/auth.js";
import { createRecipientField } from "../shared/recipients.js";
import { createDemoTicket, completeDemoOrder } from "../shared/demo-tickets.js";

const booking = readBooking(new URLSearchParams(window.location.search), fishingPlaces);
const acceptRules = document.querySelector("#accept-rules");
acceptRules.addEventListener("change", () => {
  document.querySelector("#rules-status").textContent = acceptRules.checked
    ? "Fiskereglene er bekreftet." : "Du må bekrefte at du har lest fiskereglene før kjøp.";
});
if (!booking) {
  document.querySelector("#invalid-booking").hidden = false;
} else {
  document.querySelector("#booking-content").hidden = false;
  const returnUrl = bookingUrl("kjop.html", booking, window.location.href).href;
  document.querySelector("#back-to-calendar").href = returnUrl;
  document.querySelector("#edit-dates").href = returnUrl;
  const name = booking.place.name === "Mandalselva Sone 3" ? "Mandalselva" : booking.place.name;
  document.querySelector("#booking-place").textContent = `${booking.place.zone} – ${name}`;
  document.querySelector("#booking-type").textContent = booking.type === "group"
    ? `Gruppekort · ${booking.people} fiskere` : "Døgnkort · 1 fisker";
  const dateFormat = new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const format = key => dateFormat.format(new Date(`${key}T12:00:00Z`));
  const periods = document.querySelector("#booking-periods");
  for (const key of booking.dates) {
    const item = document.createElement("li");
    const start = document.createElement("strong");
    start.textContent = `${format(key)} kl. 18.00`;
    const end = document.createElement("span");
    end.textContent = `til ${format(addDays(key, 1))} kl. 17.59`;
    item.append(start, end);
    periods.append(item);
  }
  document.querySelector("#booking-total").textContent =
    `${booking.dates.length} fiskedøgn · ${booking.people} ${booking.people === 1 ? "fiskeplass" : "fiskeplasser"} per døgn`;
  const fishers = document.querySelector("#fisher-fields");
  const recipients = [];
  for (let i = 1; i <= booking.people; i++) {
    const recipient = createRecipientField(i, updateDelivery);
    recipients.push(recipient);
    fishers.append(recipient.element);
  }
  const buyForOthers = document.querySelector("#buy-for-others");
  let currentUser = null;
  function updateDelivery() {
    const hasEmailRecipient = recipients.some(recipient => recipient.getDeliveryMethod() === "email");
    document.querySelector("#preview-message").hidden = !hasEmailRecipient;
    document.querySelector("#recipient-status").textContent = "";
  }
  function showRecipientMode() {
    recipients[0].setActive(buyForOthers.checked);
    document.querySelector("#self-fisher").hidden = buyForOthers.checked;
    document.querySelector("#recipient-delivery").hidden = !buyForOthers.checked && booking.people === 1;
    document.querySelector("#recipient-status").textContent = "";
    updateDelivery();
  }
  buyForOthers.addEventListener("change", showRecipientMode);
  showRecipientMode();

  const signupUrl = new URL("registrer.html", window.location.href);
  signupUrl.searchParams.set("tilbake", window.location.pathname + window.location.search);
  document.querySelector("#signup-link").href = signupUrl.href;
  const loginUrl = new URL("logginn.html", window.location.href);
  loginUrl.searchParams.set("tilbake", window.location.pathname + window.location.search);
  document.querySelector("#login-link").href = loginUrl.href;
  const dialog = document.querySelector("#message-dialog");
  document.querySelector("#close-message").addEventListener("click", () => dialog.close());
  document.querySelector("#preview-message").addEventListener("click", () => {
    const status = document.querySelector("#recipient-status");
    status.textContent = "";
    if (!currentUser || !document.querySelector("#booking-form").reportValidity()) return;
    const others = recipients.map(recipient => recipient.getRecipient()).filter(Boolean);
    if (others.length !== booking.people - (buyForOthers.checked ? 0 : 1)
      || others.some(recipient => recipient.name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email))) {
      status.textContent = "Velg en venn eller fyll inn navn og gyldig e-post for hver mottaker.";
      return;
    }
    const unique = new Set(others.map(recipient => recipient.email.toLowerCase()));
    if (unique.size !== others.length || (!buyForOthers.checked && unique.has(currentUser.email.toLowerCase()))) {
      status.textContent = "Hver fisker må være en egen person. Velg en annen mottaker for de ekstra kortene.";
      return;
    }
    const previews = document.querySelector("#message-previews");
    previews.replaceChildren();
    const emailRecipients = recipients.filter(recipient => recipient.getDeliveryMethod() === "email")
      .map(recipient => recipient.getRecipient()).filter(Boolean);
    if (!emailRecipients.length) return;
    try {
      for (const recipient of emailRecipients) {
        const link = createDemoTicket(booking, currentUser, recipient, window.location.href);
        const message = document.createElement("article");
        message.className = "message-preview";
        const to = document.createElement("h3");
        to.textContent = `Til ${recipient.name} · ${recipient.email}`;
        const text = document.createElement("p");
        text.textContent = `Hei ${recipient.name}! ${currentUser.name} har valgt et fiskekort til deg i ${booking.place.zone}, ${booking.place.name}. Åpne lenken for å se kortet. Du kan også velge å opprette en bruker.`;
        const anchor = document.createElement("a");
        anchor.className = "account-button";
        anchor.href = link.href;
        anchor.textContent = "Åpne fiskekort";
        message.append(to, text, anchor);
        previews.append(message);
      }
      dialog.showModal();
    } catch {
      status.textContent = "Kunne ikke åpne kortmeldingen. Prøv igjen.";
    }
  });

  async function showAccountOptions() {
    const status = document.querySelector("#account-status");
    try {
      const user = await getCurrentUser();
      document.querySelector("#guest-account").hidden = Boolean(user);
      status.textContent = "";
      if (!user) return;
      currentUser = user;
      showRecipientMode();
      document.querySelector("#account-name").textContent = user.name;
      document.querySelector("#account-email").textContent = user.email;
      document.querySelector("#account-phone").textContent = user.phone || "Ikke registrert";
      document.querySelector("#booking-form").hidden = false;
      document.querySelector("#checkout-fields").disabled = false;
    } catch {
      document.querySelector("#guest-account").hidden = false;
      status.textContent = "Kunne ikke sjekke innlogging. Prøv å logge inn på nytt.";
    }
  }
  let submitting = false;
  const paymentButton = document.querySelector("#payment-button");
  acceptRules.addEventListener("change", () => { paymentButton.disabled = submitting || !acceptRules.checked; });
  document.querySelector("#booking-form").addEventListener("submit", async event => {
    event.preventDefault();
    const status = document.querySelector("#rules-status");
    if (submitting || !acceptRules.checked || !document.querySelector("#booking-form").reportValidity()) return;
    submitting = true;
    paymentButton.disabled = true;
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error("Logg inn før du bestiller.");
      const others = recipients.map(field => {
        const person = field.getRecipient();
        return person ? { ...person, delivery: field.getDeliveryMethod() } : null;
      }).filter(Boolean);
      const people = buyForOthers.checked ? others : [{ ...user, delivery: "in-app" }, ...others];
      await recordActivity(user, "rules", { version: "2026-08-01" }).catch(() => {});
      const id = completeDemoOrder(booking, user, people, acceptRules.checked);
      const url = new URL("fiskekort.html", window.location.href);
      url.searchParams.set("bestilt", id);
      window.location.assign(url.href);
    } catch {
      submitting = false;
      status.textContent = "Kunne ikke bestille. Sjekk at du er logget inn, og at hver fisker har navn og en egen gyldig e-post.";
      paymentButton.disabled = !acceptRules.checked;
    }
  });
  showAccountOptions();
}

