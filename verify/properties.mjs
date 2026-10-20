// The properties the game must satisfy. Invariants hold in every state; day properties hold for every
// finished day; exploration properties (reachability, agency) are judged in explore.mjs and run.mjs.
// Written against generic engine data (objects, holders, people, phases, endings) so content changes
// don't break them; a property that stops making sense should be edited here, with a reason.
import { E, META } from './engine.mjs';

const BOUND = 90; // metres from the origin; the ground plane is 125 x 150
const CHASE_MAX = 20; // clock minutes: a chase longer than this means the lose/catch logic is stuck
const finite = (p) => p && Number.isFinite(p.x) && Number.isFinite(p.z);
const inside = (p) => Math.abs(p.x) <= BOUND && Math.abs(p.z) <= BOUND;

/** name -> (s) => null | 'what is wrong'. Checked every simulated second during exploration. */
export const INVARIANTS = {
  'one-holder-per-object'(s) {
    for (const [id, o] of Object.entries(s.objects)) {
      if (o.holder === 'player' && s.player.carrying !== id) return `${id} held by player but player carries ${s.player.carrying}`;
      if (s.player.carrying === id && o.holder !== 'player') return `player carries ${id} but its holder is ${o.holder}`;
      const p = s.people[o.holder];
      if (p && p.carrying && p.carrying !== id) return `${id} held by ${o.holder}, who carries ${p.carrying}`;
    }
    const carried = Object.values(s.people).map((p) => p.carrying).filter(Boolean);
    if (new Set(carried).size !== carried.length) return `two people carry the same object: ${carried.join(',')}`;
    return null;
  },
  'positions-finite-and-on-map'(s) {
    const all = [['player', s.player], ['bus', s.bus], ...Object.entries(s.people), ...Object.entries(s.officers), ...Object.entries(s.objects), ...Object.entries(s.crew)];
    for (const [id, p] of all) {
      if (!finite(p)) return `${id} has a non-finite position`;
      if (!inside(p)) return `${id} is off the map at ${p.x.toFixed(1)},${p.z.toFixed(1)}`;
    }
    return null;
  },
  'crowds-and-groups-non-negative'(s) {
    for (const [k, v] of Object.entries(s.crowd)) if (!(v >= 0) || !Number.isFinite(v)) return `crowd.${k} = ${v}`;
    for (const [k, g] of Object.entries(s.groups)) if (!(g.size >= 0)) return `groups.${k}.size = ${g.size}`;
    return null;
  },
  'phase-matches-clock'(s) {
    const want = E.phaseAt(s.t);
    return s.phase === want ? null : `phase ${s.phase} at ${E.clockText(s.t)}, expected ${want}`;
  },
  'reputation-in-range'(s) {
    for (const [k, v] of Object.entries(s.player.rep)) if (!(v >= 0 && v <= 100)) return `rep.${k} = ${v}`;
    return null;
  },
  'crew-consistent'(s) {
    for (const id of s.player.crew) if (!s.crew[id]) return `player.crew lists ${id}, which does not exist`;
    if (s.player.crew.length > 8) return `crew of ${s.player.crew.length} (max 8)`;
    return null;
  },
  'chaser-exists'(s) {
    const c = s.player.chasedBy;
    return !c || s.people[c] || s.officers[c] ? null : `chased by unknown officer ${c}`;
  },
  'bus-within-capacity'(s) {
    return s.bus.load >= 0 && s.bus.load <= 14 ? null : `bus load ${s.bus.load}`;
  },
  'detained-player-is-at-the-vehicle'(s) {
    if (!s.player.detained) return null;
    const d = E.detentionPos(s);
    return E.dist(s.player, d) < 1e-6 ? null : `detained player is ${E.dist(s.player, d).toFixed(1)} m from the detention vehicle`;
  },
  'ended-days-have-a-card'(s) {
    if (!s.over) return null;
    if (!META.endings.includes(s.ending)) return `unknown ending ${s.ending}`;
    return s.outcome ? null : 'day over without an outcome card';
  },
};

export function checkInvariants(s) {
  const out = [];
  for (const [name, f] of Object.entries(INVARIANTS)) {
    let msg;
    try { msg = f(s); } catch (e) { msg = `threw ${e.message}`; }
    if (msg) out.push({ name, msg, clock: E.clockText(s.t) });
  }
  return out;
}

/** Properties of a finished day (a run that has been advanced to the end). */
export function checkDay(run) {
  const out = [];
  const { s } = run;
  if (!s.over) out.push({ name: 'day-ends', msg: `still running at ${E.clockText(s.t)}` });
  else if (s.t > E.at(18, 0) + 1) out.push({ name: 'day-ends', msg: `ended late, at ${E.clockText(s.t)}` });
  for (const id of run.silent) out.push({ name: 'no-silent-rule', msg: `rule ${id} fired, but nothing was said or shown and its line never followed within 5 clock minutes` });
  if (run.longChase > CHASE_MAX) out.push({ name: 'chases-end', msg: `a chase lasted ${run.longChase} clock minutes (max ${CHASE_MAX})` });
  // The ending card may only cite things that happened: every callback's cause is in the memo.
  for (const c of s.callbacks) if (c.t > c.at + 1e-6) out.push({ name: 'card-cites-real-causes', msg: `callback ${c.key} has its cause after its effect` });
  return out;
}

/** Clock minutes, for reporting gaps and durations. */
export const clockMin = (seconds) => seconds / E.SECONDS_PER_MINUTE;
