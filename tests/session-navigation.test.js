import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('ending a session immediately hides its banner and clears active navigation, even during an older read', async () => {
  const nodes = [];
  const node = () => {
    const classes = new Set();
    return { hidden: false, dataset: {}, innerHTML: '', textContent: '',
      append() {}, setAttribute() {}, getAttribute() { return 'Rapporter'; },
      classList: { toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); }, contains(name) { return classes.has(name); } } };
  };
  const icon = node(); icon.innerHTML = 'original icon';
  const label = node();
  const link = node();
  link.querySelector = selector => selector.includes('svg') ? icon : label;
  link.closest = () => node();
  const listeners = {};
  const timers = new Set();
  let resolveRead;
  const source = readFileSync(new URL('../scripts/shared/session-navigation.js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, '');
  vm.runInNewContext(source, {
    document: { querySelector: () => link, createElement() { const item = node(); nodes.push(item); return item; }, addEventListener() {} },
    window: { addEventListener(name, callback) { listeners[name] = callback; } },
    getCurrentUser: async () => ({ email: 'test@example.com' }),
    listSessions: () => new Promise(resolve => { resolveRead = resolve; }),
    setInterval(callback) { timers.add(callback); return callback; },
    clearInterval(id) { timers.delete(id); }, Date,
  });
  await Promise.resolve();
  const active = { start: '2026-01-01T10:00:00Z', end: null };
  const update = listeners['easyfisk:sessions-changed'];
  await update({ detail: { sessions: [active] } });
  assert.equal(nodes[0].hidden, false);
  assert.equal(link.classList.contains('has-active-session'), true);
  assert.equal(timers.size, 1);
  await update({ detail: { sessions: [{ ...active, end: '2026-01-01T11:00:00Z' }] } });
  assert.equal(nodes[0].hidden, true);
  assert.equal(link.classList.contains('has-active-session'), false);
  assert.equal(label.textContent, 'Rapporter');
  assert.equal(icon.innerHTML, 'original icon');
  assert.equal(timers.size, 0);
  resolveRead([active]);
  await Promise.resolve(); await Promise.resolve();
  assert.equal(nodes[0].hidden, true);
  assert.equal(link.classList.contains('has-active-session'), false);
});
