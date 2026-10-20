// The explorer: our TLC. It searches the days a player can actually make and keeps, for every ending,
// rule and board link it reaches, the shortest plan that reaches it (a witness).
//
// Strategy (Go-Explore, Lu et al. 2022, adapted): an archive of abstract cells. Each cell holds the
// earliest run that reached it. Repeatedly pick a rarely-visited cell, fork its run, try one player move,
// and archive the result if it reaches a new cell or new coverage. Decision points are event-driven:
// after each move the run waits until the set of things the player can do changes (an object comes free,
// someone arrives), which is how timing-gated content like the chai-break key is found.
import { E, META } from './engine.mjs';
import { newRun, forkRun, exec, advanceRun, opsFor } from './drive.mjs';

const WAIT_MAX = 25; // seconds a move waits for the world to open something new (about 20 clock minutes)
const bucket = (v, w) => Math.min(5, Math.floor(v / w));

/** The abstraction: what makes two moments of a day "the same place" for search purposes. */
export function cellKey(run) {
  const s = run.s, pl = s.player;
  return JSON.stringify([
    s.phase, Math.floor(E.clockMinutes(s.t) / 30), E.placeAt(pl) ?? 'street',
    pl.carrying, pl.detained, !!pl.chasedBy, bucket(pl.crew.length, 3), pl.stance,
    bucket(pl.rep.aura, 20), bucket(pl.rep.heat, 25), bucket(pl.rep.help, 25), bucket(pl.rep.nuisance, 25),
    Object.values(s.objects).map((o) => o.holder).join(','),
    s.speech, s.moment, s.minister, s.march, !!s.clash, s.waterOk, !!s.showdown, s.scene?.id ?? null,
    Object.values(s.rumours).map((r) => bucket(Object.keys(r.people).length, 3)).join(''),
    [...run.fired].sort().join(','),
  ]);
}

// Moves are chosen by kind first (so 44 whisper combinations don't drown out one bus key), and options
// that just appeared get half of all picks: the world opening something is the moment to try it.
function chooseMove(run, rnd, fresh) {
  const affs = E.affordances(run.s, { knownRumours: run.knownRumours ?? undefined });
  if (!affs.length) return null;
  const pool = fresh.size && rnd() < 0.5 ? affs.filter((a) => fresh.has(a.id)) : affs;
  const kinds = [...new Set(pool.map((a) => a.kind))];
  const kind = rnd() < 0.08 ? 'wait' : kinds[Math.floor(rnd() * kinds.length)];
  if (kind === 'wait') return { id: 'wait', ops: [] };
  const of = pool.filter((a) => a.kind === kind);
  const a = of[Math.floor(rnd() * of.length)];
  return { id: a.id, ops: opsFor(a) };
}

export function explore({ budgetMs = 60000, seed = 1, seeds = [], onProgress = null } = {}) {
  let x = seed >>> 0 || 1;
  const rnd = () => ((x = (x * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const archive = new Map(); // cellKey -> { run, visits, gained }
  const witness = { ending: {}, rule: {}, link: {}, board: {} }; // id -> { plan, clock }; board = links the player heard
  const violations = new Map(); // name -> { msg, clock, plan }
  const stats = { moves: 0, rollouts: 0, cells: 0 };
  const t0 = Date.now();

  const credit = (run, endingFrom = null) => {
    let gained = 0;
    const note = (kind, id) => {
      const w = witness[kind][id];
      if (!w || run.plan.length < w.plan.length) { if (!w) gained++; witness[kind][id] = { plan: run.plan.slice(), clock: E.clockText(run.s.t) }; }
    };
    for (const r of run.fired) note('rule', r);
    for (const l of run.links) if (META.links.includes(l)) note('link', l);
    for (const l of run.heard) if (META.links.includes(l)) note('board', l);
    if (endingFrom) note('ending', endingFrom);
    for (const v of run.violations) if (!violations.has(v.name)) violations.set(v.name, { ...v, plan: run.plan.slice(0, v.planLength) });
    return gained;
  };
  const rollout = (run) => { // play the rest of the day idle, to see which ending this moment leads to
    const r = forkRun(run);
    advanceRun(r, 1e6);
    stats.rollouts++;
    return credit(r, r.s.ending);
  };
  const add = (run) => {
    const key = cellKey(run);
    const old = archive.get(key);
    if (old && old.run.s.t <= run.s.t && old.run.plan.length <= run.plan.length) return false;
    archive.set(key, { run, visits: old?.visits ?? 0, gained: old?.gained ?? 0 });
    return !old;
  };

  const start = newRun();
  add(start);
  rollout(start);
  // Designer routes seed the archive: every moment along them is a place to explore from.
  for (const plan of seeds) {
    const run = newRun();
    for (const op of plan) {
      exec(run, op);
      if (op.op !== 'go') { credit(run); add(forkRun(run)); }
    }
    advanceRun(run, 1e6);
    credit(run, run.s.ending);
  }

  while (Date.now() - t0 < budgetMs) {
    // Pick a cell: rarely visited and productive cells first.
    const cells = [...archive.values()].filter((c) => !c.run.s.over);
    if (!cells.length) break;
    let pick = cells[0], best = -1;
    for (let i = 0; i < 12; i++) {
      const c = cells[Math.floor(rnd() * cells.length)];
      const score = (1 + c.gained) / Math.sqrt(1 + c.visits) + rnd() * 0.1;
      if (score > best) { best = score; pick = c; }
    }
    pick.visits++;
    const run = forkRun(pick.run);
    const before = new Set(E.affordances(run.s, { waypoints: false }).map((a) => a.id));
    for (let step = 0; step < 3 && !run.s.over; step++) {
      const fresh = new Set(E.affordances(run.s, { waypoints: false }).map((a) => a.id).filter((id) => !before.has(id)));
      const move = chooseMove(run, rnd, fresh);
      if (!move) break;
      for (const op of move.ops) exec(run, op);
      exec(run, { op: 'waitChange', max: WAIT_MAX });
      stats.moves++;
      const gained = credit(run);
      const isNew = add(run);
      if (isNew) stats.cells++;
      if (isNew || gained) pick.gained += gained + (isNew ? 0.2 : 0);
      if (isNew && rnd() < 0.35) pick.gained += rollout(run);
      if (run.s.over) credit(run, run.s.ending);
    }
    onProgress?.(stats, witness);
  }
  return { witness, violations: [...violations.values()], stats: { ...stats, archive: archive.size, ms: Date.now() - t0 } };
}
