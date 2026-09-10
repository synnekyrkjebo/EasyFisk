const zoneCard = document.querySelector("#zone-card");
const closeCard = document.querySelector(".close-card");

const fishingPlaces = [
  { zone: "Sone 1", name: "Sandnes fiskeri", area: "Nedre Mandalselva", lat: 58.020, lng: 7.462 },
  { zone: "Sone 1", name: "Piren med flere", area: "Nedre Mandalselva", lat: 58.044, lng: 7.475 },
  { zone: "Sone 2", name: "Bringsdal", area: "Mandal–Holum", lat: 58.069, lng: 7.489 },
  { zone: "Sone 2", name: "Furuholmen", area: "Mandal–Holum", lat: 58.089, lng: 7.500 },
  { zone: "Sone 2", name: "Smeland", area: "Mandal–Holum", lat: 58.109, lng: 7.508 },
  { zone: "Sone 2", name: "Bjørkenes", area: "Mandal–Holum", lat: 58.129, lng: 7.521 },
  { zone: "Sone 2", name: "Fuskeland", area: "Mandal–Holum", lat: 58.149, lng: 7.530 },
  { zone: "Sone 2", name: "Fossefjellene", area: "Mandal–Holum", lat: 58.169, lng: 7.539 },
  { zone: "Sone 2", name: "Øvre Holum", area: "Marnardal–Holum", lat: 58.189, lng: 7.548 },
  { zone: "Sone 2", name: "Heia", area: "Marnardal–Holum", lat: 58.209, lng: 7.557 },
  { zone: "Sone 2", name: "Holmegård", area: "Marnardal–Holum", lat: 58.229, lng: 7.566 },
  { zone: "Sone 2", name: "Møll", area: "Marnardal–Holum", lat: 58.249, lng: 7.575 },
  { zone: "Sone 2", name: "Nedre Holum", area: "Marnardal–Holum", lat: 58.269, lng: 7.584 },
  { zone: "Sone 2", name: "Nedre Nødig", area: "Marnardal–Holum", lat: 58.289, lng: 7.593 },
  { zone: "Sone 2", name: "Stoveland og Grimefossen", area: "Marnardal–Holum", lat: 58.309, lng: 7.602 },
  { zone: "Sone 3", name: "Mandalselva Sone 3", area: "Marnardal", lat: 58.335, lng: 7.612 },
  { zone: "Sone 4", name: "Felles Nord Manflåvann", area: "Manflåvann", lat: 58.365, lng: 7.621 },
  { zone: "Sone 4", name: "Laksehylen", area: "Øvre del av Mandalselva", lat: 58.390, lng: 7.629 },
  { zone: "Sone 4", name: "Lakseosen", area: "Øvre del av Mandalselva", lat: 58.415, lng: 7.637 },
  { zone: "Sone 4", name: "Strædethylen", area: "Øvre del av Mandalselva", lat: 58.440, lng: 7.645 },
  { zone: "Sone 4", name: "Nodehylen", area: "Øvre del av Mandalselva", lat: 58.465, lng: 7.653 },
  { zone: "Sone 4", name: "Bjåhylen", area: "Øvre del av Mandalselva", lat: 58.490, lng: 7.661 },
  { zone: "Sone 4", name: "Steinshylen", area: "Øvre del av Mandalselva", lat: 58.515, lng: 7.669 },
  { zone: "Sone 4", name: "Klevelandfossen", area: "Øvre del av Mandalselva", lat: 58.540, lng: 7.677 },
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

const riverCoordinates = fishingPlaces.map((place) => [place.lat, place.lng]);
L.polyline(riverCoordinates, {
  color: "#35a6da",
  weight: 5,
  opacity: 0.85,
}).addTo(map);

const zoneLabels = [
  { name: "Sone 1", lat: 58.050, lng: 7.535, className: "map-zone zone-label-1" },
  { name: "Sone 2", lat: 58.205, lng: 7.635, className: "map-zone zone-label-2" },
  { name: "Sone 3", lat: 58.335, lng: 7.680, className: "map-zone zone-label-3" },
  { name: "Sone 4", lat: 58.475, lng: 7.735, className: "map-zone zone-label-4" },
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
