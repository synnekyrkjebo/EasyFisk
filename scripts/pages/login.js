import { loginUser, getDemoProfile, authReturnUrl } from "../shared/auth.js";

const returnUrl = authReturnUrl(window.location.href);
document.querySelector("#login-back").href = returnUrl.href;
const signupUrl = new URL("registrer.html", window.location.href);
signupUrl.searchParams.set("tilbake", returnUrl.pathname + returnUrl.search);
document.querySelector("#signup-link").href = signupUrl.href;
const form = document.querySelector("#login-form");
const submit = document.querySelector("#login-submit");
const status = document.querySelector("#login-status");
const profile = getDemoProfile();
const role=document.querySelector('#login-role');
role.addEventListener('change',()=>{
 const owner=role.value==='landowner';
 document.querySelector('#demo-name').textContent=owner?'Grunneier Holmesland':profile.name;
 document.querySelector('#demo-email').textContent=owner?'grunneier@easyfisk.no':profile.email;
 document.querySelector('#demo-phone').textContent=owner?'90000010':profile.phone;
});
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
    const owner=role.value==='landowner';
    await loginUser(role.value);
    form.reset();
    window.location.assign(owner?new URL('minside.html',location.href).href:returnUrl.href);
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Kunne ikke logge inn. Prøv igjen.";
  } finally {
    submit.disabled = false;
    submit.textContent = "Logg inn";
  }
});
