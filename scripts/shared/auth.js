// Eksempelinnlogging for prototypen. Ingen ekte konto, passord eller betaling.
const PROFILE_KEY = "easyfisk.demo.profile";
const SESSION_KEY = "easyfisk.demo.signed-in";
const ROLE_KEY = "easyfisk.demo.role";
const LANDOWNER = {name:"Grunneier Holmesland",email:"grunneier@easyfisk.no",phone:"90000010",role:"landowner",managedPlaces:["Holmesland A","Holmesland B","Holmesland C","Holmesland P"]};
const EXAMPLE_USER = { name: "Ola Nordmann", email: "demo@easyfisk.no", phone: "90000000" };

export function getDemoProfile() {
  try {
    const profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
    if (profile && typeof profile.name === "string" && typeof profile.email === "string" && typeof profile.phone === "string") return profile;
  } catch { /* Bruk standardprofilen hvis lagrede eksempeldata ikke kan leses. */ }
  return { ...EXAMPLE_USER };
}

export async function getCurrentUser() {
  try {
    if(sessionStorage.getItem(SESSION_KEY)!=='true')return null;
    if(sessionStorage.getItem(ROLE_KEY)==='landowner')return {...LANDOWNER,managedPlaces:[...LANDOWNER.managedPlaces]};
    return {...getDemoProfile(),role:'fisher',managedPlaces:[]};
  }
  catch { return null; }
}

export async function registerUser(details) {
  const name = typeof details.name === "string" ? details.name.trim() : "";
  const email = typeof details.email === "string" ? details.email.trim().toLowerCase() : "";
  const phone = typeof details.phone === "string" ? details.phone.trim() : "";
  if (name.length < 2 || name.length > 120) throw new Error("Skriv inn fullt navn.");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Skriv inn en gyldig e-postadresse.");
  if (!/^[+\d\s()-]+$/.test(phone) || phone.length > 30 || phone.replace(/\D/g, "").length < 6) throw new Error("Skriv inn et gyldig telefonnummer.");
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ name, email, phone }));
    sessionStorage.setItem(SESSION_KEY, "true");
    sessionStorage.setItem(ROLE_KEY, "fisher");
  } catch { throw new Error("Kunne ikke lagre innloggingen. Prøv igjen."); }
}

export async function loginUser(role='fisher') {
  if(!['fisher','landowner'].includes(role))throw new Error('Velg en gyldig rolle.');
  try { sessionStorage.setItem(ROLE_KEY,role);sessionStorage.setItem(SESSION_KEY, "true"); }
  catch { throw new Error("Kunne ikke lagre innloggingen. Prøv igjen."); }
}

export async function logoutUser() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(ROLE_KEY);
}

export function authReturnUrl(currentUrl) {
  const current = new URL(currentUrl);
  const fallback = new URL("kjop.html", current);
  const returnTo = current.searchParams.get("tilbake");
  if (!returnTo) return fallback;
  try {
    const candidate = new URL(returnTo, current);
    const allowed = ["bestilling.html", "fiskekort.html", "minside.html", "loggfor.html", "feed.html", "statistikk.html"].map(page => new URL(page, current).pathname);
    if (candidate.origin === current.origin && allowed.includes(candidate.pathname)) return candidate;
  } catch { /* Bruk kalenderen hvis returadressen er ugyldig. */ }
  return fallback;
}
