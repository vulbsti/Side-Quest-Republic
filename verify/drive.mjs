// Drives a day the way a player can: walk somewhere, do something, wait. A run is plain data
// (state + plan), so the explorer can clone it at any moment. A plan is the canonical record of a run:
// re-executing it from 10:00 must reproduce the same day (that is checked), and it expands to a
// tick-level trace (dist/loop/trace.js format) that the browser replays with ?replay=.
import { E, firings, sightOf, unseenBy } from './engine.mjs';
import { createRecorder } from '../dist/loop/trace.js';
import { checkInvariants } from './properties.mjs';

export const STEP = 0.1;
export const SPEED = 6; // m/s: a player mixing jogging (4.7) and sprinting (8.1)
const REACH = 1.6; // how close the player walks to a target before acting (the UI's E range is ~2-3 m)
const CHANGE_EVERY = 1; // seconds between affordance checks while waiting
const SAY_WITHIN = 5; // clock minutes: a rule that arms a timer must still say its line within this

export function newRun({ tempo = 'slice', knownRumours = null, record = false } = {}) {
  E.setTempo(tempo);
  const s = E.createDay();
  return { s, plan: [], links: new Set(), heard: new Set(), keys: new Set(), fired: new Set(), silent: new Set(), knownRumours,
    rec: record ? createRecorder(s, { by: 'verify' }) : null, lastEventT: 0, maxGap: 0, gapAt: 0,
    k: 0, violations: [], chaseSince: null, longChase: 0, pending: [] };
}

/** Clone a run for branching (recording runs are not cloned; re-execute their plan instead). */
export function forkRun(run) {
  return { s: structuredClone(run.s), plan: run.plan.slice(), links: new Set(run.links), heard: new Set(run.heard), keys: new Set(run.keys),
    fired: new Set(run.fired), silent: new Set(run.silent), knownRumours: run.knownRumours, rec: null,
    lastEventT: run.lastEventT, maxGap: run.maxGap, gapAt: run.gapAt,
    k: run.k, violations: run.violations.slice(), chaseSince: run.chaseSince, longChase: run.longChase,
    pending: run.pending.map((p) => ({ ...p })) };
}

function tickOnce(run) {
  const { s } = run;
  if (s.over) return;
  const inp = { x: s.player.x, z: s.player.z, unseen: unseenBy(s) };
  E.setInputs(s, inp);
  run.rec?.inputs(inp);
  const f0 = firings.length;
  try { E.tick(s, STEP); } catch (e) {
    run.violations.push({ name: 'engine-throws', msg: `tick threw ${e.message}`, clock: E.clockText(s.t), planLength: run.plan.length });
    s.over = true;
    return;
  }
  run.rec?.tick();
  noteFirings(run, f0);
  for (const e of E.drainEvents(s)) {
    if (e.key) run.pending = run.pending.filter((p) => p.says !== e.key);
    if (e.link) { run.links.add(e.link); if (heardBy(s, e)) run.heard.add(e.link); }
    if (e.key) run.keys.add(e.key);
    // Dead air: the longest stretch with nothing said or shown within sight (25 m) of the player.
    if (e.pos ? E.dist(e.pos, s.player) < 25 : e.kind !== 'line') {
      const gap = e.t - run.lastEventT;
      if (gap > run.maxGap) { run.maxGap = gap; run.gapAt = run.lastEventT; }
      run.lastEventT = e.t;
    }
  }
  E.drainCues(s);
  run.k++;
  // A rule that fired but never said its line within SAY_WITHIN clock minutes was silent to the player.
  for (const p of run.pending) if (s.t - p.t > SAY_WITHIN * E.SECONDS_PER_MINUTE || s.over) run.silent.add(p.id);
  run.pending = run.pending.filter((p) => !run.silent.has(p.id) && !(s.t - p.t > SAY_WITHIN * E.SECONDS_PER_MINUTE));
  // Chases must end: caught or lost.
  if (s.player.chasedBy) {
    run.chaseSince ??= s.t;
    run.longChase = Math.max(run.longChase, Math.round((s.t - run.chaseSince) / E.SECONDS_PER_MINUTE));
  } else run.chaseSince = null;
  if (run.k % 10 === 0 || s.over) {
    for (const v of checkInvariants(s)) {
      if (run.violations.some((x) => x.name === v.name)) continue;
      run.violations.push({ ...v, planLength: run.plan.length });
    }
  }
}

export function advanceRun(run, seconds) {
  for (let t = 0; t < seconds - 1e-9 && !run.s.over; t += STEP) tickOnce(run);
}

/** What the player could do now, minus walking (used to notice when the world opens a new option). */
export function signature(run) {
  return E.affordances(run.s, { knownRumours: run.knownRumours ?? undefined, waypoints: false }).map((a) => a.id).sort().join('|');
}

/** Executes one plan op and appends it to the plan. Returns the act() result for 'act'. */
export function exec(run, op) {
  run.plan.push(op);
  const { s } = run;
  if (op.op === 'wait') { advanceRun(run, op.s); return null; }
  if (op.op === 'until') { // a clock time, 'HH:MM': plans written this way read the same at any tempo
    const [h, m] = op.clock.split(':').map(Number);
    advanceRun(run, E.at(h, m) - s.t);
    return null;
  }
  if (op.op === 'waitChange') {
    const sig = signature(run);
    for (let t = 0; t < op.max && !s.over; t += CHANGE_EVERY) {
      advanceRun(run, CHANGE_EVERY);
      if (signature(run) !== sig) break;
    }
    return null;
  }
  if (op.op === 'go') { walk(run, op.to, op.follow); return null; }
  if (op.op === 'act') {
    const cmd = { ...op.cmd };
    if (cmd.type === 'take') cmd.witnesses = E.witnesses(s, s.player, sightOf(s)); // same rule and walls as the game
    if (cmd.type === 'film') Object.assign(cmd, { x: s.player.x, z: s.player.z });
    run.rec?.act(cmd);
    const f0 = firings.length;
    let r;
    try { r = E.act(s, cmd); } catch (e) { // an engine exception is a property failure, not a checker crash
      run.violations.push({ name: 'engine-throws', msg: `act(${JSON.stringify(cmd).slice(0, 120)}) threw ${e.message}`, clock: E.clockText(s.t), planLength: run.plan.length });
      s.over = true; // this branch is dead; the plan up to here is the counterexample
      return { ok: false, threw: true };
    }
    noteFirings(run, f0);
    return r;
  }
  throw new Error('unknown op ' + op.op);
}

// The chaos board learns a link only if the player heard it: main.js handleEvents' rule, on engine positions.
const PHONE_KINDS = new Set(['wireless', 'feed', 'stream', 'chat', 'ticker']);
function heardBy(s, e) {
  const kind = e.kind && e.kind !== 'line' ? e.kind : (PHONE_KINDS.has(e.who) ? e.who : e.kind);
  if (PHONE_KINDS.has(kind)) return true;
  if (e.pos && E.dist(s.player, e.pos) < 26) return true;
  if (e.place && E.placeAt(s.player) === e.place) return true;
  const who = s.people[e.who];
  return !!who && E.dist(s.player, who) < 26;
}

function noteFirings(run, f0) {
  for (let i = f0; i < firings.length; i++) {
    const f = firings[i];
    run.fired.add(f.id);
    if (!f.visible) run.pending.push({ id: f.id, says: f.says, t: f.t });
  }
  firings.length = f0;
}

/** Walk at SPEED toward a point, or keep following a person/officer/object id until within REACH. */
function walk(run, to, follow = null, timeout = 90) {
  const { s } = run;
  for (let t = 0; t < timeout && !s.over && !s.player.detained; t += STEP) {
    const target = (follow ? targetPos(s, follow) : null) ?? to;
    if (!target) return;
    const d = E.dist(s.player, target);
    if (d <= (follow ? REACH : 0.3)) return;
    const st = Math.min(d, SPEED * STEP);
    s.player.x += ((target.x - s.player.x) / d) * st;
    s.player.z += ((target.z - s.player.z) / d) * st;
    tickOnce(run);
  }
}
function targetPos(s, id) {
  return s.people[id] ?? s.officers[id] ?? s.objects[id] ?? s.provocateurs.find((p) => p.id === id) ?? null;
}

/** Turns an affordance into plan ops: walk to it (following moving targets), then act. */
export function opsFor(aff) {
  const follow = aff.cmd?.to ?? aff.cmd?.object ?? (aff.cmd?.type === 'provocateur' ? aff.cmd.id : null);
  const ops = [];
  if (aff.at) ops.push({ op: 'go', to: aff.at, ...(follow ? { follow } : {}) });
  if (aff.cmd) ops.push({ op: 'act', cmd: aff.cmd, id: aff.id });
  return ops;
}

/** Re-executes a plan from 10:00 with recording on: the tick trace for ?replay, plus what the day did. */
export function replayPlan(plan, opts = {}) {
  const run = newRun({ ...opts, record: true });
  for (const op of plan) exec(run, op);
  advanceRun(run, 1e6);
  return { run, trace: run.rec.trace({ ending: run.s.ending }) };
}
