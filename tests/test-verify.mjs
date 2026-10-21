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
// Sight lines (sight.js): the same theft is unseen from behind the parked shuttle and seen from the constable's side.
{
  const k = H.replay([{ wait: 64 }], 'long').s;
  Object.assign(k.player, { x: 12, z: -31 });
  assert(R.witnesses(k).includes('c2'), 'without walls Constable Meena is in range');
  assert.deepEqual(R.witnesses(k, H.SIGHT.canSee(k)), [], 'behind the parked shuttle she can\'t see you');
  Object.assign(k.player, { x: 7.4, z: -31 });
  assert(R.witnesses(k, H.SIGHT.canSee(k)).includes('c2'), 'west of the hook, she sees you');
}

// act() uses its own day's tempo even when another day (another tempo) was ticked last.
{
  R.setTempo('slice');
  const s = R.createDay({ tempo: 'slice' });
  R.advance(s, R.at(13, 30));
  R.setTempo('long');
  R.act(s, { type: 'drop' });
  assert.equal(R.clockText(s.t), '13:30', 'after act() the global tempo is this day\'s again');
  R.setTempo('long');
}
console.log('verify harness ok');
