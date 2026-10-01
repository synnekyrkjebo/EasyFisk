const zoneCard = document.querySelector("#zone-card");
const closeCard = document.querySelector(".close-card");
const readMoreButton = document.querySelector("#read-more-button");
const zoneDetails = document.querySelector("#zone-details");
const zoneOffers = document.querySelector("#zone-offers");
const buyButton = document.querySelector("#buy-button");
let selectedPlace;

buyButton.addEventListener("click", () => {
  if (!selectedPlace) return;
  const purchaseUrl = new URL("kjop.html", window.location.href);
  purchaseUrl.searchParams.set("sted", selectedPlace.name);
  window.location.assign(purchaseUrl.href);
});

function renderOffers(place) {
  const offers = inaturOffers[place.name];
  zoneOffers.replaceChildren();

  offers.forEach((offer) => {
    const article = document.createElement("article");
    article.className = "zone-offer";
    if (offers.length > 1) {
      const title = document.createElement("h3");
      title.textContent = offer.title.split(",").pop().trim();
      article.append(title);
    }

    const gallery = document.createElement("div");
    gallery.className = "zone-gallery";
    gallery.setAttribute("role", "region");
    gallery.setAttribute("aria-label", `Bilder fra ${offer.title}`);
    gallery.tabIndex = 0;
    offer.images.forEach((photo, index) => {
      const figure = document.createElement("figure");
      const image = document.createElement("img");
      image.src = photo.src;
      image.alt = photo.alt;
      image.loading = "lazy";
      image.decoding = "async";
      image.addEventListener("error", () => figure.remove());
      const caption = document.createElement("figcaption");
      caption.textContent = `Bilde ${index + 1} av ${offer.images.length} · Inatur`;
      figure.append(image, caption);
      gallery.append(figure);
    });
    if (offer.images.length) article.append(gallery);

    const description = document.createElement("p");
    description.textContent = offer.description;
    const source = document.createElement("a");
    source.href = offer.sourceUrl;
    source.target = "_blank";
    source.rel = "noopener noreferrer";
    source.textContent = "Bilder og oppdaterte regler på Inatur ↗";
    article.append(description, source);
    zoneOffers.append(article);
  });
}

function setCardExpanded(expanded) {
  zoneCard.classList.toggle("zone-card--expanded", expanded);
  readMoreButton.setAttribute("aria-expanded", String(expanded));
  readMoreButton.textContent = expanded ? "Vis mindre" : "Les mer";
  zoneDetails.hidden = !expanded;
  if (!expanded) zoneCard.scrollTop = 0;
}

readMoreButton.addEventListener("click", () => {
  setCardExpanded(readMoreButton.getAttribute("aria-expanded") !== "true");
});



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
    selectedPlace = place;
    marker.setStyle({ fillColor: "#ef9f2f", radius: 9 });

    document.querySelector("#marker-zone").textContent = place.zone;
    document.querySelector("#marker-name").textContent =
      place.name === "Mandalselva Sone 3" ? "Mandalselva" : place.name;
    document.querySelector("#marker-area").textContent = place.area;
    renderOffers(place);

    setCardExpanded(false);

    zoneCard.classList.add("show");
  });
});

map.fitBounds(fishingPlaces.map((place) => [place.lat, place.lng]), { padding: [30, 30] });

let userLocationMarker;
let centerOnNextLocation = false;
const locateControl = L.control({ position: "bottomright" });

locateControl.onAdd = () => {
  const button = L.DomUtil.create("button", "map-location-button");
  button.type = "button";
  button.title = "Finn min posisjon";
  button.setAttribute("aria-label", "Finn min posisjon");
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>';
  L.DomEvent.disableClickPropagation(button);
  L.DomEvent.on(button, "click", () => {
    centerOnNextLocation = true;
    map.stopLocate();
    map.locate({ watch: true, enableHighAccuracy: true, setView: false });
  });
  return button;
};

locateControl.addTo(map);

map.on("locationfound", (event) => {
  if (userLocationMarker) {
    userLocationMarker.setLatLng(event.latlng);
  } else {
    userLocationMarker = L.circleMarker(event.latlng, {
      radius: 8,
      color: "#ffffff",
      weight: 3,
      fillColor: "#2878d0",
      fillOpacity: 1,
    }).addTo(map).bindTooltip("Din posisjon").openTooltip();
  }
  if (centerOnNextLocation) {
    map.setView(event.latlng, 14);
    centerOnNextLocation = false;
  }
});

window.addEventListener("pagehide", () => map.stopLocate());

closeCard.addEventListener("click", () => {
  zoneCard.classList.remove("show");
  setCardExpanded(false);

  if (selectedMarker) {
    selectedMarker.setStyle({ fillColor: "#07513d", radius: 7 });
    selectedMarker = undefined;
  }
});
