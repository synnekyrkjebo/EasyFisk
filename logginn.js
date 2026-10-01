import { loginUser, getDemoProfile, authReturnUrl } from "./auth.js";

const returnUrl = authReturnUrl(window.location.href);
document.querySelector("#login-back").href = returnUrl.href;
const signupUrl = new URL("registrer.html", window.location.href);
signupUrl.searchParams.set("tilbake", returnUrl.pathname + returnUrl.search);
document.querySelector("#signup-link").href = signupUrl.href;
const form = document.querySelector("#login-form");
const submit = document.querySelector("#login-submit");
const status = document.querySelector("#login-status");
const profile = getDemoProfile();
document.querySelector("#demo-name").textContent = profile.name;
document.querySelector("#demo-email").textContent = profile.email;
document.querySelector("#demo-phone").textContent = profile.phone;
form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!form.reportValidity() || submit.disabled) return;
  submit.disabled = true;
  submit.textContent = "Logger inn …";
  status.textContent = "";
  try {
    await loginUser();
    form.reset();
    window.location.assign(returnUrl.href);
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Kunne ikke logge inn. Prøv igjen.";
  } finally {
    submit.disabled = false;
    submit.textContent = "Logg inn";
  }
});
