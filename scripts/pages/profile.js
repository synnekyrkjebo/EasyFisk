import { getCurrentUser } from "../shared/auth.js";

for (const [id, page] of [["#profile-login", "logginn.html"], ["#profile-signup", "registrer.html"]]) {
  const url = new URL(page, window.location.href);
  url.searchParams.set("tilbake", window.location.pathname);
  document.querySelector(id).href = url.href;
}

getCurrentUser().then(user => {
  document.querySelector("#profile-guest").hidden = Boolean(user);
  document.querySelector("#profile-account").hidden = !user;
  if (!user) return;
  document.querySelector("#profile-name").textContent = user.name;
  document.querySelector("#profile-email").textContent = user.email;
  document.querySelector("#profile-phone").textContent = user.phone || "Ikke registrert";
}).catch(() => {
  document.querySelector("#profile-guest").hidden = false;
  document.querySelector("#profile-status").textContent = "Kunne ikke hente profilen. Prøv å logge inn igjen.";
});
