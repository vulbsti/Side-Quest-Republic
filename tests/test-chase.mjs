// The chase as a game: a constable faster than your jog, a telegraphed lunge that catches you if you keep running
// straight and grabs air if you cut away during the wind-up, and a topi you can flick off from minute one.
import assert from 'node:assert/strict';
import { createDay, advance, act, affordances, tick, dist, officerById } from '../dist/loop/rules.js';

const STEP = 0.1;
/** Snatch the first constable's topi and run away from him: straight, or cutting sideways at each wind-up. */
function snatchAndRun(dodge, speed = 6.5) {
  const s = createDay();
  advance(s, 20);
  const a = affordances(s).find((x) => x.kind === 'snatch');
  assert(a, 'a bored constable\'s topi is on offer from the start');
  const o = officerById(s, a.cmd.to);
  Object.assign(s.player, { x: o.x + 2, z: o.z });
  assert(act(s, a.cmd).ok);
  assert.equal(s.player.chasedBy, o.id, 'he chases you');
  const cues = [];
  for (let t = 0; t < 40 && s.player.chasedBy; t += STEP) {
    const c = officerById(s, s.player.chasedBy);
    let dx = s.player.x - c.x, dz = s.player.z - c.z;
    if (dodge && s.chase?.lunge?.phase === 'windup') [dx, dz] = [-dz, dx];
    const d = Math.hypot(dx, dz) || 1;
    s.player.x += (dx / d) * speed * STEP; s.player.z += (dz / d) * speed * STEP;
    tick(s, STEP);
    cues.push(...s.cues.map((x) => x.cue)); s.cues.length = 0;
  }
  return { s, cues };
}

// Running straight: he winds up, dives, and has you. A topi costs five seconds of uthak-baithak, not the van.
let { s, cues } = snatchAndRun(false);
assert(cues.includes('lunge'), 'he telegraphs a lunge');
assert(cues.includes('caught'), 'running straight gets you caught');
assert(!s.player.detained, 'a topi is not worth the van');
assert(s.player.pinned, 'you are pinned for your sit-ups');
const at = { x: s.player.x, z: s.player.z };
s.player.x += 3; tick(s, STEP);
assert(dist(s.player, at) < 1e-9, 'pinned means you stay put');
advance(s, 5.5);
assert.equal(s.player.pinned, null, 'five seconds later you are free');

// Cutting away at every wind-up: he grabs air, and after three misses (or running out of breath) he gives up.
({ s, cues } = snatchAndRun(true));
assert(cues.includes('lunge-miss'), 'a dodged lunge misses');
assert(cues.includes('chase-lost') && !cues.includes('caught'), `reading the lunge loses him: ${cues.filter((c) => /lunge|chase|caught/.test(c)).join(' ')}`);
assert(s.player.rep.aura > 0, 'the street loves you for it');
const robbed = Object.values(s.officers).find((o) => o.topiAt != null);
assert(!affordances(s).some((x) => x.id === `snatch:${robbed.id}`), 'the same constable keeps his topi on for a while');

console.log('Chase: the lunge catches a straight runner, misses a dodger; a topi costs sit-ups, not the van.');
