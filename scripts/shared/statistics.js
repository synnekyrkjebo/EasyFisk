import { localTime } from "./fishing-sessions.js";
const day = value => localTime(value).slice(0, 10);
const month = value => localTime(value).slice(0, 7);
export const completeCatch = fish => Boolean(fish.species && fish.weight > 0 && fish.length > 0 && fish.time && fish.gps && fish.photo && fish.outcome);
export function calculateStatistics(sessions, now = new Date()) {
  const fish = sessions.flatMap(session => session.catches.map(item => ({ ...item, place: session.place })));
  const hours = sessions.reduce((sum, session) => sum + Math.max(0, (Math.min(new Date(session.end || now), now) - new Date(session.start)) / 3600000), 0);
  const species = {}, places = {}, months = {}, records = {};
  for (const session of sessions) {
    const name = session.place.name; places[name] = (places[name] || 0) + 1;
    const key = month(session.start); months[key] ||= { sessions: 0, catches: 0, hours: 0 }; months[key].sessions++;
    months[key].hours += Math.max(0, (new Date(session.end || now) - new Date(session.start)) / 3600000);
  }
  let recordBeats = 0;
  for (const item of fish.slice().sort((a, b) => new Date(a.time) - new Date(b.time) || a.id.localeCompare(b.id))) {
    species[item.species] = (species[item.species] || 0) + 1;
    const key = month(item.time); months[key] ||= { sessions: 0, catches: 0, hours: 0 }; months[key].catches++;
    const prior = records[item.species];
    if (prior && item.length > prior.length) recordBeats++;
    records[item.species] = { length: Math.max(prior?.length || 0, item.length), weight: Math.max(prior?.weight || 0, item.weight || 0) };
  }
  const dates = [...new Set(sessions.map(session => day(session.start)))].sort();
  let streak = 0, longestStreak = 0, previous;
  for (const date of dates) {
    const distance = previous ? (new Date(`${date}T12:00:00Z`) - new Date(`${previous}T12:00:00Z`)) / 86400000 : 0;
    streak = distance === 1 ? streak + 1 : 1; longestStreak = Math.max(longestStreak, streak); previous = date;
  }
  const currentMonth = month(now), [year, m] = currentMonth.split('-').map(Number);
  const previousMonth = new Date(Date.UTC(year, m - 2, 15)).toISOString().slice(0, 7);
  const empty = { sessions: 0, catches: 0, hours: 0 };
  return { sessions: sessions.length, hours, catches: fish.length, rate: hours > 0 ? fish.length / hours : 0,
    zero: sessions.filter(session => session.end && !session.catches.length).length,
    species, places, months, records, recordBeats, longestStreak, days: dates.length,
    mostVisited: Object.entries(places).sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || "Ingen ennå",
    currentMonth, previousMonth, current: months[currentMonth] || empty, previous: months[previousMonth] || empty };
}
export function personalRecordIds(sessions) {
  const records = {}, ids = new Set();
  for (const item of sessions.flatMap(session => session.catches).sort((a,b) => new Date(a.time) - new Date(b.time) || a.id.localeCompare(b.id))) {
    if (records[item.species] && item.length > records[item.species]) ids.add(item.id);
    records[item.species] = Math.max(records[item.species] || 0, item.length);
  }
  return ids;
}
export function achievements(sessions, activity, now = new Date()) {
  const stats = calculateStatistics(sessions, now), fish = sessions.flatMap(session => session.catches);
  const values = [
    ["Første kast", "Registrer din første fiskeøkt", stats.sessions, 1, "🎣"],
    ["Første fangst", "Registrer din første fisk", stats.catches, 1, "🐟"],
    ["Trofast fisker", "Registrer fem fiskeøkter", stats.sessions, 5, "🏅"],
    ["Elveutforsker", "Fisk i tre forskjellige soner", Object.keys(stats.places).length, 3, "🧭"],
    ["Morgenfisker", "Start en økt før kl. 07", sessions.filter(s => Number(localTime(s.start).slice(11,13)) < 7).length, 1, "🌅"],
    ["Kveldsfisker", "Fullfør en økt etter kl. 21", sessions.filter(s => s.end && localTime(s.end).slice(11) > "21:00").length, 1, "🌙"],
    ["Artsutforsker", "Registrer tre forskjellige arter", Object.keys(stats.species).length, 3, "🐠"],
    ["Nøyaktig rapportør", "Fyll ut alle feltene, GPS og bilde i ti fangstrapporter", fish.filter(completeCatch).length, 10, "📝"],
    ["Ansvarlig fisker", "Les og bekreft oppdaterte fiskeregler", activity.filter(a => a.kind === "rules").length, 1, "📖"],
    ["Miljøvenn", "Registrer forsøpling eller et miljøproblem", activity.filter(a => a.kind === "environment").length, 1, "🌱"],
    ["Sesongstarter", "Registrer en økt 1.–7. juni", sessions.filter(s => day(s.start).slice(5) >= "06-01" && day(s.start).slice(5) <= "06-07").length, 1, "☀️"],
    ["Personlig rekord", "Slå din tidligere lengderekord for en art", stats.recordBeats, 1, "🏆"],
    ["Rask rapportering", "Registrer en fangst innen ti minutter", fish.filter(f => f.createdAt && new Date(f.createdAt) >= new Date(f.time) && new Date(f.createdAt) - new Date(f.time) <= 600000).length, 1, "⏱️"],
    ["Fiskestreak", "Fisk tre dager på rad", stats.longestStreak, 3, "🔥"],
    ["Sonesamler", "Besøk fem forskjellige soner", Object.keys(stats.places).length, 5, "📍"],
  ];
  return values.map(([name, requirement, value, goal, icon]) => ({ name, requirement, value, goal, icon, unlocked: value >= goal }));
}
export function challenges(sessions, activity, now = new Date()) {
  const key = month(now), current = sessions.filter(session => month(session.start) === key);
  const previousZones = new Set(sessions.filter(session => month(session.start) < key).map(session => session.place.name));
  const entries = [
    ["Tre turer denne måneden", "Registrer tre fiskeøkter", current.length, 3, "loggfor.html"],
    ["Utforsk en ny sone", "Fisk i en sone du ikke hadde besøkt før denne måneden", new Set(current.filter(s => !previousZones.has(s.place.name)).map(s => s.place.name)).size, 1, "kjop.html"],
    ["Komplette fangster", "Registrer tre fangster med alle felt, GPS og bilde denne måneden", sessions.flatMap(s => s.catches).filter(f => month(f.time) === key && completeCatch(f)).length, 3, "loggfor.html"],
    ["Hver tur teller", "Registrer en avsluttet økt uten fangst denne måneden", current.filter(s => s.end && !s.catches.length).length, 1, "loggfor.html"],
    ["Oppdatert fisker", "Les og bekreft årets fiskeregler", activity.filter(a => a.kind === "rules" && a.version.startsWith(String(now.getFullYear()))).length, 1, "minside.html#profile-rules"],
    ["En renere elv", "Delta på en ryddeaktivitet langs elven denne måneden", activity.filter(a => a.kind === "cleanup" && month(a.time) === key).length, 1, "minside.html#profile-environment"],
  ];
  return entries.map(([name, requirement, value, goal, href]) => ({name,requirement,value,goal,href,completed:value>=goal}));
}

// Detail rows use only the sessions and activities available to the profile viewer.
export function achievementDetails(name, sessions, activity, now = new Date()) {
  const sessionRow = s => ({title: s.place.name, time: s.start, detail: `${s.end ? 'Avsluttet' : 'Pågående'} · ${s.catches.length} fangster`});
  const fishRows = predicate => sessions.flatMap(s => s.catches.filter(predicate).map(f => ({title: `${f.species} · ${f.length} cm · ${f.weight} kg`, time: f.time, detail: s.place.name})));
  const activityRows = predicate => activity.filter(predicate).map(a => ({title: a.place || (a.kind === 'rules' ? 'Fiskeregler bekreftet' : 'Aktivitet langs elva'), time: a.time, detail: a.text || a.version || ''}));
  const key = month(now), current = sessions.filter(s => month(s.start) === key);
  switch (name) {
    case 'Elveutforsker': case 'Sonesamler':
      return Object.entries(calculateStatistics(sessions, now).places).map(([title, count]) => ({title, detail: `${count} ${count === 1 ? 'økt' : 'økter'}`}));
    case 'Artsutforsker':
      return Object.entries(calculateStatistics(sessions, now).species).map(([title, count]) => ({title, detail: `${count} fangster`}));
    case 'Første fangst': return fishRows(() => true);
    case 'Nøyaktig rapportør': return fishRows(completeCatch);
    case 'Rask rapportering': return fishRows(f => f.createdAt && new Date(f.createdAt) >= new Date(f.time) && new Date(f.createdAt) - new Date(f.time) <= 600000);
    case 'Personlig rekord': { const ids = personalRecordIds(sessions); return fishRows(f => ids.has(f.id)); }
    case 'Ansvarlig fisker': return activityRows(a => a.kind === 'rules');
    case 'Miljøvenn': return activityRows(a => a.kind === 'environment');
    case 'Morgenfisker': return sessions.filter(s => Number(localTime(s.start).slice(11,13)) < 7).map(sessionRow);
    case 'Kveldsfisker': return sessions.filter(s => s.end && localTime(s.end).slice(11) > '21:00').map(sessionRow);
    case 'Sesongstarter': return sessions.filter(s => day(s.start).slice(5) >= '06-01' && day(s.start).slice(5) <= '06-07').map(sessionRow);
    case 'Fiskestreak': {
      const days = [...new Set(sessions.map(s => day(s.start)))].sort();
      let run = [], longest = [];
      for (const date of days) {
        if (run.length && new Date(`${date}T12:00:00Z`) - new Date(`${run.at(-1)}T12:00:00Z`) !== 86400000) run = [];
        run.push(date); if (run.length > longest.length) longest = [...run];
      }
      return sessions.filter(s => longest.includes(day(s.start))).map(sessionRow);
    }
    case 'Tre turer denne måneden': return current.map(sessionRow);
    case 'Utforsk en ny sone': {
      const previous = new Set(sessions.filter(s => month(s.start) < key).map(s => s.place.name));
      return current.filter(s => !previous.has(s.place.name)).map(sessionRow);
    }
    case 'Komplette fangster': return fishRows(f => month(f.time) === key && completeCatch(f));
    case 'Hver tur teller': return current.filter(s => s.end && !s.catches.length).map(sessionRow);
    case 'Oppdatert fisker': return activityRows(a => a.kind === 'rules' && a.version?.startsWith(String(now.getFullYear())));
    case 'En renere elv': return activityRows(a => a.kind === 'cleanup' && month(a.time) === key);
    case 'Første kast': case 'Trofast fisker': return sessions.map(sessionRow);
    default: return [];
  }
}
