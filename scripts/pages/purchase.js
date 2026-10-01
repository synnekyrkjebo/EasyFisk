import { addDays, firstBookableDay, monthDays, exampleAvailability } from "../shared/purchase-calendar.js";
import { readBooking, bookingUrl } from "../shared/booking.js";

const placeSelect = document.querySelector("#place-select");
const calendar = document.querySelector("#calendar-days");
const monthHeading = document.querySelector("#calendar-month");
const previousButton = document.querySelector("#previous-month");
const selectedList = document.querySelector("#selected-days");
const selectedDates = new Set();
const groupTicket = document.querySelector("#group-ticket");
const groupSize = document.querySelector("#group-size");
const continueButton = document.querySelector("#continue-purchase");

function requiredPlaces() {
  return groupTicket.checked ? Number(groupSize.value) : 1;
}
const requestedPlace = new URLSearchParams(window.location.search).get("sted");
const minimumDay = firstBookableDay();
let year = Number(minimumDay.slice(0, 4));
let month = Number(minimumDay.slice(5, 7)) - 1;

const longDate = new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const monthDate = new Intl.DateTimeFormat("nb-NO", { month: "long", year: "numeric", timeZone: "UTC" });
const shortDate = new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "short", timeZone: "UTC" });
const asDate = key => new Date(`${key}T12:00:00Z`);

for (const place of fishingPlaces) {
  const option = document.createElement("option");
  option.value = place.name;
  const name = place.name === "Mandalselva Sone 3" ? "Mandalselva" : place.name;
  option.textContent = `${place.zone} – ${name}`;
  placeSelect.append(option);
}
const chosenPlace = fishingPlaces.find(place => place.name === requestedPlace);
const searchMode = !chosenPlace;
let showingResults = false;
if (searchMode) {
  document.querySelector("#place-picker").hidden = true;
  document.querySelector("#search-heading").hidden = false;
  document.querySelector("#search-intro").hidden = false;
  document.querySelector(".back-link").href = "fiskekort.html";
  document.querySelector(".back-link").setAttribute("aria-label", "Tilbake til fiskekort");
  document.querySelector(".calendar-legend").hidden = true;
  document.querySelector(".calendar-help").textContent = "Trykk på dagene du vil fiske. Vi finner soner med plass til alle fiskerne på alle de valgte dagene.";
  continueButton.textContent = "Vis tilgjengelige soner";
}
if (chosenPlace) {
  placeSelect.value = chosenPlace.name;
  document.querySelector("#place-picker").hidden = true;
  const heading = document.querySelector("#chosen-place");
  const name = chosenPlace.name === "Mandalselva Sone 3" ? "Mandalselva" : chosenPlace.name;
  heading.textContent = `${chosenPlace.zone} – ${name}`;
  heading.hidden = false;
}

const restoredBooking = readBooking(new URLSearchParams(window.location.search), fishingPlaces);
if (restoredBooking) {
  groupTicket.checked = restoredBooking.type === "group";
  document.querySelector("#single-ticket").checked = !groupTicket.checked;
  if (groupTicket.checked) groupSize.value = String(restoredBooking.people);
  restoredBooking.dates.forEach(key => selectedDates.add(key));
  year = Number(restoredBooking.dates[0].slice(0, 4));
  month = Number(restoredBooking.dates[0].slice(5, 7)) - 1;
}

function availability(key) {
  if (searchMode) {
    const remaining = Math.max(...fishingPlaces.map(place => exampleAvailability(place.name, key).remaining));
    return { total: 4, booked: 4 - remaining, remaining };
  }
  return exampleAvailability(placeSelect.value, key);
}

function toggleDay(key) {
  if (key < firstBookableDay() || availability(key).remaining < requiredPlaces()) return;
  if (selectedDates.has(key)) selectedDates.delete(key);
  else selectedDates.add(key);
  renderCalendar();
  renderSelection();
  calendar.querySelector(`[data-date="${key}"]`)?.focus();
}

function renderCalendar() {
  monthHeading.textContent = monthDate.format(new Date(Date.UTC(year, month, 1)));
  previousButton.disabled = `${year}-${String(month + 1).padStart(2, "0")}` <= firstBookableDay().slice(0, 7);
  calendar.replaceChildren();
  const { offset, dates } = monthDays(year, month);
  for (let i = 0; i < offset; i++) {
    const spacer = document.createElement("span");
    spacer.setAttribute("aria-hidden", "true");
    calendar.append(spacer);
  }
  for (const key of dates) {
    const { total, booked, remaining } = availability(key);
    const expired = key < firstBookableDay();
    const selected = selectedDates.has(key);
    const insufficient = remaining > 0 && remaining < requiredPlaces();
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.date = key;
    button.className = `calendar-day${!remaining ? " is-full" : ""}${insufficient ? " is-insufficient" : ""}${expired ? " is-past" : ""}${selected ? " is-selected" : ""}`;
    button.disabled = expired || remaining < requiredPlaces();
    button.setAttribute("aria-pressed", String(selected));
    button.setAttribute("aria-label", `${longDate.format(asDate(key))}, ${booked} av ${total} plasser tatt, ${expired ? "passert" : !remaining ? "fullt" : insufficient ? `${remaining} ledige, for få plasser til ${requiredPlaces()} fiskere` : `${remaining} ledige`}`);
    if (searchMode) button.setAttribute("aria-label", `${longDate.format(asDate(key))}${expired ? ", passert" : ""}`);
    const day = document.createElement("span");
    day.className = "day-number";
    day.textContent = String(Number(key.slice(-2)));
    const count = document.createElement("span");
    count.className = "day-capacity";
    count.textContent = searchMode ? "" : expired ? "–" : `${booked}/${total}`;
    button.append(day, count);
    button.addEventListener("click", () => toggleDay(key));
    calendar.append(button);
  }
}

function renderSelection() {
  selectedList.replaceChildren();
  for (const key of [...selectedDates].sort()) {
    const { total, booked } = availability(key);
    const item = document.createElement("li");
    const text = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = `${shortDate.format(asDate(key))} kl. 18.00`;
    const end = document.createElement("span");
    end.textContent = `til ${shortDate.format(asDate(addDays(key, 1)))} kl. 17.59`;
    const capacity = document.createElement("span");
    capacity.className = "selected-capacity";
    capacity.textContent = `${booked} av ${total} plasser tatt`;
    text.append(title, end);
    if (!searchMode) text.append(capacity);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Fjern ${longDate.format(asDate(key))}`);
    remove.addEventListener("click", () => {
      selectedDates.delete(key);
      renderCalendar();
      renderSelection();
      calendar.querySelector(`[data-date="${key}"]`)?.focus();
    });
    item.append(text, remove);
    selectedList.append(item);
  }
  document.querySelector("#selection-empty").hidden = selectedDates.size > 0;
  document.querySelector("#selection-total").textContent = selectedDates.size
    ? `${selectedDates.size} fiskedøgn valgt · ${requiredPlaces()} ${requiredPlaces() === 1 ? "fiskeplass" : "fiskeplasser"} per døgn${groupTicket.checked ? " · Gruppekort" : ""}` : "";
  continueButton.disabled = selectedDates.size === 0;
  if (searchMode && showingResults) renderResults();
}

function updateTicket() {
  document.querySelector("#group-options").hidden = !groupTicket.checked;
  document.querySelector("#ticket-help").textContent = groupTicket.checked
    ? `Velg dager med minst ${requiredPlaces()} ledige plasser. Én plass per fisker.`
    : "Døgnkort gjelder for én fisker.";
  let removed = 0;
  for (const key of selectedDates) {
    if (key < firstBookableDay() || availability(key).remaining < requiredPlaces()) {
      selectedDates.delete(key);
      removed++;
    }
  }
  document.querySelector("#selection-update").textContent = removed
    ? `${removed} ${removed === 1 ? "dag ble fjernet" : "dager ble fjernet"} fra valget fordi det ikke er nok ledige plasser.` : "";
  renderCalendar();
  renderSelection();
}

document.querySelector("#single-ticket").addEventListener("change", updateTicket);
groupTicket.addEventListener("change", updateTicket);
groupSize.addEventListener("change", updateTicket);

continueButton.addEventListener("click", () => {
  updateTicket();
  if (!selectedDates.size) return;
  if (searchMode) {
    showingResults = true;
    renderResults();
    document.querySelector("#zone-results").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const booking = {
    place: fishingPlaces.find(place => place.name === placeSelect.value),
    type: groupTicket.checked ? "group" : "single",
    people: requiredPlaces(),
    dates: [...selectedDates].sort(),
  };
  window.location.assign(bookingUrl("bestilling.html", booking, window.location.href).href);
});

function changeMonth(step) {
  const date = new Date(Date.UTC(year, month + step, 1));
  year = date.getUTCFullYear();
  month = date.getUTCMonth();
  renderCalendar();
}
previousButton.addEventListener("click", () => changeMonth(-1));
document.querySelector("#next-month").addEventListener("click", () => changeMonth(1));
placeSelect.addEventListener("change", () => {
  selectedDates.clear();
  document.querySelector("#selection-update").textContent = "";
  const url = new URL(window.location.href);
  url.searchParams.set("sted", placeSelect.value);
  window.history.replaceState(null, "", url);
  renderCalendar();
  renderSelection();
});
updateTicket();

function renderResults() {
  const section = document.querySelector("#zone-results");
  const list = document.querySelector("#zone-result-list");
  const dates = [...selectedDates].sort();
  section.hidden = !dates.length;
  list.replaceChildren();
  if (!dates.length) return;
  const available = fishingPlaces.filter(place => dates.every(key => key >= firstBookableDay()
    && exampleAvailability(place.name, key).remaining >= requiredPlaces()));
  document.querySelector("#results-status").textContent = available.length
    ? `${available.length} soner med plass til ${requiredPlaces()} ${requiredPlaces() === 1 ? "fisker" : "fiskere"} på alle valgte fiskedøgn.`
    : "Ingen soner har nok plass på alle valgte fiskedøgn. Prøv andre dager eller færre fiskere.";
  for (const place of available) {
    const card = document.createElement("article");
    card.className = "zone-result-card";
    const photo = inaturOffers[place.name]?.[0]?.images?.[0];
    if (photo) {
      const image = document.createElement("img");
      image.src = photo.src;
      image.alt = place.name;
      image.loading = "lazy";
      card.append(image);
    }
    const body = document.createElement("div");
    const heading = document.createElement("h3");
    heading.textContent = `${place.zone} – ${place.name === "Mandalselva Sone 3" ? "Mandalselva" : place.name}`;
    const area = document.createElement("p");
    area.textContent = place.area;
    const capacity = document.createElement("p");
    const minimum = Math.min(...dates.map(key => exampleAvailability(place.name, key).remaining));
    capacity.textContent = `Minst ${minimum} av 4 plasser ledige per fiskedøgn`;
    const link = document.createElement("a");
    link.className = "continue-button";
    link.textContent = "Velg sone";
    link.href = bookingUrl("kjop.html", { place, dates, people: requiredPlaces(), type: groupTicket.checked ? "group" : "single" }, window.location.href).href;
    body.append(heading, area, capacity, link);
    card.append(body);
    list.append(card);
  }
}
