// The explorer: TLC's idea, run on the real engine. It keeps an archive of distinct situations (cells),
// restarts from them (Go-Explore: a day clones exactly, so it never replays from 10:00), and branches on
// the player's decisions, not on clock ticks. Every first sighting of something (a rule firing, an
// ending, a line being seen) keeps the trace that got there: that trace is its witness.
import * as H from './harness.mjs';
import { checkInvariants, checkEndingCard } from './properties.mjs';

const { R } = H;
const MILESTONE = /^(rule|memo|flag|callback|scene|ending|outcome|role|link):/;

export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = (rand, list) => list[Math.floor(rand() * list.length)];

/** A cell: the half hour, what you hold, whether you're on the bus, and everything that has happened so far. */
export function cellKey(s) {
  const half = Math.floor((R.clockMinutes(s.t) - R.DAY_START) / 30);
  const done = Object.keys(s.history).filter((k) => MILESTONE.test(k)).sort().join(',');
  return `${half}|${s.player.carrying ?? '-'}|${s.player.detained ? 'D' : ''}${s.player.chasedBy ? 'C' : ''}${s.player.crew.length ? 'K' : ''}|${s.over ? 'over' : ''}|${done}`;
}

/** The next decision: a kind of thing to do (balanced, so 40 whispers don't drown one scene), then which one. */
export function chooseStep(run, rand, tried) {
  const affs = R.affordances(run.s);
  const kinds = [...new Set(affs.map((a) => a.kind))];
  const options = [...kinds, 'wait', 'wait'];
  const kind = pick(rand, options);
  if (kind === 'wait') return { wait: pick(rand, [3, 10, 20, 45]) };
  const list = affs.filter((a) => a.kind === kind);
  // Prefer what has been tried least anywhere in the search.
  const w = list.map((a) => 1 / (1 + (tried.get(a.id) || 0)));
  let x = rand() * w.reduce((n, v) => n + v, 0), a = list[list.length - 1];
  for (let i = 0; i < list.length; i++) { x -= w[i]; if (x <= 0) { a = list[i]; break; } }
  tried.set(a.id, (tried.get(a.id) || 0) + 1);
  return a.cmd ? { do: a.id, cmd: a.cmd, at: a.at } : { do: a.id, cmd: null, at: a.at, hold: pick(rand, [1, 4]) };
}

/**
 * Explore for a budget of macro steps (with a wall-clock cap). Returns { hits, violations, silent, raw, endings, cells, steps, days }.
 * hits: key -> { clock, trace }   the shortest trace seen that makes key happen
 */
export function explore({ steps: budget = 2500, seconds = 600, seed = 7, tempo = 'long', log = () => {} } = {}) {
  const rand = rng(seed), tried = new Map();
  const archive = new Map(), hits = new Map(), violations = new Map(), silent = new Map(), raw = new Map(), endings = new Map();
  const start = Date.now();
  let steps = 0, days = 0, lastLog = start;
  const record = (map, key, run, extra = {}) => {
    const prev = map.get(key);
    if (!prev) map.set(key, { count: 1, clock: H.clock(run.s), trace: run.trace.slice(), ...extra });
    else { prev.count++; if (run.trace.length < prev.trace.length) Object.assign(prev, { clock: H.clock(run.s), trace: run.trace.slice(), ...extra }); }
  };
  const visit = (run) => {
    const s = run.s;
    for (const k of Object.keys(s.history)) {
      const h = hits.get(k);
      if (!h || run.trace.length < h.trace.length) hits.set(k, { clock: R.clockText(s.history[k]), trace: run.trace.slice() });
    }
    for (const v of checkInvariants(s, run.prev)) record(violations, `${v.id}: ${v.msg.replace(/[\d.]+/g, '#')}`, run, { id: v.id, msg: v.msg });
    run.prev = { phase: s.phase };
    if (s.player.chasedBy && s.memo.chase && R.clockMinutes(s.t) - R.clockMinutes(s.memo.chase.t) > 10) record(violations, 'chase-ends', run, { id: 'chase-ends', msg: `chased since ${R.clockText(s.memo.chase.t)}` });
    if (s.player.detained && s.detention.since != null && R.clockMinutes(s.t) - R.clockMinutes(s.detention.since) > 30 && R.clockMinutes(s.t) < 17 * 60) {
      record(violations, 'detention-exit', run, { id: 'detention-exit', msg: `on the bus since ${R.clockText(s.detention.since)} (aura ${Math.round(s.player.rep.aura)}, help ${Math.round(s.player.rep.help)}): pleading needs aura 50, a friend needs help 30` });
    }
    if (s.over) {
      days++;
      const c = s.outcome;
      record(endings, `${s.ending} · ${c.outcome} · ${c.role}`, run, { ending: s.ending, outcome: c.outcome, role: c.role });
      for (const v of checkEndingCard(s)) record(violations, `${v.id}: ${v.msg.replace(/[\d.]+/g, '#')}`, run, v);
      return;
    }
    const key = cellKey(s);
    const cell = archive.get(key);
    if (!cell) { archive.set(key, { run: H.cloneRun(run), visits: 0, done: Object.keys(s.history).filter((k) => MILESTONE.test(k)).length, stuck: s.player.detained }); promptCheck(run); }
    else if (run.trace.length < cell.run.trace.length) cell.run = H.cloneRun(run);
  };
  // The HUD's E prompt (the top of opportunities) must do something visible when pressed.
  const promptCheck = (run) => {
    const o = R.opportunities(run.s)[0];
    if (!o?.cmd || o.d > 12) return;
    const probe = H.cloneRun(run);
    const out = H.perform(probe, { do: 'prompt:' + o.id, cmd: o.cmd, at: { x: o.x, z: o.z } });
    if (out.crash) { record(violations, `no-crash: ${out.crash}`, probe, { id: 'no-crash', msg: out.crash }); return; }
    if (out.silent) record(violations, `prompt-works: ${o.kind}`, probe, { id: 'prompt-works', msg: `"${o.text}" (${o.kind}) is accepted but shows nothing` });
    if (out.raw) record(raw, out.raw, probe, { verb: out.verb });
  };

  const root = H.newRun(tempo);
  visit(root);
  // A step budget, not a time budget, so the same code and seed always explore the same way.
  while (steps < budget && (Date.now() - start) / 1000 < seconds) {
    // Pick a cell to return to: rarely visited ones first.
    const cells = [...archive.values()];
    // Rarely visited cells first, cells where more has happened a little more, the bus (a dead end) much less.
    const w = cells.map((c) => (1 + 0.05 * c.done) * (c.stuck ? 0.15 : 1) / Math.sqrt(1 + c.visits));
    let x = rand() * w.reduce((n, v) => n + v, 0), cell = cells[cells.length - 1];
    for (let i = 0; i < cells.length; i++) { x -= w[i]; if (x <= 0) { cell = cells[i]; break; } }
    cell.visits++;
    const run = H.cloneRun(cell.run);
    run.prev = { phase: run.s.phase };
    const n = 1 + Math.floor(rand() * 3);
    for (let i = 0; i < n && !run.s.over; i++) {
      const step = chooseStep(run, rand, tried);
      const out = H.perform(run, step);
      steps++;
      if (out.crash) { record(violations, `no-crash: ${out.crash}`, run, { id: 'no-crash', msg: out.crash }); break; }
      run.log.length = 0;
      if (out.silent) record(silent, `${out.verb} ${JSON.stringify(step.cmd)}`, run, { verb: out.verb, cmd: step.cmd });
      if (out.raw) record(raw, out.raw, run, { verb: out.verb });
      visit(run);
    }
    // Now and then, see how this branch ends if the player just stands still from here.
    if (run.crashed) continue;
    if (!run.s.over && rand() < 0.12) { H.finishDay(run); visit(run); }
    if (Date.now() - lastLog > 10000) { lastLog = Date.now(); log(`  ${Math.round((Date.now() - start) / 1000)}s: ${archive.size} cells, ${steps} steps, ${days} days, ${hits.size} things seen`); }
  }
  return { hits, violations, silent, raw, endings, cells: archive.size, steps, days, seconds: (Date.now() - start) / 1000 };
}

/** A trace replays to the same history it was recorded with. */
export function checkDeterminism(trace, tempo, expectKey) {
  return expectKey in H.replay(trace, tempo).s.history;
}
