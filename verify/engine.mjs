// Loads the game engine for verification and instruments it without changing it.
// Everything verify/ knows about the game comes through here, so the checker survives content rebuilds:
// it reads RULES, ENDINGS, LINKS and affordances() rather than hard-coding today's day.
import * as R from '../dist/loop/rules.js';
import * as C from '../dist/loop/content.js';

export const E = R;
export const CONTENT = C;

export const META = {
  rules: R.RULES.map((r) => r.id),
  endings: Object.keys(C.ENDINGS),
  links: Object.keys(C.LINKS),
  rumours: Object.keys(C.RUMOURS),
};

// Instrument rules: record each firing and whether it said or showed anything that same tick.
// Wrapping rule.then is invisible to the game (same arguments, same effects).
export const firings = []; // { id, t, visible } for the day currently being checked; cleared by resetFirings()
for (const rule of R.RULES) {
  if (rule.__verified) continue;
  const then = rule.then;
  rule.then = function (s) {
    const ev = s.events.length, cu = s.cues.length;
    const r = then.call(this, s);
    firings.push({ id: rule.id, t: s.t, visible: s.events.length > ev || s.cues.length > cu, says: rule.says ?? null });
    return r;
  };
  rule.__verified = true;
}
export const resetFirings = () => { firings.length = 0; };

// Sight lines: the game's own test (simulation.js visible) against the world's obstacles, snapshotted
// from the running game (verify/world-obstacles.json; the conformance run checks it is still current),
// plus the moving shuttle at the engine's bus position, exactly as main.js places it.
import { visible } from '../dist/simulation.js';
import { readFileSync } from 'node:fs';
const WORLD = JSON.parse(readFileSync(new URL('./world-obstacles.json', import.meta.url), 'utf8'));
export const OBSTACLES = WORLD.obstacles;
const obstaclesAt = (s) => [...OBSTACLES, { id: 'shuttle', x: s.bus.x, z: s.bus.z, ...WORLD.shuttle }];
/** lineOfSight(id, entity) for E.witnesses(): can that person or officer see the player? */
export const sightOf = (s) => { const obs = obstaclesAt(s); return (_id, e) => visible(e, s.player, obs); };
/** The client's per-tick `unseen` input: the chaser has lost sight of the player. */
export function unseenBy(s) {
  const c = s.player.chasedBy && (s.people[s.player.chasedBy] || s.officers[s.player.chasedBy]);
  return !!c && !visible(c, s.player, obstaclesAt(s));
}
