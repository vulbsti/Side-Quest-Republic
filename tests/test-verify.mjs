// The checker checks itself: break the game on purpose and make sure verify/ notices.
import assert from 'node:assert/strict';
import { E } from '../verify/engine.mjs';
import { newRun, exec, advanceRun, replayPlan } from '../verify/drive.mjs';
import { checkInvariants } from '../verify/properties.mjs';
import { ROUTES, unmet } from '../verify/seeds.mjs';
import { replay } from '../dist/loop/trace.js';

const play = (plan) => { const r = newRun(); for (const op of plan) exec(r, op); advanceRun(r, 1e6); return r; };

// A working intended route stops working when the rule behind it is broken (a mutation test).
const route = ROUTES['water-hidden-heat'];
assert.deepEqual(unmet(route, play(route.plan)), [], 'the heat route works on the real game');
const heat = E.RULES.find((r) => r.id === 'heat');
const then = heat.then;
heat.then = () => {};
assert(unmet(route, play(route.plan)).includes('ending:heat'), 'breaking the heat rule breaks the route');
heat.then = then;

// Invariants catch a corrupted state.
const s = E.createDay();
s.objects.key.holder = 'player'; // ...but the player isn't carrying it
assert(checkInvariants(s).some((v) => v.name === 'one-holder-per-object'));

// A plan's tick trace replays to the same day: the path ?replay= takes in the browser.
const { run, trace } = replayPlan(route.plan);
E.setTempo('slice');
const again = replay(trace, E);
E.advance(again, 1e6);
assert.equal(again.ending, run.s.ending);
assert.equal(again.t, run.s.t);

// Found by verify's explorer: a scene can leave the barricade jawan 'tense', and pestering him threw.
{
  const d = E.createDay();
  E.advance(d, E.at(14, 30));
  d.officers.r1.mood = 'tense';
  Object.assign(d.player, { x: d.officers.r1.x + 1, z: d.officers.r1.z });
  assert.equal(E.act(d, { type: 'pester', to: 'r1', how: 'career' }).ok, true);
}

console.log('PASS: verify notices a broken rule and a corrupted state, and traces replay exactly');
