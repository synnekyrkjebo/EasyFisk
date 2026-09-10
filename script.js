const zoneCard = document.querySelector("#zone-card");
const zoneTitle = document.querySelector("#zone-title");
const closeCard = document.querySelector(".close-card");
const locationButton = document.querySelector(".location-button");
const phone = document.querySelector(".phone");

document.querySelectorAll(".zone").forEach((button) => {
  button.addEventListener("click", () => {
    zoneTitle.textContent = button.dataset.zone;
    zoneCard.classList.add("show");
    locationButton.hidden = true;
  });
});

closeCard.addEventListener("click", () => {
  zoneCard.classList.remove("show");
  locationButton.hidden = false;
});

function showToast(message) {
  let toast = document.querySelector(".toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    phone.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

locationButton.addEventListener("click", () => {
  showToast("Posisjonen din vises her senere");
});

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", (event) => {
    const label = item.querySelector("span").textContent;

    if (label !== "Kart") {
      event.preventDefault();
      showToast(label + " bygger vi som neste side");
    }
  });
});
