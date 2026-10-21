// The verifier's footing: a trace replays to the identical day, a cloned day continues exactly as the
// original, and the action space lists what the player can really do.
import assert from 'node:assert/strict';
import * as H from '../verify/lib/harness.mjs';

const { R } = H;
const trace = [
  { wait: 70 },
  { do: 'take:key', cmd: { type: 'take', object: 'key' }, at: R.SPOTS.keyHook },
  { do: 'go', cmd: null, at: R.SPOTS.metro, hold: 5 },
  { do: 'talk:nikhil', cmd: { type: 'talk', to: 'nikhil' }, at: R.SPOTS.nikhilStart },
  { wait: 60 },
];
const strip = (s) => JSON.stringify({ ...s, events: [], cues: [] });
const a = H.replay(trace, 'long'), b = H.replay(trace, 'long');
assert.equal(strip(a.s), strip(b.s), 'the same trace gives the same day');

// Clone halfway and continue: the copy ends where a straight replay ends.
const half = H.replay(trace.slice(0, 3), 'long');
const copy = H.cloneRun(half);
for (const step of trace.slice(3)) H.perform(copy, step);
assert.equal(strip(copy.s), strip(a.s), 'a cloned day continues exactly as the original');

// The key hangs on its hook during Iqbal's 11:00 chai break, and the action space says so.
const morning = H.replay([{ wait: 72 }], 'long');
assert(R.affordances(morning.s).some((x) => x.id === 'take:key'), 'taking the key is on the list at 11:12');
assert(!R.affordances(H.newRun('long').s).some((x) => x.id === 'take:key'), 'but not at 10:00, while Iqbal drives');

// Talking is the engine's job now (story.js): a conversation opens, and walking away from it ends it.
const t = H.newRun('long');
Object.assign(t.s.player, { x: t.s.people.asha.x + 1, z: t.s.people.asha.z });
const r = R.act(t.s, { type: 'talk', to: 'asha' });
assert(r.ok && r.said, 'talking to Asha says something');
if (t.s.story.convo) { assert(R.act(t.s, { type: 'leave' }).ok, 'and you can walk away'); assert(!t.s.story.convo); }
console.log('verify harness ok');
