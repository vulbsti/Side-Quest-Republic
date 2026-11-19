// Fast travel (dist/loop/travel.js): hop to a real place for a couple of game minutes instead of a minute of jogging.
// It moves you, whoever follows you and what you carry; it is refused while you're busy; it costs a fixed bit of
// clock; it replays exactly; the verifier can find it; and a day nobody travels in is the day it always was.
import assert from 'node:assert/strict';
import {
  createDay, advance, act, tick, affordances, opportunities, dist, at, mins, drainEvents, drainCues, clockText,
  DESTINATIONS, TRAVEL_MINUTES, HOP_FROM, travelBoard, travelHop, setTempo, placeAt,
} from '../dist/loop/rules.js';
import { routeEvent, engineView } from '../dist/loop/present.js';
import { canSee } from '../dist/loop/sight.js';
import { readFileSync } from 'node:fs';

setTempo('long');
const WALLS = JSON.parse(readFileSync(new URL('../verify/world-obstacles.json', import.meta.url), 'utf8')).obstacles;
const day = (t = at(10, 30)) => { const s = createDay({ tempo: 'long' }); advance(s, t); drainEvents(s); drainCues(s); return s; };
const seen = (s, events) => events.filter((e) => routeEvent(e, engineView(s, placeAt)).seen);

// --- the table -----------------------------------------------------------------------------
const ids = Object.keys(DESTINATIONS);
assert(ids.length >= 10 && ids.length <= 14, `10 to 14 destinations (${ids.length})`);
for (const p of ['metro', 'cp', 'stage', 'barricade', 'parliament']) assert(DESTINATIONS[p], `the ${p} place is a destination`);
for (const [id, d] of Object.entries(DESTINATIONS)) {
  assert(d.name && ['metro', 'auto', 'paidal'].includes(d.mode) && Number.isFinite(d.x) && Number.isFinite(d.z), `${id} has a name, a mode and a point`);
  assert(d.arrive?.length && d.card && d.vibe, `${id} has something to say`);
  for (const p of [d, d.edge].filter(Boolean)) {
    const inWall = WALLS.find((o) => (o.h ?? 0) > 0 && (o.base || 0) < 1.8 && Math.abs(p.x - o.x) < o.w / 2 + 0.5 && Math.abs(p.z - o.z) < o.d / 2 + 0.5);
    assert(!inWall, `${id}: (${p.x}, ${p.z}) is clear of walls (${inWall?.id})`);
  }
}
// Spread over the map: the corners are hundreds of metres apart.
const span = (k) => Math.max(...ids.map((i) => DESTINATIONS[i][k])) - Math.min(...ids.map((i) => DESTINATIONS[i][k]));
assert(span('x') > 400 && span('z') > 500, `spread across the map (${span('x')} × ${span('z')} m)`);

// --- a hop moves you, your followers and what you carry, for TRAVEL_MINUTES of clock --------------
{
  const s = day();
  const w = s.objects.water;
  Object.assign(s.player, { x: w.x + 0.4, z: w.z });
  assert(act(s, { type: 'take', object: 'water' }).ok, 'pick up the water');
  const n = s.people.nikhil;
  Object.assign(n, { mode: 'follow', x: s.player.x + 1, z: s.player.z, path: [] });
  s.crew.k1 = { id: 'k1', x: s.player.x - 1, z: s.player.z, path: [], mode: 'follow' };
  s.player.crew.push('k1');
  drainEvents(s); drainCues(s);
  const t0 = s.t;
  const r = act(s, { type: 'travel', to: 'hanuman' });
  assert(r.ok, 'the hop to Hanuman Mandir works');
  const D = DESTINATIONS.hanuman;
  assert(dist(s.player, D) < 0.01, `you are at Hanuman Mandir (${s.player.x}, ${s.player.z})`);
  assert.equal(s.player.carrying, 'water', 'still carrying the water');
  assert(dist(s.objects.water, s.player) < 0.01 || s.objects.water.holder === 'player', 'the water came along');
  assert(dist(n, s.player) < 6, `Nikhil came along (${dist(n, s.player).toFixed(1)} m)`);
  assert.equal(n.mode, 'follow', 'and is still following');
  assert(dist(s.crew.k1, s.player) < 6, 'the crew came along');
  const cost = (s.t - t0) / mins(1);
  assert(Math.abs(cost - TRAVEL_MINUTES) < 0.05, `costs ${TRAVEL_MINUTES} game minutes (${cost.toFixed(2)})`);
  const cues = drainCues(s).filter((c) => c.cue === 'travel');
  assert.equal(cues.length, 1, 'one travel cue');
  assert.deepEqual({ from: cues[0].data.from, to: cues[0].data.to, mode: cues[0].data.mode }, { from: 'cp', to: 'hanuman', mode: D.mode });
  const ev = drainEvents(s);
  assert(seen(s, ev).some((e) => e.key === 'travel' && e.text), 'the arrival line reaches the screen');
  assert.equal(s.travel.hops, 1, 'the day counts hops');
}

// --- refused while busy, with a line on screen, and nothing moves -----------------------------------
const refuse = (label, set) => {
  const s = day(at(11, 0));
  set(s);
  const before = { x: s.player.x, z: s.player.z, t: s.t };
  drainEvents(s);
  const r = act(s, { type: 'travel', to: 'bangla' });
  assert(!r.ok, `refused while ${label}`);
  assert.equal(s.t, before.t, `no clock spent while ${label}`);
  if (!s.player.detained) assert(dist(s.player, before) < 0.01, `not moved while ${label}`);
  const ev = drainEvents(s);
  assert(ev.some((e) => e.who === 'player' && e.text && e.text.split(/\s+/).length <= 6), `a short line says why (${label}): ${ev.map((e) => e.text)}`);
  assert(seen(s, ev).length, `and it reaches the screen (${label})`);
  assert(!affordances(s).some((a) => a.kind === 'travel'), `no hop on offer while ${label}`);
};
refuse('chased', (s) => { s.player.chasedBy = 'c1'; s.officers.c1.mode = 'chase'; });
refuse('pinned', (s) => { s.player.pinned = { until: s.t + 5, x: s.player.x, z: s.player.z }; });
refuse('detained', (s) => { s.player.detained = true; });
refuse('riding', (s) => { s.player.riding = { to: 'jantar', x: s.player.x, z: s.player.z, path: [{ x: 0, z: 0 }], since: s.t, mid: false, dx: 0, dz: 1 }; });
refuse('in a conversation', (s) => { s.story.convo = { id: 'test', kind: 'talk', node: 'a', options: [] }; });
refuse('in a raid', (s) => { s.raid = { since: s.t, breath: 10, ring: [], lunge: null, nextAt: s.t + 1, dodges: 0 }; });
refuse('in the window escape', (s) => { s.action = { game: 'window', phase: 'pane', since: s.t }; });
refuse('in a slice day', (s) => { s.slice = true; });
{
  const s = day();
  assert(!act(s, { type: 'travel', to: 'nowhere' }).ok, 'an unknown place is refused');
  Object.assign(s.player, { x: DESTINATIONS.palika.x, z: DESTINATIONS.palika.z });
  assert(!act(s, { type: 'travel', to: 'palika' }).ok, 'no hop to where you stand');
}
// A real conversation, opened by the story, blocks it too.
{
  const s = day(at(10, 5));
  Object.assign(s.player, { x: s.people.nikhil.x + 1, z: s.people.nikhil.z });
  act(s, { type: 'situation', id: 'nikhil-lost' });
  if (s.story.convo) assert(!act(s, { type: 'travel', to: 'stage' }).ok, 'not out of the middle of a conversation');
}

// --- a police line at the destination: you land at its edge -------------------------------------
{
  const s = day(at(15, 10));
  s.police.line = 'stage';
  assert(act(s, { type: 'travel', to: 'stage' }).ok);
  assert(dist(s.player, DESTINATIONS.stage.edge) < 0.01, 'landed at the edge of the line');
  assert(travelBoard(s).find((b) => b.id === 'stage').held, 'the panel says the stage is held');
}

// --- the verifier can find it, the card offers it, the panel describes it ---------------------------
{
  const s = day();
  const hops = affordances(s).filter((a) => a.kind === 'travel');
  assert(hops.length >= 8, `hops are listed by affordances (${hops.length})`);
  assert(hops.every((a) => a.cmd.type === 'travel' && DESTINATIONS[a.cmd.to]), 'each with a travel command');
  assert(!hops.some((a) => a.cmd.to === 'metro'), 'not to where you already are (the metro gate, where the day starts)');
  const far = travelHop(s, DESTINATIONS.bangla);
  assert.equal(far?.to, 'bangla', 'a hop towards Bangla Sahib goes to Bangla Sahib');
  assert.equal(travelHop(s, { x: s.player.x + HOP_FROM / 2, z: s.player.z }), null, 'nothing near needs a hop');
  // Nothing in reach: the card points far away and carries the hop.
  Object.assign(s.player, { x: DESTINATIONS.bangla.x, z: DESTINATIONS.bangla.z });
  const card = opportunities(s)[0];
  assert(card.d > HOP_FROM && card.hop?.to, `the far card offers a hop (${card.text}, ${Math.round(card.d)} m)`);
  const board = travelBoard(s);
  assert.equal(board.length, ids.length);
  assert(board.every((b) => b.text && b.name), 'every destination has a live line');
  assert(board.find((b) => b.id === 'cp').text !== DESTINATIONS.cp.vibe, `CP is busy at 10:30 (${board.find((b) => b.id === 'cp').text})`);
}

// --- deterministic: the same hops give the same day ---------------------------------------------------
const hopDay = () => {
  const s = createDay({ tempo: 'long' });
  for (const [t, to] of [[at(10, 20), 'stage'], [at(11, 0), 'hanuman'], [at(12, 30), 'cp'], [at(14, 0), 'parliament']]) { advance(s, t - s.t); act(s, { type: 'travel', to }); }
  advance(s, 1e6);
  return JSON.stringify({ ...s, events: null, cues: null });
};
assert.equal(hopDay(), hopDay(), 'a day of hops replays exactly');

// --- a day nobody travels in is unchanged: asking the travel code questions changes nothing --------------
{
  const plain = createDay({ tempo: 'long' });
  advance(plain, 1e6);
  const asked = createDay({ tempo: 'long' });
  while (!asked.over) { travelBoard(asked); affordances(asked); opportunities(asked); travelHop(asked, { x: -400, z: 40 }); tick(asked, 0.1); }
  assert.equal(JSON.stringify({ ...asked, events: null, cues: null }), JSON.stringify({ ...plain, events: null, cues: null }), 'same day');
  assert(!('travel' in plain), 'no travel state in a day without hops');
  assert.equal(plain.ending, asked.ending);
}

console.log(`PASS travel: ${ids.length} destinations, ${TRAVEL_MINUTES} game minutes a hop`);
