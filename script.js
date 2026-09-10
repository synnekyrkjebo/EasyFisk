const zoneCard = document.querySelector("#zone-card");
const closeCard = document.querySelector(".close-card");

const fishingPlaces = [
  { zone: "Sone 1", name: "Sandnes fiskeri", area: "Nedre Mandalselva", lat: 58.028, lng: 7.459 },
  { zone: "Sone 1", name: "Piren med flere", area: "Nedre Mandalselva", lat: 58.052, lng: 7.482 },
  { zone: "Sone 2", name: "Bringsdal", area: "Mandal–Holum", lat: 58.072, lng: 7.505 },
  { zone: "Sone 2", name: "Furuholmen", area: "Mandal–Holum", lat: 58.087, lng: 7.516 },
  { zone: "Sone 2", name: "Smeland", area: "Mandal–Holum", lat: 58.1, lng: 7.525 },
  { zone: "Sone 2", name: "Bjørkenes", area: "Mandal–Holum", lat: 58.114, lng: 7.529 },
  { zone: "Sone 2", name: "Fuskeland", area: "Mandal–Holum", lat: 58.13, lng: 7.535 },
  { zone: "Sone 2", name: "Fossefjellene", area: "Mandal–Holum", lat: 58.147, lng: 7.544 },
  { zone: "Sone 2", name: "Øvre Holum", area: "Marnardal–Holum", lat: 58.164, lng: 7.552 },
  { zone: "Sone 2", name: "Heia", area: "Marnardal–Holum", lat: 58.179, lng: 7.545 },
  { zone: "Sone 2", name: "Holmegård", area: "Marnardal–Holum", lat: 58.194, lng: 7.532 },
  { zone: "Sone 2", name: "Møll", area: "Marnardal–Holum", lat: 58.208, lng: 7.519 },
  { zone: "Sone 2", name: "Nedre Holum", area: "Marnardal–Holum", lat: 58.222, lng: 7.508 },
  { zone: "Sone 2", name: "Nedre Nødig", area: "Marnardal–Holum", lat: 58.237, lng: 7.503 },
  { zone: "Sone 2", name: "Stoveland og Grimefossen", area: "Marnardal–Holum", lat: 58.252, lng: 7.503 },
  { zone: "Sone 3", name: "Mandalselva Sone 3", area: "Marnardal", lat: 58.292, lng: 7.51 },
  { zone: "Sone 4", name: "Felles Nord Manflåvann", area: "Manflåvann", lat: 58.35, lng: 7.518 },
  { zone: "Sone 4", name: "Laksehylen", area: "Øvre del av Mandalselva", lat: 58.367, lng: 7.524 },
  { zone: "Sone 4", name: "Lakseosen", area: "Øvre del av Mandalselva", lat: 58.384, lng: 7.528 },
  { zone: "Sone 4", name: "Strædethylen", area: "Øvre del av Mandalselva", lat: 58.399, lng: 7.525 },
  { zone: "Sone 4", name: "Nodehylen", area: "Øvre del av Mandalselva", lat: 58.414, lng: 7.522 },
  { zone: "Sone 4", name: "Bjåhylen", area: "Øvre del av Mandalselva", lat: 58.429, lng: 7.52 },
  { zone: "Sone 4", name: "Steinshylen", area: "Øvre del av Mandalselva", lat: 58.445, lng: 7.517 },
  { zone: "Sone 4", name: "Klevelandfossen", area: "Øvre del av Mandalselva", lat: 58.462, lng: 7.514 },
];

const map = L.map("map-canvas", {
  zoomControl: true,
  minZoom: 8,
  maxZoom: 18,
}).setView([58.28, 7.57], 10);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap",
}).addTo(map);


const zoneLabels = [
  { name: "Sone 1", lat: 58.058, lng: 7.575, className: "map-zone zone-label-1" },
  { name: "Sone 2", lat: 58.175, lng: 7.615, className: "map-zone zone-label-2" },
  { name: "Sone 3", lat: 58.292, lng: 7.585, className: "map-zone zone-label-3" },
  { name: "Sone 4", lat: 58.405, lng: 7.585, className: "map-zone zone-label-4" },
];

zoneLabels.forEach((zone) => {
  L.marker([zone.lat, zone.lng], {
    interactive: false,
    icon: L.divIcon({
      className: zone.className,
      html: zone.name,
      iconSize: [62, 30],
      iconAnchor: [31, 15],
    }),
  }).addTo(map);
});

let selectedMarker;

fishingPlaces.forEach((place) => {
  const marker = L.circleMarker([place.lat, place.lng], {
    radius: 7,
    color: "#ffffff",
    weight: 2,
    fillColor: "#07513d",
    fillOpacity: 1,
  }).addTo(map);

  marker.bindTooltip(place.name, {
    direction: "right",
    offset: [8, 0],
  });

  marker.on("click", () => {
    if (selectedMarker) {
      selectedMarker.setStyle({ fillColor: "#07513d", radius: 7 });
    }

    selectedMarker = marker;
    marker.setStyle({ fillColor: "#ef9f2f", radius: 9 });

    document.querySelector("#marker-zone").textContent = place.zone;
    document.querySelector("#marker-name").textContent = place.name;
    document.querySelector("#marker-area").textContent = place.area;
    document.querySelector("#marker-product").textContent =
      `Mandalselva ${place.zone} – ${place.name}`;

    zoneCard.classList.add("show");
  });
});

map.fitBounds(fishingPlaces.map((place) => [place.lat, place.lng]), { padding: [30, 30] });

const locateControl = L.control({ position: "bottomright" });

locateControl.onAdd = () => {
  const button = L.DomUtil.create("button", "map-location-button");
  button.type = "button";
  button.title = "Finn min posisjon";
  button.setAttribute("aria-label", "Finn min posisjon");
  button.innerHTML = "⌖";
  L.DomEvent.disableClickPropagation(button);
  L.DomEvent.on(button, "click", () => map.locate({ setView: true, maxZoom: 14 }));
  return button;
};

locateControl.addTo(map);

map.on("locationfound", (event) => {
  L.circleMarker(event.latlng, {
    radius: 8,
    color: "#ffffff",
    weight: 3,
    fillColor: "#2878d0",
    fillOpacity: 1,
  }).addTo(map).bindTooltip("Din posisjon").openTooltip();
});

closeCard.addEventListener("click", () => {
  zoneCard.classList.remove("show");

  if (selectedMarker) {
    selectedMarker.setStyle({ fillColor: "#07513d", radius: 7 });
    selectedMarker = undefined;
  }
});
