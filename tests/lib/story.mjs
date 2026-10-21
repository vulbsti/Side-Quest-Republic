// Helpers for story tests (tests/test-situations.mjs and the writers' own checks): play a day the way a
// player would, by standing somewhere and calling act(), and read what reached the player.
import * as R from '../../dist/loop/rules.js';

export { R };
const clock = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return R.at(h, m || 0); };

/** A fresh day run to hh:mm (default 10:00). */
export function dayAt(hhmm = '10:00') { const s = R.createDay(); runTo(s, hhmm); return s; }
/** Let the world run to hh:mm, or for n game minutes. */
export function runTo(s, hhmm) { const t = clock(hhmm); if (t > s.t) R.advance(s, t - s.t); return s; }
export function runMinutes(s, n) { R.advance(s, R.mins(n)); return s; }
/** Real seconds (beats are 2.6 s apart). */
export function runSeconds(s, n) { R.advance(s, n); return s; }
/** Where a person, officer, object, place or spot is. */
export function posOf(s, id) {
  if (id === 'player') return s.player;
  return s.people[id] || R.officerById(s, id) || s.objects[id] || R.PLACES[id] || R.SPOTS[id] || null;
}
/** Teleport the player next to someone or somewhere (1 m off, so you're not inside them). */
export function stand(s, id) { const p = posOf(s, id); if (!p) throw new Error(`no such place or person: ${id}`); Object.assign(s.player, { x: p.x + 1, z: p.z }); return s; }
/** Walk at jog pace, letting the world run (followers keep up, chasers chase). */
export function walk(s, id) {
  const to = posOf(s, id);
  while (R.dist(s.player, to) > 1.2 && !s.over) {
    const d = R.dist(s.player, to), step = Math.min(d - 1, 0.47);
    s.player.x += ((to.x - s.player.x) / d) * step; s.player.z += ((to.z - s.player.z) / d) * step;
    R.advance(s, 0.1);
  }
  return s;
}
export const talk = (s, to) => R.act(s, { type: 'talk', to });
/** Pick the option whose intent includes the text (or index i). Throws if it is not on screen. */
export function choose(s, which) {
  const c = s.story.convo;
  if (!c) throw new Error(`no conversation on screen (wanted "${which}")`);
  const o = typeof which === 'number' ? c.options[which] : c.options.find((x) => x.intent.toLowerCase().includes(String(which).toLowerCase()));
  if (!o) throw new Error(`no option "${which}" in ${c.id}/${c.node}: ${c.options.map((x) => x.intent).join(' | ')}`);
  const r = R.act(s, { type: 'say', option: o.i });
  runSeconds(s, 0.2);
  return r;
}
export const leave = (s) => R.act(s, { type: 'leave' });
export const start = (s, id) => R.act(s, { type: 'situation', id });
export const sit = (s, id) => R.situations(s).find((x) => x.id === id);
export const stateOf = (s, id) => sit(s, id)?.state;
/** Every event so far that has text, as "who: text" (drains the queue). */
export function heard(s) { return R.drainEvents(s).filter((e) => e.text).map((e) => `${e.who}: ${e.text}`); }
