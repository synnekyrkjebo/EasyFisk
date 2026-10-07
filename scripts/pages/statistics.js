import {getCurrentUser} from "../shared/auth.js";
import {listSessions} from "../shared/fishing-sessions.js";
import {calculateStatistics} from "../shared/statistics.js";
import {renderStatistics} from "../shared/community-ui.js";
const $=s=>document.querySelector(s);
for(const [id,page] of [['#stats-login','logginn.html'],['#stats-signup','registrer.html']]){const url=new URL(page,location.href);url.searchParams.set('tilbake',location.pathname);$(id).href=url.href;}
getCurrentUser().then(async user=>{
 $('#stats-guest').hidden=Boolean(user);$('#stats-account').hidden=!user;if(!user)return;
 const sessions=await listSessions(user);renderStatistics($('#personal-statistics'),sessions);const stats=calculateStatistics(sessions);
 $('#record-summary').textContent=`${stats.recordBeats} forbedringer av tidligere lengderekord · lengste fiskestreak: ${stats.longestStreak} ${stats.longestStreak===1?'dag':'dager'} · ${Object.keys(stats.places).length} soner besøkt.`;
}).catch(()=>{$('#stats-status').textContent='Kunne ikke hente statistikken. Prøv igjen.'});
