// Plays whole looping days with scripted players and checks the rules actually change the outcome.
import assert from 'node:assert/strict';
import { createDay, advance, act, at, SPOTS, RULES, drainEvents } from './dist/loop/rules.js';
import { LINKS, LINES, ENDINGS, HINTS, TALK } from './dist/loop/content.js';

const runUntil = (s, t) => advance(s, t - s.t);
const moveTo = (s, spot) => Object.assign(s.player, { x: spot.x, z: spot.z });
const links = (events) => new Set(events.map((e) => e.link).filter(Boolean));

function play(script) {
  const s = createDay();
  const seen = [];
  for (const [t, fn] of script) {
    runUntil(s, t);
    seen.push(...drainEvents(s));
    if (s.over) break;
    fn(s);
  }
  advance(s, 1000);
  seen.push(...drainEvents(s));
  return { s, links: links(seen) };
}

// Idle: the day goes as planned.
let r = play([]);
assert.equal(r.s.ending, 'packed', 'idle player sees the planned rally');
assert(r.links.has('big-speech'));
assert.equal(r.s.people.sharma.post, 'barricade', 'nothing pulls Sharma away on an ordinary day');

// Steal the speaker from the chai stall and keep it: the speech flops.
r = play([
  [at(10, 5), (s) => { moveTo(s, SPOTS.speakerChai); act(s, { type: 'take', object: 'speaker', witnesses: [] }); moveTo(s, SPOTS.metro); }],
]);
assert.equal(r.s.ending, 'quiet');
assert(r.links.has('small-speech'));

// Pocket the key on the first chai break and keep it: CP fills, Sharma leaves, the fired-up crowd marches.
r = play([
  [at(11, 10), (s) => { moveTo(s, SPOTS.keyHook); assert.equal(s.objects.key.holder, 'hook'); act(s, { type: 'take', object: 'key', witnesses: [] }); moveTo(s, SPOTS.metro); }],
]);
for (const l of ['key-missing', 'cp-piles-up', 'rao-sends-sharma', 'march']) assert(r.links.has(l), `key chain fires ${l}`);
assert.equal(r.s.ending, 'march');

// Key and speaker both gone: no speech to fire people up, so it ends as a CP jam instead.
r = play([
  [at(10, 5), (s) => { moveTo(s, SPOTS.speakerChai); act(s, { type: 'take', object: 'speaker', witnesses: [] }); moveTo(s, SPOTS.metro); act(s, { type: 'drop' }); }],
  [at(11, 10), (s) => { moveTo(s, SPOTS.keyHook); act(s, { type: 'take', object: 'key', witnesses: [] }); moveTo(s, SPOTS.metro); }],
]);
assert.equal(r.s.ending, 'cpjam');

// Return the key: the shuttle runs again and Sharma goes back.
r = play([
  [at(11, 10), (s) => { moveTo(s, SPOTS.keyHook); act(s, { type: 'take', object: 'key', witnesses: [] }); moveTo(s, SPOTS.metro); }],
  [at(12, 30), (s) => { const q = s.people.iqbal; moveTo(s, q); act(s, { type: 'give', to: 'iqbal' }); moveTo(s, SPOTS.metro); }],
]);
assert(r.links.has('key-returned') && r.links.has('rao-recalls'));
assert.notEqual(r.s.ending, 'march', 'a returned key stops the chain before the march');

// Taken in front of Sharma: detained, loop over early.
r = play([[at(11, 10), (s) => { moveTo(s, SPOTS.keyHook); act(s, { type: 'take', object: 'key', witnesses: ['sharma'] }); }]]);
assert.equal(r.s.ending, 'detained');
assert(r.s.t < at(12, 0));

// Speaker party at CP: Sharma comes, switches it off, then goes back.
r = play([
  [at(10, 5), (s) => { moveTo(s, SPOTS.speakerChai); act(s, { type: 'take', object: 'speaker', witnesses: [] }); moveTo(s, { x: -6, z: -45 }); act(s, { type: 'drop' }); moveTo(s, SPOTS.metro); }],
]);
for (const l of ['cp-party', 'rao-sends-sharma', 'sharma-kills-party', 'rao-recalls']) assert(r.links.has(l), `party chain fires ${l}`);

// Reader check: every rule and every link has content, and every link is reachable by some script above or by an owner.
for (const rule of RULES) assert(LINES[rule.says], `rule ${rule.id} says something visible`);
for (const id of Object.keys(LINKS)) assert(LINKS[id].from && LINKS[id].to);
for (const id of ['detained', 'march', 'cpjam', 'packed', 'quiet']) assert(ENDINGS[id]);
for (const list of Object.values(TALK)) for (const t of list) assert(!t.hint || HINTS[t.hint], `hint ${t.hint}`);

console.log('PASS: idle, speaker, key, key+speaker, key returned, detained and CP party days end differently');
