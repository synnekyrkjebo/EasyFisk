// Eksempelinnlogging for prototypen. Ingen ekte konto, passord eller betaling.
const PROFILE_KEY = "easyfisk.demo.profile";
const SESSION_KEY = "easyfisk.demo.signed-in";
const ROLE_KEY = "easyfisk.demo.role";
const OWNER_KEY = "easyfisk.demo.owner-account";
const LANDOWNERS = Object.fromEntries(['a','b','c','p'].map((id,index)=>[id,{accountId:id,name:`Grunneier Holmesland ${id.toUpperCase()}`,email:`holmesland-${id}@easyfisk.no`,phone:`9000001${index}`,role:'landowner',managedPlaces:[`Holmesland ${id.toUpperCase()}`]}]));
export function getLandownerAccounts(){return Object.values(LANDOWNERS).map(account=>({...account,managedPlaces:[...account.managedPlaces]}));}
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
    if(sessionStorage.getItem(ROLE_KEY)==='landowner'){
      const account=LANDOWNERS[sessionStorage.getItem(OWNER_KEY)||'a'];
      return account?{...account,managedPlaces:[...account.managedPlaces]}:null;
    }
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
    sessionStorage.removeItem(OWNER_KEY);
  } catch { throw new Error("Kunne ikke lagre innloggingen. Prøv igjen."); }
}

export async function loginUser(role='fisher',accountId='a') {
  if(!['fisher','landowner'].includes(role))throw new Error('Velg en gyldig rolle.');
  if(role==='landowner'&&!Object.hasOwn(LANDOWNERS,accountId))throw new Error('Velg en gyldig grunneierkonto.');
  try {
    if(role==='landowner')sessionStorage.setItem(OWNER_KEY,accountId);else sessionStorage.removeItem(OWNER_KEY);
    sessionStorage.setItem(ROLE_KEY,role);sessionStorage.setItem(SESSION_KEY, "true");
  }
  catch { throw new Error("Kunne ikke lagre innloggingen. Prøv igjen."); }
}

export async function logoutUser() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(ROLE_KEY);
  sessionStorage.removeItem(OWNER_KEY);
}

export function authReturnUrl(currentUrl) {
  const current = new URL(currentUrl);
  const fallback = new URL("kjop.html", current);
  const returnTo = current.searchParams.get("tilbake");
  if (!returnTo) return fallback;
  try {
    const candidate = new URL(returnTo, current);
    const allowed = ["bestilling.html", "fiskekort.html", "minside.html", "loggfor.html", "feed.html", "statistikk.html", "grunneier.html"].map(page => new URL(page, current).pathname);
    if (candidate.origin === current.origin && allowed.includes(candidate.pathname)) return candidate;
  } catch { /* Bruk kalenderen hvis returadressen er ugyldig. */ }
  return fallback;
}

export function landownerLoginUrl(currentUrl) {
  const current=new URL(currentUrl);
  const role=current.searchParams.get('rolle');
  const destination=authReturnUrl(currentUrl);
  if(role==='landowner'||destination.pathname.endsWith('/grunneier.html'))return new URL('grunneier-logginn.html',current);
  return null;
}
