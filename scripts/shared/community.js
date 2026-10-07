import { localTime } from "./fishing-sessions.js";

export function activityPosts(sessions) {
  const posts = [];
  for (const session of sessions) {
    const author = { email: session.email, name: session.authorName };
    for (const fish of session.catches) {
      if (fish.share?.friends || fish.share?.zone) posts.push({ id: `fish:${fish.id}`, kind: "catch", author, place: session.place, time: fish.time, ...fish, id: `fish:${fish.id}` });
    }
    if (session.end && (session.share?.friends || session.share?.zone)) posts.push({ id: `session:${session.id}`, kind: "session", author, place: session.place, time: session.end, start: session.start, end: session.end, caption: session.caption, share: session.share });
  }
  return posts;
}
export function visiblePosts(posts, profile, type) {
  return posts.filter(post => type === "friends"
    ? post.share?.friends && (post.author.email === profile.id || profile.following.includes(post.author.email))
    : post.share?.zone && profile.zones.includes(post.place.name))
    .sort((a,b) => new Date(b.time) - new Date(a.time));
}
export function zoneOverview(posts, name, now = new Date()) {
  const minimum = new Date(now.getTime() - 7 * 86400000);
  const entries = posts.filter(post => post.share?.zone && post.place.name === name && new Date(post.time) >= minimum && new Date(post.time) <= now);
  return { catches: entries.filter(post => post.kind === "catch").length, sessions: entries.filter(post => post.kind === "session").length, posts: entries.length };
}
// Initial community content for the interactive prototype; no measured river conditions.
export function initialPosts(now = new Date()) {
  const date = days => new Date(now.getTime() - days * 86400000).toISOString();
  return [
    { id: "community:kari", kind: "catch", author: {email:"kari@example.com",name:"Kari Hansen"}, place:{name:"Bringsdal",zone:"Sone 2"}, time:date(1), species:"Laks", length:62, weight:2.4, caption:"En fin tur langs elva. Fisken ble satt tilbake.", share:{friends:true,zone:true}, outcome:"released" },
    { id: "community:per", kind: "session", author: {email:"per@example.com",name:"Per Olsen"}, place:{name:"Furuholmen",zone:"Sone 2"}, time:date(2), start:date(2), end:new Date(new Date(date(2)).getTime()+7200000).toISOString(), caption:"To timer ute, ingen fangst. Likevel en god dag ved elva.", share:{friends:true,zone:true} },
    { id: "community:anne", kind: "catch", author:{email:"anne@example.com",name:"Anne Berg"}, place:{name:"Bringsdal",zone:"Sone 2"}, time:date(3), species:"Sjøørret",length:44,weight:0.9,caption:"Første sjøørret denne sesongen!",share:{friends:true,zone:true},outcome:"released" },
  ];
}
export const monthLabel = key => new Intl.DateTimeFormat("nb-NO", {month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(`${key}-15T12:00:00Z`));
export const prettyTime = time => new Intl.DateTimeFormat("nb-NO", {day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",timeZone:"Europe/Oslo"}).format(new Date(time));
export const currentYear = () => localTime().slice(0,4);
