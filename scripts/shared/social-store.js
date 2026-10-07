import { searchFriends } from "./recipients.js";

function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("easyfisk.social", 1);
    request.onupgradeneeded = () => { for (const name of ["profiles", "activity", "reactions"]) request.result.createObjectStore(name, { keyPath: "id" }); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function access(name, mode, operation) {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(name, mode), request = operation(tx.objectStore(name));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
export function defaultProfile(user) {
  return { id: user.email.toLowerCase(), name: user.name, bio: "", visibility: "private", avatar: null,
    following: searchFriends("").filter(friend => friend.email !== user.email.toLowerCase()).map(friend => friend.email), zones: [] };
}
export async function getProfile(user) { return await access("profiles", "readonly", store => store.get(user.email.toLowerCase())) || defaultProfile(user); }
export async function getProfiles() { return access("profiles", "readonly", store => store.getAll()); }
export async function saveProfile(user, profile) {
  if (!profile.name?.trim() || profile.name.length > 120 || profile.bio.length > 300 || !["private", "public"].includes(profile.visibility)) throw new Error("Sjekk navn og presentasjon (maks 300 tegn).");
  if (profile.avatar) validatePhoto(profile.avatar);
  return access("profiles", "readwrite", store => store.put({ ...profile, id: user.email.toLowerCase(), name: profile.name.trim(), following: [...new Set(profile.following)], zones: [...new Set(profile.zones)] }));
}
export function validatePhoto(photo) {
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(photo.type) || photo.size > 10 * 1024 * 1024 || !photo.size) throw new Error("Velg et bilde på maks 10 MB (JPG, PNG, WebP eller GIF).");
}
export async function recordActivity(user, kind, details = {}) {
  const id = kind === "rules" ? `${user.email.toLowerCase()}:rules:${details.version}` : crypto.randomUUID();
  return access("activity", "readwrite", store => store.put({ id, email: user.email.toLowerCase(), kind, ...details, time: new Date().toISOString() }));
}
export async function listActivity(user) { return (await access("activity", "readonly", store => store.getAll())).filter(item => item.email === user.email.toLowerCase()); }
export async function getReactions(id) { return await access("reactions", "readonly", store => store.get(id)) || { id, likes: [], comments: [] }; }
export async function toggleReaction(id, user) {
  const data = await getReactions(id), email = user.email.toLowerCase();
  data.likes = data.likes.includes(email) ? data.likes.filter(item => item !== email) : [...data.likes, email];
  await access("reactions", "readwrite", store => store.put(data)); return data;
}
export async function addComment(id, user, text) {
  text = text.trim(); if (!text || text.length > 500) throw new Error("Skriv en kommentar på 1–500 tegn.");
  const data = await getReactions(id);
  data.comments.push({ id: crypto.randomUUID(), email: user.email.toLowerCase(), name: user.name, text, time: new Date().toISOString() });
  await access("reactions", "readwrite", store => store.put(data)); return data;
}

export async function publicProfileActivity(profile) {
  if (profile.visibility !== "public") return [];
  return (await access("activity", "readonly", store => store.getAll()))
    .filter(item => item.email === profile.id).map(({kind,time,version}) => ({kind,time,version}));
}
