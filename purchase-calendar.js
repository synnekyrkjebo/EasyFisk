// Kalenderdatoer beregnes uavhengig av nettleserens tidssone og sommertid.
export function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(key, count) {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return dateKey(date);
}

export function firstBookableDay(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Oslo", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", hourCycle: "h23",
  }).formatToParts(now).map(({ type, value }) => [type, value]));
  const today = `${parts.year}-${parts.month}-${parts.day}`;
  return Number(parts.hour) >= 18 ? addDays(today, 1) : today;
}

export function monthDays(year, month) {
  const first = new Date(Date.UTC(year, month, 1, 12));
  const count = new Date(Date.UTC(year, month + 1, 0, 12)).getUTCDate();
  return { offset: (first.getUTCDay() + 6) % 7,
    dates: Array.from({ length: count }, (_, i) => dateKey(new Date(Date.UTC(year, month, i + 1, 12)))) };
}

// Eksempeldata. Erstattes med ledighet fra bestillingssystemet.
export function exampleAvailability(place, key) {
  let hash = 0;
  for (const character of `${place}:${key}`) hash = (hash * 31 + character.codePointAt(0)) >>> 0;
  const total = 4;
  const booked = hash % (total + 1);
  return { total, booked, remaining: total - booked };
}
