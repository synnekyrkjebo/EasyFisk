const zoneCard = document.querySelector("#zone-card");
const closeCard = document.querySelector(".close-card");
const locationButton = document.querySelector(".location-button");

const zoneInfo = {
  "Sone 1": {
    area: "Mandal–Holum",
    status: "Åpen for fiske",
    catches: 37,
    salmon: 23,
    trout: 14,
    rule: "Døgnkvote: 1 laks per fisker",
  },
  "Sone 2": {
    area: "Holum–Øyslebø",
    status: "Åpen for fiske",
    catches: 42,
    salmon: 28,
    trout: 14,
    rule: "Døgnkvote: 1 laks per fisker",
  },
  "Sone 3": {
    area: "Øyslebø–Marnardal",
    status: "Åpen for fiske",
    catches: 31,
    salmon: 19,
    trout: 12,
    rule: "Husk gyldig fiskekort og desinfiseringsbevis",
  },
  "Sone 4": {
    area: "Marnardal–Sveindal",
    status: "Åpen for fiske",
    catches: 24,
    salmon: 15,
    trout: 9,
    rule: "Kontroller lokale regler før fisket starter",
  },
};

document.querySelectorAll(".zone").forEach((button) => {
  button.addEventListener("click", () => {
    const name = button.dataset.zone;
    const info = zoneInfo[name];

    document.querySelector("#zone-title").textContent = name;
    document.querySelector("#zone-area").textContent = info.area;
    document.querySelector("#zone-status").textContent = info.status;
    document.querySelector("#zone-catches").textContent = info.catches;
    document.querySelector("#zone-salmon").textContent = info.salmon;
    document.querySelector("#zone-trout").textContent = info.trout;
    document.querySelector("#zone-rule").textContent = info.rule;

    zoneCard.classList.add("show");
    locationButton.hidden = true;
  });
});

closeCard.addEventListener("click", () => {
  zoneCard.classList.remove("show");
  locationButton.hidden = false;
});
