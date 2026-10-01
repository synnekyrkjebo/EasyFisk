const TYPES = [
  { key: "disinfection", title: "Desinfiseringsbevis" },
  { key: "fee", title: "Statlig fiskeavgift", description: "Legg ved kvitteringen for betalt fiskeavgift." },
];
const DISINFECTION_STATIONS = [
  ["Ewen Maclean Martin", "Hesså, Bjelland", "96875874"],
  ["Grønberg Sport", "Vestre Strandgate 24, Kristiansand", "38027397"],
  ["Hans Gunnar Barikmo", "Manflå, Finsland", "90867211"],
  ["Haugelaks", "Holumsveien 1264/1262, Holum", "90266599"],
  ["Mandalselva Villakssenter", "Mjålandsveien 10, Marnardal", "94166725"],
  ["Nautic Marine", "Kirkeodden 1, Mandal", "38266500"],
  ["Roy Breilid", "Skjeggestad, Bjelland", "97541612"],
  ["Sandnes Camping", "Holumsveien 133, Mandal", "38265151"],
  ["Villmarkscamp", "Mjåland Gård, Marnardal", "90660209"],
];

function disinfectionInformation() {
  const details = document.createElement("details");
  details.className = "disinfection-information";
  const summary = document.createElement("summary");
  summary.textContent = "Hvor kan jeg desinfisere utstyret?";
  const text = document.createElement("p");
  text.textContent = "Fiskeutstyr må desinfiseres før fiske i Mandalselva for å hindre spredning av lakseparasitten Gyrodactylus salaris. Dette gjelder blant annet vadere, håv, stang og snelle. Du får et stempel på fiskekortet eller et eget oblat som dokumentasjon.";
  const list = document.createElement("ul");
  for (const [name, address, phone] of DISINFECTION_STATIONS) {
    const item = document.createElement("li");
    const heading = document.createElement("strong");
    heading.textContent = name;
    const location = document.createElement("span");
    location.textContent = address;
    const call = document.createElement("a");
    call.href = `tel:+47${phone}`;
    call.textContent = phone.replace(/(\d{2})(?=\d)/g, "$1 ");
    item.append(heading, location, call);
    list.append(item);
  }
  details.append(summary, text, list);
  return details;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

export function validateDocument(file) {
  if (!ACCEPTED.includes(file.type)) throw new Error("Velg et bilde (JPG, PNG, WebP eller GIF) eller en PDF.");
  if (!file.size || file.size > 10 * 1024 * 1024) throw new Error("Filen må være mellom 1 byte og 10 MB.");
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("easyfisk.documents", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("documents");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function documentRecord(key, file) {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction("documents", file ? "readwrite" : "readonly");
      const store = transaction.objectStore("documents");
      const request = file ? store.put({ file, name: file.name, uploadedAt: new Date().toISOString() }, key) : store.get(key);
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { db.close(); }
}

export async function showFishingDocuments(user) {
  const container = document.querySelector("#fishing-documents");
  container.hidden = false;
  const summary = document.querySelector("#documents-summary");
  const list = document.querySelector("#document-list");
  list.replaceChildren();
  const uploaded = new Set();
  const updateSummary = () => {
    summary.textContent = uploaded.size === TYPES.length
      ? "Begge dokumentene er lagt ved. Åpne dem for å vise dem til oppsyn. Kontroller at dokumentene gjelder for fisket ditt."
      : "Før du fisker, må du ha desinfiseringsbevis og ha betalt statlig fiskeavgift. Legg ved dokumentene her, så har du dem klare til oppsyn.";
  };
  updateSummary();
  for (const type of TYPES) {
    const key = `${user.email.toLowerCase()}:${type.key}`;
    const section = document.createElement("section");
    section.className = "document-card";
    const title = document.createElement("h3");
    title.textContent = type.title;
    const state = document.createElement("p");
    state.className = "document-state";
    state.textContent = "Henter dokument …";
    const content = document.createElement("div");
    const label = document.createElement("label");
    label.className = "account-button document-upload";
    const labelText = document.createElement("span");
    labelText.textContent = "Legg til dokument";
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ACCEPTED.join(",");
    input.setAttribute("aria-label", `Last opp ${type.title.toLowerCase()}`);
    label.append(labelText, input);
    const help = document.createElement("p");
    help.className = "account-status";
    help.textContent = `${type.description || "Last opp bilde av stemplet fiskekort eller oblat, eller legg ved desinfiseringsbeviset."} Bilde eller PDF, maks 10 MB.`;
    const status = document.createElement("p");
    status.className = "account-status";
    status.setAttribute("role", "status");
    section.append(title, state, content, label, help, status);
    if (type.key === "disinfection") section.append(disinfectionInformation());
    list.append(section);
    let objectUrl;
    function render(record) {
      content.replaceChildren();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = null;
      if (!record?.file) {
        state.textContent = "Mangler dokument";
        return;
      }
      uploaded.add(type.key);
      state.textContent = "Dokument lagt ved";
      labelText.textContent = "Bytt dokument";
      objectUrl = URL.createObjectURL(record.file);
      if (record.file.type.startsWith("image/")) {
        const image = document.createElement("img");
        image.className = "document-image";
        image.src = objectUrl;
        image.alt = type.title;
        content.append(image);
      }
      const name = document.createElement("p");
      name.className = "account-status document-filename";
      name.textContent = record.name;
      const link = document.createElement("a");
      link.className = "account-button";
      link.href = objectUrl;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Vis til oppsyn";
      content.append(name, link);
      updateSummary();
    }
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;
      status.textContent = "";
      try {
        validateDocument(file);
        input.disabled = true;
        status.textContent = "Lagrer dokument …";
        await documentRecord(key, file);
        render({ file, name: file.name });
        status.textContent = "Dokumentet er lagret.";
      } catch (error) {
        status.textContent = error instanceof Error && error.name === "Error"
          ? error.message : "Kunne ikke lagre dokumentet. Prøv igjen.";
      } finally {
        input.disabled = false;
        input.value = "";
      }
    });
    try { render(await documentRecord(key)); }
    catch { state.textContent = "Kunne ikke hente dokumentet. Last opp på nytt eller prøv igjen."; }
    window.addEventListener("pagehide", () => { if (objectUrl) URL.revokeObjectURL(objectUrl); }, { once: true });
  }
}

export async function hasFishingDocuments(user) {
  const records = await Promise.all(TYPES.map(type => documentRecord(`${user.email.toLowerCase()}:${type.key}`)));
  return records.every(record => Boolean(record?.file));
}
