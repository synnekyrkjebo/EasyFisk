const zoneCard = document.querySelector("#zone-card");
const closeCard = document.querySelector(".close-card");
const locationButton = document.querySelector(".location-button");
const markerLayer = document.querySelector("#fishing-markers");

const fishingPlaces = [
  { zone: "Sone 4", name: "Klevelandfossen", area: "Øvre del av Mandalselva", top: 5, left: 51 },
  { zone: "Sone 4", name: "Steinshylen", area: "Øvre del av Mandalselva", top: 8, left: 48 },
  { zone: "Sone 4", name: "Bjåhylen", area: "Øvre del av Mandalselva", top: 11, left: 50 },
  { zone: "Sone 4", name: "Nodehylen", area: "Øvre del av Mandalselva", top: 14, left: 47 },
  { zone: "Sone 4", name: "Strædethylen", area: "Øvre del av Mandalselva", top: 17, left: 49 },
  { zone: "Sone 4", name: "Lakseosen", area: "Øvre del av Mandalselva", top: 20, left: 46 },
  { zone: "Sone 4", name: "Laksehylen", area: "Øvre del av Mandalselva", top: 23, left: 48 },
  { zone: "Sone 4", name: "Felles Nord Manflåvann", area: "Manflåvann", top: 26, left: 45 },
  { zone: "Sone 3", name: "Mandalselva Sone 3", area: "Marnardal", top: 34, left: 47 },
  { zone: "Sone 2", name: "Stoveland og Grimefossen", area: "Marnardal–Holum", top: 41, left: 44 },
  { zone: "Sone 2", name: "Nedre Nødig", area: "Marnardal–Holum", top: 44, left: 46 },
  { zone: "Sone 2", name: "Nedre Holum", area: "Marnardal–Holum", top: 47, left: 43 },
  { zone: "Sone 2", name: "Møll", area: "Marnardal–Holum", top: 50, left: 45 },
  { zone: "Sone 2", name: "Holmegård", area: "Marnardal–Holum", top: 53, left: 42 },
  { zone: "Sone 2", name: "Heia", area: "Marnardal–Holum", top: 56, left: 44 },
  { zone: "Sone 2", name: "Øvre Holum", area: "Marnardal–Holum", top: 59, left: 41 },
  { zone: "Sone 2", name: "Fossefjellene", area: "Mandal–Holum", top: 63, left: 43 },
  { zone: "Sone 2", name: "Fuskeland", area: "Mandal–Holum", top: 67, left: 40 },
  { zone: "Sone 2", name: "Bjørkenes", area: "Mandal–Holum", top: 71, left: 42 },
  { zone: "Sone 2", name: "Smeland", area: "Mandal–Holum", top: 75, left: 39 },
  { zone: "Sone 2", name: "Furuholmen", area: "Mandal–Holum", top: 79, left: 40 },
  { zone: "Sone 2", name: "Bringsdal", area: "Mandal–Holum", top: 83, left: 37 },
  { zone: "Sone 1", name: "Piren med flere", area: "Nedre Mandalselva", top: 87, left: 39 },
  { zone: "Sone 1", name: "Sandnes fiskeri", area: "Nedre Mandalselva", top: 91, left: 35 },
];

fishingPlaces.forEach((place) => {
  const marker = document.createElement("button");
  marker.className = "pin";
  marker.type = "button";
  marker.style.top = place.top + "%";
  marker.style.left = place.left + "%";
  marker.setAttribute("aria-label", `${place.name}, ${place.zone}. Kjøp fiskekort`);

  marker.addEventListener("click", () => {
    document.querySelectorAll(".pin.selected").forEach((pin) => pin.classList.remove("selected"));
    marker.classList.add("selected");

    document.querySelector("#marker-zone").textContent = place.zone;
    document.querySelector("#marker-name").textContent = place.name;
    document.querySelector("#marker-area").textContent = place.area;
    document.querySelector("#marker-product").textContent =
      `Mandalselva ${place.zone} – ${place.name}`;

    zoneCard.classList.add("show");
    locationButton.hidden = true;
  });

  markerLayer.appendChild(marker);
});

closeCard.addEventListener("click", () => {
  zoneCard.classList.remove("show");
  locationButton.hidden = false;
  document.querySelectorAll(".pin.selected").forEach((pin) => pin.classList.remove("selected"));
});
