import { registerUser, authReturnUrl } from "./auth.js";
import { readDemoTicket } from "./demo-tickets.js";

const returnUrl = authReturnUrl(window.location.href);
document.querySelector("#signup-back").href = returnUrl.href;
const loginUrl = new URL("logginn.html", window.location.href);
loginUrl.searchParams.set("tilbake", returnUrl.pathname + returnUrl.search);
document.querySelector("#login-link").href = loginUrl.href;

const form = document.querySelector("#signup-form");
const submit = document.querySelector("#signup-submit");
const status = document.querySelector("#signup-status");
if (returnUrl.pathname === new URL("fiskekort.html", window.location.href).pathname) {
  const ticket = readDemoTicket(returnUrl.searchParams.get("kort"));
  if (ticket) {
    document.querySelector("#signup-name").value = ticket.recipient.name;
    document.querySelector("#signup-email").value = ticket.recipient.email;
    document.querySelector("#signup-phone").value = ticket.recipient.phone || "";
  }
}
form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!form.reportValidity() || submit.disabled) return;
  submit.disabled = true;
  submit.textContent = "Oppretter konto …";
  status.textContent = "";
  try {
    const values = new FormData(form);
    await registerUser({
      name: String(values.get("name")).trim(),
      email: String(values.get("email")).trim(),
      phone: String(values.get("phone")).trim(),
    });
    form.reset();
    window.location.assign(returnUrl.href);
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Kunne ikke opprette konto. Prøv igjen.";
  } finally {
    submit.disabled = false;
    submit.textContent = "Opprett konto";
  }
});
