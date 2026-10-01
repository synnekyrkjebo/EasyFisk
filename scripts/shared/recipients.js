const EXAMPLE_FRIENDS = [
  { id: "kari", name: "Kari Hansen", email: "kari@example.com", phone: "90000001" },
  { id: "per", name: "Per Olsen", email: "per@example.com", phone: "90000002" },
  { id: "anne", name: "Anne Berg", email: "anne@example.com", phone: "90000003" },
];

export function searchFriends(query) {
  const text = query.trim().toLocaleLowerCase("nb-NO");
  return EXAMPLE_FRIENDS.filter(friend => `${friend.name} ${friend.email}`.toLocaleLowerCase("nb-NO").includes(text));
}

export function createRecipientField(number, onChange = () => {}) {
  const field = document.createElement("fieldset");
  field.className = "recipient-field";
  field.id = `fisher-field-${number}`;
  const legend = document.createElement("legend");
  legend.textContent = `Fisker ${number}`;
  const mode = document.createElement("select");
  mode.className = "checkout-input";
  mode.setAttribute("aria-label", `Velg hvordan du legger til fisker ${number}`);
  for (const [value, label] of [["friend", "Velg en venn"], ["manual", "Legg inn opplysninger"]]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    mode.append(option);
  }
  const friends = document.createElement("div");
  const searchLabel = document.createElement("label");
  searchLabel.className = "checkout-label";
  searchLabel.htmlFor = `friend-search-${number}`;
  searchLabel.textContent = "Søk etter en venn";
  const search = document.createElement("input");
  search.id = searchLabel.htmlFor;
  search.className = "checkout-input";
  search.type = "search";
  search.placeholder = "Navn eller e-post";
  search.autocomplete = "off";
  search.setAttribute("role", "combobox");
  search.setAttribute("aria-autocomplete", "list");
  search.setAttribute("aria-expanded", "false");
  const results = document.createElement("div");
  results.className = "friend-results";
  results.id = `friend-results-${number}`;
  results.hidden = true;
  results.setAttribute("role", "listbox");
  results.setAttribute("aria-label", "Venner");
  search.setAttribute("aria-controls", results.id);
  const searchControl = document.createElement("div");
  searchControl.className = "friend-search-control";
  searchControl.append(search, results);
  const selected = document.createElement("p");
  selected.className = "account-status";
  selected.setAttribute("role", "status");
  friends.append(searchLabel, searchControl, selected);
  const manual = document.createElement("div");
  const inputs = {};
  for (const [key, labelText, type, required] of [
    ["name", "Fullt navn", "text", true], ["email", "E-post for fiskekortet", "email", true], ["phone", "Telefonnummer (valgfritt)", "tel", false],
  ]) {
    const label = document.createElement("label");
    label.className = "checkout-label";
    label.htmlFor = `fisher-${number}-${key}`;
    label.textContent = labelText;
    const input = document.createElement("input");
    input.id = label.htmlFor;
    input.name = `fisher${number}${key}`;
    input.className = "checkout-input";
    input.type = type;
    input.required = required;
    input.maxLength = key === "email" ? 254 : key === "phone" ? 30 : 120;
    input.autocomplete = "off";
    inputs[key] = input;
    manual.append(label, input);
  }
  field.append(legend, mode, friends, manual);
  let chosenFriend = null;
  let active = true;
  let options = [];
  let activeIndex = -1;

  function closeResults() {
    results.hidden = true;
    search.setAttribute("aria-expanded", "false");
    search.removeAttribute("aria-activedescendant");
    activeIndex = -1;
  }
  function chooseFriend(friend) {
    chosenFriend = friend;
    search.value = friend.name;
    search.setCustomValidity("");
    selected.textContent = `${friend.name} · ${friend.email}`;
    closeResults();
    onChange();
  }
  function highlightOption(index) {
    activeIndex = index;
    options.forEach(({ button }, i) => button.setAttribute("aria-selected", String(i === index)));
    const button = options[index]?.button;
    if (button) {
      search.setAttribute("aria-activedescendant", button.id);
      button.scrollIntoView({ block: "nearest" });
    }
  }

  function renderResults() {
    if (!active || mode.value !== "friend") return;
    results.replaceChildren();
    options = [];
    activeIndex = -1;
    search.removeAttribute("aria-activedescendant");
    results.hidden = false;
    search.setAttribute("aria-expanded", "true");
    const matches = searchFriends(chosenFriend ? "" : search.value);
    for (const friend of matches) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "friend-choice";
      button.id = `friend-option-${number}-${friend.id}`;
      button.tabIndex = -1;
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", "false");
      const name = document.createElement("strong");
      name.textContent = friend.name;
      const email = document.createElement("span");
      email.textContent = friend.email;
      button.append(name, email);
      button.addEventListener("pointerdown", event => event.preventDefault());
      button.addEventListener("click", () => chooseFriend(friend));
      options.push({ button, friend });
      results.append(button);
    }
    if (!matches.length) {
      const empty = document.createElement("p");
      empty.className = "account-status";
      empty.textContent = "Ingen venner funnet. Velg «Legg inn opplysninger» for å legge til personen.";
      results.append(empty);
    }
  }
  function updateMode() {
    const isFriend = mode.value === "friend";
    friends.hidden = !isFriend;
    manual.hidden = isFriend;
    search.disabled = !active || !isFriend;
    search.required = active && isFriend;
    search.setCustomValidity(active && isFriend && !chosenFriend ? "Velg en venn fra søkeresultatet." : "");
    for (const input of Object.values(inputs)) input.disabled = !active || isFriend;
    closeResults();
  }
  mode.addEventListener("change", () => { updateMode(); onChange(); });
  search.addEventListener("focus", renderResults);
  search.addEventListener("click", () => { if (results.hidden) renderResults(); });
  search.addEventListener("blur", closeResults);
  search.addEventListener("keydown", event => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (results.hidden) renderResults();
      if (options.length) {
        const step = event.key === "ArrowDown" ? 1 : -1;
        const next = activeIndex < 0 ? (step > 0 ? 0 : options.length - 1)
          : (activeIndex + step + options.length) % options.length;
        highlightOption(next);
      }
    } else if (event.key === "Enter" && !results.hidden && options.length) {
      event.preventDefault();
      chooseFriend(options[activeIndex < 0 ? 0 : activeIndex].friend);
    } else if (event.key === "Escape" && !results.hidden) {
      event.preventDefault();
      closeResults();
    } else if (event.key === "Tab") closeResults();
  });
  search.addEventListener("input", () => {
    chosenFriend = null;
    selected.textContent = "";
    search.setCustomValidity("Velg en venn fra søkeresultatet.");
    renderResults();
  });
  updateMode();
  return {
    element: field,
    getDeliveryMethod() { return active ? (mode.value === "friend" ? "in-app" : "email") : null; },
    setActive(value) { active = value; field.hidden = !value; field.disabled = !value; updateMode(); },
    getRecipient() {
      if (!active) return null;
      if (mode.value === "friend") return chosenFriend ? { ...chosenFriend } : null;
      return { name: inputs.name.value.trim(), email: inputs.email.value.trim().toLowerCase(), phone: inputs.phone.value.trim() };
    },
  };
}
