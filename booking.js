import { dateKey, firstBookableDay, exampleAvailability } from "./purchase-calendar.js";

export function readBooking(params, places) {
  const place = places.find(item => item.name === params.get("sted"));
  const type = params.get("kort") === "group" ? "group" : "single";
  const people = type === "group" ? Number(params.get("antall")) : 1;
  if (!place || !Number.isInteger(people) || people < (type === "group" ? 2 : 1) || people > 4) return null;
  const requestedDates = [...new Set((params.get("dager") || "").split(",").filter(Boolean))].sort();
  if (!requestedDates.length) return null;
  const dates = requestedDates.filter(key => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
    const date = new Date(`${key}T12:00:00Z`);
    return Number.isFinite(date.getTime()) && dateKey(date) === key && key >= firstBookableDay()
      && exampleAvailability(place.name, key).remaining >= people;
  });
  if (dates.length !== requestedDates.length) return null;
  return { place, type, people, dates };
}

export function bookingUrl(page, booking, base) {
  const url = new URL(page, base);
  url.searchParams.set("sted", booking.place.name);
  url.searchParams.set("kort", booking.type);
  url.searchParams.set("antall", String(booking.people));
  url.searchParams.set("dager", booking.dates.join(","));
  return url;
}
