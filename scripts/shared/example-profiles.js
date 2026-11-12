const salmon = new URL('../../assets/feed/salmon.png', import.meta.url).href;
const trout = new URL('../../assets/feed/sea-trout.png', import.meta.url).href;

// Example history is displayed without writing to the user's saved sessions.
export function exampleProfileHistory(profile, own = false) {
  if (!own && (profile.visibility !== 'public' || !['kari@example.com', 'per@example.com'].includes(profile.id))) return { sessions: [], activity: [] };
  const kari = profile.id === 'kari@example.com';
  const places = [{name:'Bringsdal',zone:'Sone 2'}, {name:'Furuholmen',zone:'Sone 2'}, {name:'Mandalselva',zone:'Sone 1'}];
  const sessions = Array.from({length:kari ? 6 : 5}, (_, index) => {
    const start = `2026-06-${String(index + 1).padStart(2, '0')}T04:00:00.000Z`;
    const time = new Date(new Date(start).getTime() + 3600000).toISOString();
    const end = new Date(new Date(start).getTime() + (kari ? 3 : 2) * 3600000).toISOString();
    const id = `example:${profile.id}:${index}`;
    const isTrout = index % 2 === 1;
    const catches = index === 2 ? [] : [{
      id:`${id}:fish`, species:isTrout ? 'Sjøørret' : 'Laks',
      length:(isTrout ? 38 : 54) + index * 2, weight:Number(((isTrout ? 0.8 : 2) + index * 0.2).toFixed(1)),
      time, createdAt:new Date(new Date(time).getTime() + 300000).toISOString(),
      outcome:'released', imageUrl:isTrout ? trout : salmon,
      share:{friends:true,zone:true}, caption:'En fin tur langs elva.'
    }];
    return {id,email:profile.id,authorName:profile.name,place:places[index % places.length],start,end,catches,share:{friends:true,zone:true}};
  });
  return {sessions, activity:[{id:`example:${profile.id}:rules`,kind:'rules',version:'2026-08-01',time:'2026-08-01T12:00:00.000Z'}]};
}
