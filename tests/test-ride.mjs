// The e-rickshaw between CP and Jantar Mantar: hop on at a stand, the ride moves you along the streets,
// the driver talks, and you get off at the other end (or half way). Not with a constable on your heels.
import assert from 'node:assert/strict';
import { createDay, advance, act, affordances, opportunities, dist, SPOTS, at, drainEvents, rickStandAt } from '../dist/loop/rules.js';

const s = createDay({ tempo: 'long' });
advance(s, at(10, 20));
Object.assign(s.player, SPOTS.rickCP);
assert.equal(rickStandAt(s.player), 'cp');
assert(affordances(s).some((a) => a.id === 'ride:jantar'), 'the ride to Jantar Mantar is on the list at the CP stand');
assert(opportunities(s).some((o) => o.id === 'ride:jantar'), 'and on the card');
assert(!act(s, { type: 'ride', to: 'cp' }).ok, 'no ride to where you already are');
drainEvents(s);
assert(act(s, { type: 'ride', to: 'jantar' }).ok);
assert(s.player.riding);
assert(drainEvents(s).some((e) => e.key === 'ride-start' && e.text), 'the driver says something');
assert(!act(s, { type: 'take', object: 'speaker' }).ok, 'no grabbing things off a moving rickshaw');
assert.deepEqual(affordances(s).map((a) => a.id), ['ride:off']);
const t0 = s.t;
for (let i = 0; i < 1200 && s.player.riding; i++) { s.player.x += 50; advance(s, 0.1); } // the client's input is ignored while riding
assert(!s.player.riding, 'the ride ends');
assert(dist(s.player, SPOTS.rickJantar) < 0.5, 'at the Jantar Mantar stand');
assert(s.t - t0 < 60, `quicker than walking (${(s.t - t0).toFixed(1)} s)`);
const said = drainEvents(s).map((e) => e.key);
assert(said.includes('ride-mid') && said.includes('ride-arrive'), 'the driver talks on the way and at the end');
assert(s.memo.ride, 'the ride is remembered');

// And back, hopping off half way.
assert(act(s, { type: 'ride', to: 'cp' }).ok);
advance(s, 10);
const mid = { x: s.player.x, z: s.player.z };
assert(dist(mid, SPOTS.rickJantar) > 40, 'the rickshaw is on its way');
assert(act(s, { type: 'ride', to: 'off' }).ok);
assert(!s.player.riding);
advance(s, 1);
assert(dist(s.player, mid) < 0.01, 'off the rickshaw, you stay where you got off');

// With a constable chasing you, the driver won't take you.
const c = createDay({ tempo: 'long' });
advance(c, at(10, 20));
Object.assign(c.player, SPOTS.rickCP);
c.player.chasedBy = 'c2';
assert(!affordances(c).some((a) => a.kind === 'ride'), 'no ride on the list while chased');
assert.equal(act(c, { type: 'ride', to: 'jantar' }).say, 'ride-chased');
console.log('ride ok');
