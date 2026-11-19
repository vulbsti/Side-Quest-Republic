// The place dares (dist/loop/places.js): one physical dare at each of the eight fast-travel places. Each can be won
// (playing the way placeHint() says), each fails the funny way when you play it badly, each replays exactly, the
// verifier can find it (affordances), it is off in the slice, and a day that never starts one is untouched by them.
// Also: the two lines the verifier found said where nobody could hear them (lines-reach-player) now reach the phone.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as R from '../dist/loop/rules.js';
import { routeEvent, engineView } from '../dist/loop/present.js';
import { LINES } from '../dist/loop/content.js';
import { MAP } from '../dist/map/delhi-map.js';
import * as H from '../verify/lib/harness.mjs';

const { PLACE_DARES, PLACE_LAYOUT, DESTINATIONS } = R;
const WALLS = JSON.parse(readFileSync(new URL('../verify/world-obstacles.json', import.meta.url), 'utf8')).obstacles;
const IDS = ['chashma', 'laddoo', 'langar', 'photobomb', 'kurta', 'darzi', 'metro', 'bus'];
const PLACES = ['palika', 'hanuman', 'bangla', 'centralPark', 'janpath', 'rivoli', 'patel', 'shivaji'];

// --- the table -------------------------------------------------------------------------------------
assert.deepEqual(PLACE_DARES.map((d) => d.id), IDS, 'eight dares, in order');
assert.deepEqual(PLACE_DARES.map((d) => d.place).sort(), [...PLACES].sort(), 'one dare at each new fast-travel place');
for (const d of PLACE_DARES) {
  assert(DESTINATIONS[d.place], `${d.id}: ${d.place} is a fast-travel destination`);
  assert(d.text && d.text.split(/\s+/).length <= 8, `${d.id}: the dare's text is short ("${d.text}")`);
  assert.equal(typeof d.done, 'function', `${d.id}: done(s)`);
  assert(R.DARE_AT[d.place] === d.id, `${d.id}: DARE_AT`);
}

// --- every spot people stand on is pavement or park: not in a wall, a building or a carriageway ---------
const inPoly = (x, z, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c; } return c; };
const segD = (x, z, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], l = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / l)); return Math.hypot(a[0] + t * dx - x, a[1] + t * dz - z); };
function ground(p) {
  for (const o of WALLS) if ((o.h ?? 0) > 0 && (o.base || 0) < 1.8 && Math.abs(p.x - o.x) <= o.w / 2 && Math.abs(p.z - o.z) <= o.d / 2) return `wall ${o.id}`;
  for (const b of MAP.buildings) if (inPoly(p.x, p.z, b.poly)) return 'building';
  for (const r of MAP.roads) if (r.car) for (let i = 1; i < r.pts.length; i++) if (segD(p.x, p.z, r.pts[i - 1], r.pts[i]) <= r.w / 2) return `road ${r.name ?? ''}`;
  return null;
}
const L = PLACE_LAYOUT;
const spots = {
  chashma: [L.chashma.start, L.chashma.hawker, L.chashma.didi],
  laddoo: [L.laddoo.start, L.laddoo.counter, L.laddoo.goal, ...L.laddoo.monkeys],
  langar: [L.langar.start, L.langar.sevadar, ...L.langar.rows],
  photobomb: [L.photobomb.start, L.photobomb.guard, ...L.photobomb.couples.flatMap((c) => [c.cam, c.pose])],
  kurta: [L.kurta.start, L.kurta.goal], // the road between is the dare
  darzi: [L.darzi.start, ...Object.values(L.darzi.stalls)],
  metro: [L.metro.start, L.metro.gate, L.metro.guard, ...L.metro.queue],
  bus: [L.bus.start], // the bus drives on the road
};
for (const [id, list] of Object.entries(spots)) for (const p of list) assert.equal(ground(p), null, `${id}: (${p.x}, ${p.z}) is on pavement`);
for (const id of IDS) assert(R.dist(L[id].start, DESTINATIONS[L[id].place]) < 25, `${id}: the dare starts within 25 m of where the hop lands`);

// --- helpers -----------------------------------------------------------------------------------------
/** A run standing at a dare's start, after the hop there. */
function at(id, run = H.newRun('long')) {
  H.perform(run, { wait: 2 });
  H.perform(run, { do: `travel:${L[id].place}`, cmd: { type: 'travel', to: L[id].place }, at: { x: run.s.player.x, z: run.s.player.z } });
  return run;
}
const startStep = (id) => ({ do: `place:${id}`, cmd: { type: 'place', id, move: 'start' }, at: { ...L[id].start } });
const won = (s, id) => `cue:action:${id}:win` in s.history;
const failed = (s, id) => `cue:action:${id}:fail` in s.history;
function play(id) {
  const run = at(id);
  const out = H.perform(run, startStep(id));
  assert(out.r?.ok, `${id}: starts`);
  for (let n = 0; run.s.action?.place && n < 500; n++) H.perform(run, R.placeHint(run.s));
  return run;
}

// --- each dare: win, deterministic, paid, cut away ------------------------------------------------------
const results = {};
for (const id of IDS) {
  const run = play(id);
  assert(won(run.s, id), `${id}: a good player wins it`);
  assert(!run.s.action, `${id}: the dare is over`);
  assert(PLACE_DARES.find((d) => d.id === id).done(run.s), `${id}: done(s) after the win`);
  assert(run.s.places.followers > 0, `${id}: pays followers`);
  for (const c of ['slice:followers', 'slice:dare', 'slice:cutaway']) assert(`cue:${c}` in run.s.history, `${id}: ${c} cue on the win`);
  const secs = run.s.history[`cue:action:${id}:win`] - run.s.history[`cue:action:${id}:start`];
  assert(secs >= 3 && secs <= 75, `${id}: takes a few seconds to a minute (${secs.toFixed(1)} s)`);
  // The same trace replays to the same day.
  const again = H.replay(run.trace, 'long');
  assert(won(again.s, id) && again.s.history[`cue:action:${id}:win`] === run.s.history[`cue:action:${id}:win`], `${id}: replays exactly`);
  // Done: not offered again, and starting it again says so.
  assert(!R.affordances(run.s).some((a) => a.id === `place:${id}`), `${id}: not offered once done`);
  results[id] = Math.round(secs * 10) / 10;
}

// --- each dare's funny way to fail --------------------------------------------------------------------
const go = (p, name = 'x') => ({ do: `go:${name}`, cmd: null, at: { x: p.x, z: p.z }, hold: 0 });
function fails(id, how, why) {
  const run = at(id);
  assert(H.perform(run, startStep(id)).r?.ok, `${id}: starts`);
  how(run);
  for (let n = 0; run.s.action?.place && n < 400; n++) H.perform(run, { wait: 0.25 });
  assert(failed(run.s, id) && !won(run.s, id), `${id}: fails when ${why}`);
  return run;
}
// Palika: keep walking away and the didi gets your Ray-Ban.
fails('chashma', (run) => H.perform(run, go({ x: L.chashma.hawker.x + 12, z: L.chashma.hawker.z - 12 })), 'you walk too far');
// Hanuman Mandir: run straight for the joota ghar and a monkey has your laddoo.
fails('laddoo', (run) => H.perform(run, go(L.laddoo.goal)), 'you run straight through the monkeys');
// Bangla Sahib: stop-start jerks and the thalis go.
fails('langar', (run) => { const a = L.langar.start, b = { x: a.x - 2.2, z: a.z }; for (let i = 0; i < 8 && run.s.action; i++) H.perform(run, go(i % 2 ? a : b)); }, 'you jerk about with the stack');
// Central Park: stand about on the grass and the guard walks you out.
fails('photobomb', () => {}, 'you stand on the grass');
// Janpath: walk straight across and the second carriageway's cars arrive.
fails('kurta', (run) => H.perform(run, go(L.kurta.goal)), 'you cross without waiting');
// Rivoli: dawdle and five minutes means tomorrow.
fails('darzi', () => {}, 'you dawdle');
// Patel Chowk: walk up to the gate while the guard is looking.
fails('metro', (run) => { while (!R.placeView(run.s).game.watching) H.perform(run, { wait: 0.025 }); H.perform(run, go(L.metro.gate)); }, 'you walk while the guard looks');
// Shivaji: watch the bus leave.
fails('bus', () => {}, 'you watch it go');

// --- listed for the verifier, quit-able, offered near --------------------------------------------------
{
  const s = H.newRun('long').s;
  const offered = R.affordances(s).filter((a) => a.kind === 'place').map((a) => a.id);
  assert.deepEqual(offered, IDS.map((id) => `place:${id}`), 'every dare is an affordance with a command');
  const run = at('darzi');
  assert(R.opportunities(run.s, L.darzi.start, 10).some((o) => o.id === 'place:darzi' && o.cmd), 'the E prompt offers it when you stand there');
  H.perform(run, startStep('darzi'));
  const affs = R.affordances(run.s).filter((a) => a.kind === 'place');
  assert(affs.some((a) => a.id === 'place:darzi:quit' && a.cmd), 'while it runs you can quit it');
  assert(affs.some((a) => a.id.startsWith('place:darzi:go:') && a.at), 'while it runs the verifier knows where to go');
  assert(!affs.some((a) => a.id === 'place:chashma'), 'no other dare starts while one runs');
  assert(R.act(run.s, { type: 'place', id: 'darzi', move: 'quit' }).ok && !run.s.action, 'you can quit');
  H.perform(run, { wait: 0.25 });
  assert(failed(run.s, 'darzi'), 'quitting is a fail');
}

// --- the travel panel says so while undone ---------------------------------------------------------------
{
  const run = play('metro');
  const board = R.travelBoard(run.s);
  const row = (id) => board.find((r) => r.id === id);
  const shiv = row('shivaji'), patel = row('patel');
  assert(/Dare: /.test(JSON.stringify(shiv)), 'the travel panel mentions an undone dare');
  assert(!/Dare: /.test(JSON.stringify(patel)), 'and stops once it is done');
}

// --- off in the slice --------------------------------------------------------------------------------------
{
  const s = R.createDay({ slice: true });
  R.advance(s, 3);
  assert(!R.affordances(s).some((a) => a.kind === 'place'), 'no place dares in the slice');
  Object.assign(s.player, { ...L.chashma.start });
  assert(!R.opportunities(s, s.player, 10).some((o) => o.kind === 'place'), 'no prompt in the slice');
  assert(!R.act(s, { type: 'place', id: 'chashma', move: 'start' }).ok && !s.action, 'refused in the slice');
  R.setTempo('long');
}

// --- a day that never starts one is the day it always was ---------------------------------------------------
{
  const a = H.newRun('long');
  H.perform(a, { do: 'travel:palika', cmd: { type: 'travel', to: 'palika' }, at: { x: a.s.player.x, z: a.s.player.z } });
  H.perform(a, { wait: 30 });
  assert(!('places' in a.s) && !a.s.action, 'standing next to a dare writes nothing to the day');
  assert(!Object.keys(a.s.history).some((k) => /^cue:(action:(chashma|laddoo|langar|photobomb|kurta|darzi|metro|bus)|place:)/.test(k)), 'and no dare cue');
}

// --- what reaches the screen ---------------------------------------------------------------------------------
{
  const s = R.createDay({ tempo: 'long' });
  const v = (p) => ({ ...engineView(s, R.placeAt), player: { x: p.x, z: p.z, visible: true } });
  const e = { t: 0, who: 'hawker', text: 'Ray-Ban original!', key: 'place-x', kind: 'place', pos: L.chashma.hawker };
  assert.deepEqual([routeEvent(e, v(L.chashma.start)).channel, routeEvent(e, v(L.chashma.start)).seen], ['place', true], 'a place line near you is a bubble you see');
  assert.equal(routeEvent(e, v({ x: 0, z: 0 })).seen, false, 'and far away it is not');
}

// --- lines-reach-player: two lines the verifier found said where nobody could hear them ---------------------
// The barricade push and the LJM leader without a camera happen at Jantar Mantar while you may be anywhere: each
// now has a phone post too, so the news reaches you wherever you are.
{
  const s = R.createDay({ tempo: 'long' });
  Object.assign(s.player, { ...L.chashma.start }); // Palika Bazaar, far from both
  for (const key of ['barricade-push', 'opp-no-camera']) {
    const lines = LINES[key];
    assert(lines?.length, `${key} has lines`);
    const view = engineView(s, R.placeAt);
    const seen = lines.map(([who, text]) => routeEvent({ t: s.t, who, text, key, place: key === 'barricade-push' ? 'barricade' : 'stage' }, view)).filter((r) => r.seen);
    assert(seen.length && seen.every((r) => ['feed', 'chat', 'ticker', 'stream'].includes(r.channel)), `${key}: reaches a player at Palika Bazaar on the phone`);
  }
}

console.log('PASS places:', Object.entries(results).map(([k, v]) => `${k} ${v}s`).join(', '));
