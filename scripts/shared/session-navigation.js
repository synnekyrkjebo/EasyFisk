import { getCurrentUser } from './auth.js';
import { listSessions } from './fishing-sessions.js';

const link = document.querySelector('.nav-item--report');
const icon = link?.querySelector('.report-button svg');
const originalIcon = icon?.innerHTML;
const banner = document.createElement('a');
banner.className = 'active-session-banner';
banner.hidden = true;
banner.href = link?.href || 'loggfor.html';
const heading = document.createElement('strong');
heading.textContent = 'Fiskeøkt pågår';
const elapsed = document.createElement('span');
const action = document.createElement('span');
action.textContent = 'Åpne økten →';
banner.append(heading, elapsed, action);
link?.closest('.bottom-nav')?.append(banner);
let timer;
let revision = 0;
async function update(event) {
  if (!link) return;
  const request = ++revision;
  try {
    let sessions = event?.detail?.sessions;
    if (!Array.isArray(sessions)) {
      const user = await getCurrentUser();
      sessions = user ? await listSessions(user) : [];
    }
    if (request !== revision) return;
    const session = sessions.find(session => !session.end);
    const active = Boolean(session);
    clearInterval(timer);
    banner.hidden = !active;
    if (active) {
      const tick = () => {
        const seconds = Math.max(0, Math.floor((Date.now() - new Date(session.start)) / 1000));
        const hours = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor(seconds / 60) % 60).padStart(2, '0');
        elapsed.textContent = `${hours}:${minutes}:${String(seconds % 60).padStart(2, '0')}`;
      };
      tick(); timer = setInterval(tick, 1000);
    }
    if (icon) icon.innerHTML = active ? '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>' : originalIcon;
    link.classList.toggle('has-active-session', active);
    link.querySelector('span:last-child').textContent = active ? 'Økt pågår' : 'Rapporter';
    link.setAttribute('aria-label', active ? 'Aktiv fiskeøkt – åpne økten' : 'Rapporter');
    link.dataset.help = active ? 'Du har en pågående fiskeøkt. Trykk for å åpne økten og registrere fangst.' : 'Start en fiskeøkt eller registrer en tidligere økt og fangst.';
    link.dataset.helpLabel = link.getAttribute('aria-label');
  } catch { /* Behold vanlig navigasjon hvis øktene ikke kan hentes. */ }
}
window.addEventListener('pageshow', update);
window.addEventListener('easyfisk:sessions-changed', update);
document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
update();
