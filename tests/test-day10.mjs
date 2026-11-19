// The 10-minute day (dist/loop/dares.js, director.js, reel.js, modes.js): it is the default, its mischief list is on
// screen from the first second and changes with the loop, dares and aura pay followers with a stamp and a cutaway,
// the trouble director brings an incident after a quiet stretch, backs off after a peak, is deterministic and never
// fires in a conversation, detention or chase, every incident is something done with the body and pays, and the day
// ends on a reel that carries the ending's headline and role.
import assert from 'node:assert/strict';
import * as R from '../dist/loop/rules.js';
import { dayOptions, tempoFor, TITLE } from '../dist/loop/modes.js';
import { DARE_SETS, dareSet } from '../dist/loop/dares.js';
import { DIRECTOR, KINDS } from '../dist/loop/director.js';
import { routeEvent, routePhone, engineView, allowBubble } from '../dist/loop/present.js';
import { createRecorder, replayRecording, setInputs } from '../dist/loop/trace.js';

const q = (s) => new URLSearchParams(s);
const day = (loop = 1) => { R.setTempo('slice'); return R.createDay({ mischief: { loop } }); };
const drain = (s) => { const c = R.drainCues(s); R.drainEvents(s); return c; };
const far = R.DESTINATIONS.bangla; // nothing to do out here: no constable, no crowd, no object
const goFar = (s) => Object.assign(s.player, { x: far.x, z: far.z });

// --- the default -------------------------------------------------------------------------------
{
  assert.deepEqual(dayOptions(q('')), { tempo: 'slice', mischief: { loop: 1 } }, 'no query: the 10-minute day with the mischief list');
  assert.deepEqual(dayOptions(q('?short'), { loop: 3 }), { tempo: 'slice', mischief: { loop: 3 } }, '?short is the same day, at the loop the client keeps');
  assert.deepEqual(dayOptions(q('?long')), { tempo: 'long' }, '?long keeps the 32-minute day');
  assert.deepEqual(dayOptions(q(''), { slice: true }), { slice: true });
  assert.deepEqual(dayOptions(q(''), { replay: { tempo: 'long' } }), { tempo: 'long' }, 'a witness replays the day it was found in');
  assert.equal(tempoFor(q('')), 'slice');
  assert.equal(tempoFor(q('?long')), 'long');
  assert.match(TITLE.day, /10 min/);
  const s = R.createDay(dayOptions(q('')));
  assert.equal(s.tempo, R.TEMPO.slice, 'the default day runs at 1.25 s a game minute');
  assert.equal(R.at(18, 0), 600, '10:00 to 18:00 is ten real minutes');
  R.advance(s, 601);
  assert(s.over, 'the day is over after ten minutes');
}

// --- the mischief list -------------------------------------------------------------------------
{
  const s = day(1), v = R.mischiefView(s);
  assert(v && v.kind === 'day', 'the HUD has a view');
  assert(v.dares.length >= 5 && v.dares.length <= 6, `five or six dares (${v.dares.length})`);
  assert(v.dares.some((d) => d.open), 'one can be done from the first second');
  for (const d of v.dares) assert(d.text.split(/\s+/).length <= 8, `short dare: ${d.text}`);
  assert(v.dares.every((d) => R.DESTINATIONS[d.at]), 'each dare names a fast-travel destination');
  assert.equal(new Set(v.dares.map((d) => d.at)).size >= 3, true, 'spread over the map');
  const phases = new Set(DARE_SETS[0].map((d) => d.from));
  assert(phases.size >= 2, 'spread over the day');
  const ids = (loop) => dareSet(loop).map((d) => d.id).join();
  assert.notEqual(ids(1), ids(2), 'a new set on the second loop');
  assert.notEqual(ids(2), ids(3), 'and the third');
  assert.equal(ids(4), ids(2), 'later loops cycle the harder sets');
  assert.equal(R.mischiefView(day(2)).dares[0].id, 'topi2');
  // A place dare from places.js, if it is wired in, takes the last slot.
  const place = { id: 'place-x', text: 'Kuch karo.', done: () => false };
  assert.equal(dareSet(1, [place]).at(-1).id, 'place-x');
  // A normal or long day has no list.
  R.setTempo('long');
  assert.equal(R.mischiefView(R.createDay({ tempo: 'long' })), null);
  assert.equal(R.createDay({ tempo: 'long' }).trouble, undefined, 'no director on the long day');
}

// --- a dare: the topi, done by hand; and the speaker at the CP stop ------------------------------
{
  const s = day(1);
  R.advance(s, 1); drain(s);
  const c1 = s.officers.c1;
  Object.assign(s.player, { x: c1.x + 1.5, z: c1.z });
  assert(R.affordances(s).some((a) => a.id === 'snatch:c1'), 'Yadav ji at the metro: a topi to snatch at once');
  assert(R.act(s, { type: 'snatch', to: 'c1' }).ok);
  assert.equal(s.player.chasedBy, 'c1');
  goFar(s); // gone: he can't see you
  let cues = [];
  for (let i = 0; i < 80 && s.player.chasedBy; i++) { R.tick(s, 0.1); cues.push(...drain(s)); }
  assert(!s.player.chasedBy, 'he lost you');
  const stamp = cues.find((c) => c.cue === 'slice:dare');
  assert(stamp && stamp.data.id === 'topi', 'the topi dare is stamped');
  assert(cues.some((c) => c.cue === 'slice:cutaway'), 'with a cutaway');
  const pops = cues.filter((c) => c.cue === 'slice:followers');
  assert(pops.some((c) => c.data.why === 'dare'), 'and a follower pop for the dare');
  assert(s.mischief.followers >= 1800, `followers ${s.mischief.followers}`);
  assert(R.mischiefView(s).dares.find((d) => d.id === 'topi').done);
  assert(s.mischief.moments.some((m) => m.kind === 'dare'), 'the dare is a moment for the reel');
  // The speaker, put down playing at the CP stop.
  const sp = s.objects.speaker;
  Object.assign(s.player, { x: sp.x + 0.5, z: sp.z });
  assert(R.act(s, { type: 'take', object: 'speaker', witnesses: [] }).ok);
  Object.assign(s.player, { x: 100, z: -190 });
  R.act(s, { type: 'drop' });
  R.tick(s, 0.1);
  assert(R.mischiefView(s).dares.find((d) => d.id === 'speaker').done, 'speaker dare done');
}

// --- followers: aura pays, doubled by Meera's camera ----------------------------------------------
{
  const s = day(1);
  goFar(s); R.tick(s, 0.1); drain(s);
  const before = s.mischief.followers;
  s.player.rep.aura = 0;
  s.mischief.auraIn += 5; // as addRep does
  R.tick(s, 0.1);
  assert.equal(s.mischief.followers - before, 600, 'five aura is 600 followers');
  Object.assign(s.people.meera, { x: s.player.x + 3, z: s.player.z, path: [] });
  s.mischief.auraIn += 5;
  R.tick(s, 0.1);
  assert.equal(s.mischief.followers - before, 1800, 'near Meera it doubles');
  assert.equal(R.mischiefView(s).multiplier, 2);
}

// --- the director: fires after quiet, backs off after a peak, deterministic ---------------------------
function quietDay() {
  const s = day(1);
  goFar(s);
  const fired = [];
  while (s.t < 120) {
    setInputs(s, { x: far.x, z: far.z });
    R.tick(s, 0.1);
    for (const c of drain(s)) if (c.cue === 'incident') fired.push({ t: s.t, kind: c.data.kind });
    if (fired.length) break;
  }
  return { s, fired };
}
{
  const { s, fired } = quietDay();
  assert(fired.length === 1, 'trouble came');
  assert(fired[0].t >= DIRECTOR.quiet - 0.2 && fired[0].t <= DIRECTOR.quiet + DIRECTOR.sample + 0.5, `after ~30 s of nothing (${fired[0].t.toFixed(1)})`);
  assert(s.trouble.live, 'an incident is live');
  assert(R.affordances(s).some((a) => a.kind === 'incident' || a.kind === 'snatch' || a.id === 'incident:mark' || a.kind === 'go'), 'it is listed by affordances');
  const again = quietDay();
  assert.deepEqual(again.fired, fired, 'the same day brings the same trouble');
  assert.equal(JSON.stringify(again.s.trouble), JSON.stringify(s.trouble), 'and the same director state');
}
{
  // A peak: it backs off for DIRECTOR.relax seconds, however quiet it is.
  const s = day(1);
  goFar(s);
  s.trouble.intensity = 90;
  let first = null;
  while (s.t < 150 && first == null) { setInputs(s, { x: far.x, z: far.z }); R.tick(s, 0.1); for (const c of drain(s)) if (c.cue === 'incident') first = s.t; }
  assert(s.trouble.peaks >= 1, 'the peak was noticed');
  assert(first != null && first >= DIRECTOR.quiet, 'it still comes eventually');
  // Peak at 25 s (just before quiet would fire): nothing until 25 + relax.
  const p = day(1);
  goFar(p);
  let at = null;
  while (p.t < 150 && at == null) {
    setInputs(p, { x: far.x, z: far.z });
    if (Math.abs(p.t - 25) < 0.05) p.trouble.intensity = 95;
    R.tick(p, 0.1);
    for (const c of drain(p)) if (c.cue === 'incident') at = p.t;
  }
  assert(at != null && at >= 25 + DIRECTOR.relax - 0.2, `backs off after a peak (fired at ${at?.toFixed(1)})`);
}

// --- never in a conversation, detention or chase ---------------------------------------------------
{
  // A conversation held open for 90 s, out where nothing happens.
  const s = day(1);
  R.advance(s, 2);
  Object.assign(s.player, { x: s.people.nikhil.x + 1, z: s.people.nikhil.z });
  assert(R.act(s, { type: 'talk', to: 'nikhil' }).ok && s.story.convo, 'a card is open');
  let n = 0;
  while (s.t < 92) { R.tick(s, 0.1); for (const c of drain(s)) if (c.cue === 'incident') n++; }
  assert(s.story.convo, 'still talking');
  assert.equal(n, 0, 'no trouble in a conversation');
  // Detained: no trouble on the bus.
  const d = day(1);
  R.advance(d, 2);
  const o = d.officers.c1;
  Object.assign(d.player, { x: o.x + 1, z: o.z });
  d.player.rep.heat = 60;
  R.act(d, { type: 'pester', to: 'c1', how: 'detainme' });
  assert(d.player.detained, 'on the bus');
  let m = 0;
  for (let i = 0; i < 700 && d.player.detained; i++) { R.tick(d, 0.1); for (const c of drain(d)) if (c.cue === 'incident') m++; }
  assert.equal(m, 0, 'no trouble in detention');
  // Over a whole played day: at every incident start, nobody was chasing, talking to or holding the player.
  const t = day(2);
  let busyAtFire = 0, fires = 0, prevBusy = false;
  while (!t.over) {
    const pl = t.player;
    prevBusy = !!(pl.chasedBy || pl.detained || t.story.convo || t.raid || pl.pinned);
    R.tick(t, 0.1);
    for (const c of drain(t)) if (c.cue === 'incident') { fires++; if (prevBusy) busyAtFire++; }
  }
  assert(fires >= 3, `an idle day gets trouble several times (${fires})`);
  assert.equal(busyAtFire, 0, 'never while chased, held, talking or in a game');
}

// --- every incident: done with the body, pays, listed --------------------------------------------
function force(kind, loop = 1) {
  const s = day(loop);
  R.advance(s, 20); drain(s);
  goFar(s);
  s.trouble.n = KINDS.indexOf(kind); s.trouble.quiet = 999; s.trouble.coolUntil = 0; s.trouble.sampleT = 99; s.trouble.near = false;
  R.tick(s, 0.1);
  assert.equal(s.trouble.live?.kind, kind, `${kind} starts`);
  return s;
}
const pay = (s) => s.mischief.followers;
{
  // The cart rolls at you: stop it, then ride it.
  const s = force('cart');
  const a = R.affordances(s).find((x) => x.id === 'incident:stop');
  assert(a, 'stopping the cart is an affordance');
  assert.equal(s.action?.game, 'cart', 'a skill moment while it rolls');
  let ok = false;
  for (let i = 0; i < 120 && !ok; i++) {
    const c = R.incidentTarget(s);
    const d = R.dist(s.player, c);
    if (d < 1.6) ok = R.act(s, { type: 'incident', move: 'stop' }).ok;
    else { s.player.x += ((c.x - s.player.x) / d) * Math.min(d, 0.8); s.player.z += ((c.z - s.player.z) / d) * Math.min(d, 0.8); }
    R.tick(s, 0.1);
  }
  assert(ok, 'stopped the cart by running into it');
  const after = pay(s);
  assert(after > 0, 'stopping it pays');
  assert(R.affordances(s).some((x) => x.id === 'incident:ride'), 'then you can ride it');
  assert(R.act(s, { type: 'incident', move: 'ride' }).ok);
  assert(!R.act(s, { type: 'incident', move: 'stop' }).ok, 'stopping it again while riding does not pay twice');
  let cues = [];
  for (let i = 0; i < 80 && s.trouble.live; i++) { R.tick(s, 0.1); cues.push(...drain(s)); }
  assert(cues.some((c) => c.cue === 'action:cart:win' && c.data.ride), 'the ride wins');
  assert(pay(s) > after, 'and pays more');
  assert(!s.action, 'the game is over');
}
{
  // Nikhil runs past with the megaphone: grab it, then the constable is after you.
  const s = force('nikhil');
  assert.equal(s.objects.megaphone.holder, 'nikhil');
  let ok = false;
  for (let i = 0; i < 150 && !ok && s.trouble.live; i++) {
    const n = R.incidentTarget(s), d = R.dist(s.player, n);
    if (d < 1.6) ok = R.act(s, { type: 'incident', move: 'grab' }).ok;
    else { s.player.x += ((n.x - s.player.x) / d) * Math.min(d, 0.6); s.player.z += ((n.z - s.player.z) / d) * Math.min(d, 0.6); }
    R.tick(s, 0.1); drain(s);
  }
  assert(ok, 'grabbed the megaphone');
  assert.equal(s.player.carrying, 'megaphone');
  assert(s.player.chasedBy, 'and a constable is chasing you');
  goFar(s); // break line of sight
  const before = pay(s);
  for (let i = 0; i < 100 && s.trouble.live; i++) { R.tick(s, 0.1); drain(s); }
  assert(!s.trouble.live && pay(s) > before, 'losing him pays');
  // Left alone, the constable gets Nikhil and the megaphone goes back to Dev.
  const t = force('nikhil');
  for (let i = 0; i < 300 && t.trouble.live; i++) { R.tick(t, 0.1); drain(t); }
  assert.equal(t.objects.megaphone.holder, 'dev', 'back to Dev');
  assert.notEqual(t.people.nikhil.mode, 'incident');
}
{
  // A suspicious constable: duck into a crowd and he gives up.
  const s = force('shak');
  assert.equal(s.action?.game, 'shak');
  const c = R.CROWD_CENTERS.cp;
  s.crowd.cpWaiting = 10;
  Object.assign(s.player, { x: c.x, z: c.z });
  const before = pay(s);
  const cues = [];
  for (let i = 0; i < 20 && s.trouble.live; i++) { R.tick(s, 0.1); cues.push(...drain(s)); }
  assert(cues.some((x) => x.cue === 'action:shak:win'), 'ducked into the crowd');
  assert(pay(s) > before);
  // Stand there and it's a chase; a catch is the light one, not the van.
  const t = force('shak');
  for (let i = 0; i < 60 && !t.player.chasedBy; i++) { setInputs(t, { x: t.player.x, z: t.player.z }); R.tick(t, 0.1); drain(t); }
  assert(t.player.chasedBy, 'he chases');
  for (let i = 0; i < 100 && t.player.chasedBy; i++) { R.tick(t, 0.1); drain(t); }
  assert(!t.player.detained, 'caught over nothing: uthak-baithak, not the van');
}
{
  // Meera's slow-mo: sprint to her mark in time.
  const s = force('reel');
  const mark = s.trouble.live.mark;
  assert(R.affordances(s).some((a) => a.id === 'incident:mark'));
  const before = pay(s);
  for (let i = 0; i < 80 && s.trouble.live; i++) {
    const d = R.dist(s.player, mark);
    if (d > 0.1) { s.player.x += ((mark.x - s.player.x) / d) * Math.min(d, 0.8); s.player.z += ((mark.z - s.player.z) / d) * Math.min(d, 0.8); }
    R.tick(s, 0.1); drain(s);
  }
  assert(pay(s) > before, 'the reel pays');
  // Too slow: no pay.
  const t = force('reel'), b = pay(t);
  for (let i = 0; i < 100 && t.trouble.live; i++) { R.tick(t, 0.1); drain(t); }
  assert.equal(pay(t), b, 'standing still pays nothing');
}
{
  // The patrol: a constable strolls up with his topi loose; snatch it and lose him.
  const s = force('topi');
  const id = s.trouble.live.id;
  for (let i = 0; i < 200 && !R.affordances(s).some((a) => a.id === `snatch:${id}`); i++) { R.tick(s, 0.1); drain(s); }
  const o = R.officerById(s, id);
  assert(R.dist(o, s.player) < 4, 'he came to you');
  assert(R.act(s, { type: 'snatch', to: id }).ok, 'snatch');
  goFar(s); Object.assign(s.player, { x: far.x + 60, z: far.z });
  const before = pay(s);
  for (let i = 0; i < 100 && s.trouble.live; i++) { R.tick(s, 0.1); drain(s); }
  assert(pay(s) > before, 'the patrol topi pays');
  assert(!s.trouble.live);
}

// --- what reaches the screen on the 10-minute day ----------------------------------------------
{
  const s = day(1);
  const screen = {};
  const v = (moving, still = 5) => engineView(s, R.placeAt, { moving, still, screen });
  const meera = s.people.meera;
  Object.assign(s.player, { x: meera.x + 2, z: meera.z });
  const long = { t: s.t, who: 'meera', text: 'Ek line jo saat se zyada shabdon ki hai, bilkul.', kind: 'line', key: 'x' };
  const bark = { t: s.t, who: 'meera', text: 'Bhai, bhaag!', kind: 'line', key: 'y' };
  assert(!routeEvent(long, v(true)).seen, 'a long line is not read while running past');
  assert(routeEvent(bark, v(true)).seen, 'a bark is');
  assert(routeEvent(long, v(false)).seen, 'stopped near it, the long line plays');
  assert(!routeEvent(long, v(false, 0.5)).seen, 'not the instant you stop');
  assert(!allowBubble('ek do teen char paanch chhe saat', { day: true, moving: true }));
  assert(allowBubble('ek do teen', { day: true, moving: true }));
  // The phone: a buzz and one line.
  const a = routePhone({ t: 10, text: 'pehli line, kaafi lambi hai yeh wali line' }, v(false));
  const b = routePhone({ t: 12, text: 'doosri line' }, v(false));
  assert(a.seen && a.text.split(/\s+/).length <= 7, `one short line (${a.text})`);
  assert(!b.seen && b.channel === 'buzz', 'the next is a buzz');
  // The long day is as it was.
  R.setTempo('long');
  const L = R.createDay({ tempo: 'long' });
  const lv = engineView(L, R.placeAt, { moving: true, screen: {} });
  Object.assign(L.player, { x: L.people.meera.x + 2, z: L.people.meera.z });
  assert(routeEvent({ ...long, t: 0 }, lv).seen, 'the long day still shows it');
}

// --- the end reel ------------------------------------------------------------------------------------
{
  const s = day(1);
  R.advance(s, 601);
  assert(s.over && s.outcome && s.outcome.callbacks, 'the ending card is still made');
  const r = s.mischief.reel;
  assert(r, 'and the reel');
  assert.equal(r.comments.length, 3, 'three comments');
  assert(r.headline && r.role, 'with the headline and the role');
  assert(Array.isArray(r.moments) && r.moments.length <= 5);
  assert(typeof r.followers === 'number');
}

// --- a recorded 10-minute day replays the same ------------------------------------------------------
{
  const s = day(2);
  const rec = createRecorder(s, { loop: 2 });
  for (let k = 0; k < 900; k++) {
    if (k === 29) { const o = s.officers.c1; Object.assign(s.player, { x: o.x + 1, z: o.z }); rec.inputs(s.player); } // the client's order: inputs, tick; a key press comes before the next tick
    if (k === 30) { const cmd = { type: 'snatch', to: 'c1' }; rec.act(cmd); R.act(s, cmd); }
    if (k > 30 && k < 200) { s.player.x += 0.5; rec.inputs(s.player); }
    R.tick(s, 0.1); rec.tick();
  }
  const r = rec.recording();
  assert.deepEqual(r.opts, { mischief: { loop: 2 } });
  const back = replayRecording(JSON.parse(JSON.stringify(r)), R);
  assert.equal(back.mischief.followers, s.mischief.followers, 'same followers');
  assert.equal(JSON.stringify(back.trouble.fired), JSON.stringify(s.trouble.fired), 'same trouble');
}
R.setTempo('long');
console.log('10-minute day ok');
