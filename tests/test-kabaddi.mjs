// The kabaddi raid: shout "kabaddi" at a constable near a crowd and you're on one breath. The ring closes and lunges
// one at a time; dodge each wind-up and run home to the crowd. Do nothing and the breath runs out; run straight and
// a lunge has you. Either way you end up on the bus, as in the reel.
import assert from 'node:assert/strict';
import { createDay, advance, act, affordances, tick, dist, at, CROWD_CENTERS, raidable } from '../dist/loop/rules.js';

const STEP = 0.1;
/** At 11:30 by Constable Rawat near the stage crowd, with the stage crowd ~20 m off. */
function atTheLine() {
  const s = createDay();
  advance(s, at(11, 30) - s.t);
  const o = s.officers.c4;
  Object.assign(s.player, { x: o.x + 3, z: o.z + 8 });
  assert(raidable(s), 'a raid is on offer next to a constable with a crowd nearby');
  assert(affordances(s).some((a) => a.kind === 'raid'), 'and the explorer can find it');
  assert(act(s, { type: 'raid', move: 'start' }).ok);
  assert(s.raid && s.raid.ring.length >= 1, 'the ring forms');
  return s;
}
function play(s, { move, dodge }) {
  const home = CROWD_CENTERS.stage, cues = [];
  for (let t = 0; t < 20 && s.raid; t += STEP) {
    if (dodge && s.raid.lunge?.phase === 'windup' && !s.raid.lunge.dodged) act(s, { type: 'raid', move: 'dodge' });
    if (move) { const d = dist(s.player, home) || 1; s.player.x += ((home.x - s.player.x) / d) * Math.min(d, 4.7 * STEP); s.player.z += ((home.z - s.player.z) / d) * Math.min(d, 4.7 * STEP); }
    tick(s, STEP);
    cues.push(...s.cues.map((c) => c.cue)); s.cues.length = 0;
  }
  return cues;
}

let s = atTheLine();
let cues = play(s, { move: true, dodge: true });
assert(cues.includes('action:kabaddi:win'), `dodging every lunge on the way home wins: ${cues.filter((c) => /raid|kabaddi/.test(c)).join(' ')}`);
assert(!s.player.detained && s.player.rep.aura >= 20, 'home, and the crowd loves you');
assert(!raidable(s), 'not again straight away');

s = atTheLine();
cues = play(s, { move: false, dodge: false });
assert(cues.includes('action:kabaddi:fail') && s.player.detained, 'stand there and they have you');

s = atTheLine();
cues = play(s, { move: true, dodge: false });
assert(cues.includes('raid-lunge'), 'they lunge');
assert(cues.includes('action:kabaddi:fail') && s.player.detained, `running straight home, a lunge has you: ${cues.filter((c) => /raid|kabaddi/.test(c)).join(' ')}`);

console.log('Kabaddi: dodge every lunge and get home; stand still and the breath runs out.');
