#!/usr/bin/env node
// npm run verify [-- --budget=60 --seed=1 --update-baseline]
//
// 1. Determinism: the engine has no hidden state (plans and traces replay exactly, in any order).
// 2. Re-check every witness plan in verify/baseline.json (deterministic, fast).
// 3. Explore for the rest within the time budget (verify/explore.mjs).
// 4. Day properties on every witness day; escalation, agency, pacing and tempo checks.
// 5. Write verify/report.json and verify/traces/, print the diff against the baseline.
// Exit 1 if coverage was lost or any property fails. Cite this output when you claim a change works.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { E, META, sightOf } from './engine.mjs';
import { ROUTES, unmet } from './seeds.mjs';
import { buildMap } from './map.mjs';
import { newRun, exec, advanceRun, replayPlan } from './drive.mjs';
import { explore } from './explore.mjs';
import { checkDay, clockMin } from './properties.mjs';
import { replay } from '../dist/loop/trace.js';

const DIR = new URL('.', import.meta.url).pathname;
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d);
const BUDGET = Number(arg('budget', 60)) * 1000, SEED = Number(arg('seed', 1));
const UPDATE = process.argv.includes('--update-baseline');
const DEAD_AIR_MAX = 45; // clock minutes with nothing said or shown near the player, in any witness day

// The day's state, minus the event and cue queues (drivers drain those at different times).
const hash = (s) => createHash('sha1').update(JSON.stringify({ ...s, events: null, cues: null })).digest('hex').slice(0, 12);
const failures = [], notes = [];
const fail = (name, msg, extra = {}) => failures.push({ name, msg, ...extra });
const t0 = Date.now();
const out = (...a) => console.log(...a);

// --- 1. determinism ----------------------------------------------------------------------------------
function runPlan(plan, tempo = 'slice') {
  const run = newRun({ tempo });
  for (const op of plan) exec(run, op);
  advanceRun(run, 1e6);
  return run;
}
const PROBE = [ // touches rally (crew ids), tempo-dependent act() checks and the shuttle lane
  { op: 'wait', s: E.at(12, 0) }, { op: 'go', to: E.WAYPOINTS['crowd:stage'] }, { op: 'act', cmd: { type: 'rally' } },
  { op: 'act', cmd: { type: 'pester', to: 'sharma', how: 'cannon' } }, { op: 'wait', s: 30 },
];
const first = hash(runPlan(PROBE).s);
{
  // Two days ticked alternately (one slice, one ?long) must match each played alone.
  const alone = (tempo) => { E.setTempo(tempo); const s = E.createDay(); E.advance(s, 1e6); return hash(s); };
  const [a0, b0] = [alone('slice'), alone('long')];
  E.setTempo('slice'); const a = E.createDay(); E.setTempo('long'); const b = E.createDay();
  while (!a.over || !b.over) { if (!a.over) E.tick(a, 0.1); if (!b.over) E.tick(b, 0.1); }
  if (hash(a) !== a0 || hash(b) !== b0) fail('determinism', 'a slice day and a ?long day ticked alternately differ from each played alone (module-level state)');
}

// --- 2 + 3. coverage -------------------------------------------------------------------------------
const basePath = DIR + 'baseline.json';
const base = existsSync(basePath) ? JSON.parse(readFileSync(basePath, 'utf8')) : null;
const witness = { ending: {}, rule: {}, link: {}, board: {} };
const reach = (run) => ({ ending: [run.s.ending], rule: [...run.fired], link: [...run.links].filter((l) => META.links.includes(l)), board: [...run.heard].filter((l) => META.links.includes(l)) });
const record = (plan, run) => {
  for (const [kind, ids] of Object.entries(reach(run))) for (const id of ids) {
    const w = witness[kind][id];
    if (!w || plan.length < w.plan.length) witness[kind][id] = { plan, clock: E.clockText(run.s.t) };
  }
};
const stale = [];
if (base) {
  const plans = new Map();
  for (const kind of ['ending', 'rule', 'link', 'board']) for (const [id, w] of Object.entries(base.witness?.[kind] ?? {})) plans.set(JSON.stringify(w.plan), { plan: w.plan, wants: [...(plans.get(JSON.stringify(w.plan))?.wants ?? []), [kind, id]] });
  for (const { plan, wants } of plans.values()) {
    const run = runPlan(plan);
    record(plan, run);
    const got = reach(run);
    for (const [kind, id] of wants) if (!got[kind].includes(id)) stale.push(`${kind}:${id}`);
  }
}
// Intended routes (verify/seeds.mjs): the designer's claims, played the way a player can.
const intents = {};
for (const [id, route] of Object.entries(ROUTES)) {
  const run = newRun();
  const why = [];
  for (const op of route.plan) {
    if (op.op === 'act' && op.cmd.type === 'take') {
      const seen = E.witnesses(run.s, run.s.player, sightOf(run.s));
      if (seen.length) why.push(`${op.cmd.object} taken at ${E.clockText(run.s.t)} in sight of ${seen.join(', ')}`);
    }
    const r = exec(run, op);
    if (op.op === 'act' && r && !r.ok) why.push(`${op.cmd.type} ${op.cmd.object ?? op.cmd.to ?? ''} refused at ${E.clockText(run.s.t)}${r.say ? ` (${r.say})` : ''}`);
  }
  advanceRun(run, 1e6);
  record(route.plan, run);
  const missing = unmet(route, run);
  intents[id] = missing.length ? { ok: false, missing, ending: run.s.ending, why } : { ok: true };
  const was = base?.intents?.[id]?.ok;
  if (missing.length && was === true) fail('intended-route-broken', `${id}: ${missing.join(', ')} no longer happen (${why.join('; ') || 'no refusal recorded'})`, { plan: route.plan });
}
const ex = explore({ budgetMs: BUDGET, seed: SEED, seeds: Object.values(ROUTES).map((r) => r.plan) });
for (const kind of ['ending', 'rule', 'link', 'board']) for (const [id, w] of Object.entries(ex.witness[kind])) {
  if (!witness[kind][id] || w.plan.length < witness[kind][id].plan.length) witness[kind][id] = w;
}
for (const v of ex.violations) fail(`invariant:${v.name}`, v.msg, { clock: v.clock, plan: v.plan });

// --- 4. day properties, pacing, agency, escalation, tempo ------------------------------------------
const plans = new Map();
for (const kind of ['ending', 'rule', 'link', 'board']) for (const w of Object.values(witness[kind])) plans.set(JSON.stringify(w.plan), w.plan);
let worstGap = { min: 0, at: null, plan: null };
const dayRuns = [];
for (const plan of plans.values()) {
  const run = runPlan(plan);
  dayRuns.push({ plan, run });
  for (const v of checkDay(run)) fail(`day:${v.name}`, v.msg, { plan });
  for (const v of run.violations) fail(`invariant:${v.name}`, v.msg, { clock: v.clock, plan: plan.slice(0, v.planLength) });
  const gap = clockMin(run.maxGap);
  if (gap > worstGap.min) worstGap = { min: Math.round(gap), at: E.clockText(run.gapAt), plan };
}
// Plans re-execute exactly, and their tick traces replay to the same day (the browser's ?replay path).
for (const { plan, run } of dayRuns.slice(0, 15)) {
  const { trace } = replayPlan(plan);
  E.setTempo('slice');
  const s = replay(trace, E);
  E.advance(s, 1e6);
  if (hash(s) !== hash(run.s)) { fail('determinism', 'a plan and its recorded trace end in different states', { plan }); break; }
}
if (hash(runPlan(PROBE).s) !== first) fail('determinism', 'the same plan ended differently at the end of the session than at the start (state leaks between days)');

// An idle player still sees the day escalate.
const idle = runPlan([]);
if (!idle.s.showdown && !idle.s.police.charge) fail('escalates-without-player', `idle day ends "${idle.s.ending}" with no showdown or charge`);
// Tempo: the idle day ends the same way in the slice and the full ?long day.
const idleLong = runPlan([], 'long');
if (idleLong.s.ending !== idle.s.ending) fail('tempo-invariant', `idle day ends "${idle.s.ending}" at slice tempo but "${idleLong.s.ending}" at ?long`);
if (worstGap.min > DEAD_AIR_MAX) notes.push(`pacing: a witness day has ${worstGap.min} clock minutes of dead air near the player from ${worstGap.at} (max ${DEAD_AIR_MAX})`);
const idleGap = Math.round(clockMin(idle.maxGap));

// Agency: for each verb, some day where doing it changes the ending or a board link versus not doing it.
const agency = {};
for (const { plan, run } of dayRuns) {
  for (let i = 0; i < plan.length; i++) {
    const op = plan[i];
    if (op.op !== 'act') continue;
    const verb = op.cmd.type;
    if (agency[verb]?.changes) continue;
    agency[verb] ??= { tried: 0, changes: null };
    if (agency[verb].tried >= 6) continue;
    agency[verb].tried++;
    const without = runPlan(plan.filter((_, j) => j !== i));
    const a = reach(run), b = reach(without);
    const diff = a.ending[0] !== b.ending[0] ? `ending ${b.ending[0]} -> ${a.ending[0]}` : (a.link.find((l) => !b.link.includes(l)) ?? null);
    if (diff) agency[verb].changes = diff;
  }
}
const VERBS = ['take', 'give', 'drop', 'talk', 'whisper', 'pester', 'rally', 'film', 'stance', 'provocateur', 'scene', 'plead'];
for (const v of VERBS) if (!agency[v]?.changes) notes.push(`agency: no explored day where "${v}" changes the ending or a board link${agency[v] ? ` (${agency[v].tried} tried)` : ' (never used)'}`);

// --- 5. report, traces, diff -----------------------------------------------------------------------
const cov = Object.fromEntries(['ending', 'rule', 'link', 'board'].map((k) => [k, Object.keys(witness[k]).sort()]));
const all = { ending: META.endings, rule: META.rules, link: META.links, board: META.links };
const report = {
  version: 1, at: new Date().toISOString(), budgetS: BUDGET / 1000, seed: SEED, ms: Date.now() - t0,
  explorer: ex.stats,
  coverage: Object.fromEntries(Object.entries(cov).map(([k, ids]) => [k, { reached: ids.length, of: all[k].length, missing: all[k].filter((id) => !ids.includes(id)) }])),
  failures: failures.map(({ plan, ...f }) => ({ ...f, planOps: plan?.length })),
  notes, agency, pacing: { worstDeadAirMin: worstGap.min, at: worstGap.at, idleDayDeadAirMin: idleGap },
  idle: { ending: idle.s.ending, endingLong: idleLong.s.ending },
  intents,
  witness,
};
writeFileSync(DIR + 'report.json', JSON.stringify(report, null, 1));
writeFileSync(DIR + 'map.md', buildMap(report));

// Tick traces for every ending (and any failure), replayable in the browser: /?replay=../verify/traces/<file>
const TR = DIR + 'traces/';
mkdirSync(TR, { recursive: true });
for (const f of readdirSync(TR)) if (f.startsWith('ending-') || f.startsWith('fail-')) rmSync(TR + f);
for (const [id, w] of Object.entries(witness.ending)) writeFileSync(`${TR}ending-${id}.json`, JSON.stringify(replayPlan(w.plan).trace));
failures.filter((f) => f.plan).slice(0, 10).forEach((f, i) => writeFileSync(`${TR}fail-${i}-${f.name.replace(/[^a-z0-9-]/gi, '_')}.json`, JSON.stringify(replayPlan(f.plan).trace)));

// Diff against the baseline.
const lost = [], gained = [];
if (base) for (const k of ['ending', 'rule', 'link', 'board']) {
  for (const id of base.coverage[k] ?? []) if (!cov[k].includes(id)) lost.push(`${k}:${id}`);
  for (const id of cov[k]) if (!(base.coverage[k] ?? []).includes(id)) gained.push(`${k}:${id}`);
}
for (const id of lost) fail('coverage-lost', `${id} was reachable in the baseline and is not now${stale.includes(id) ? ' (its old witness plan no longer reaches it)' : ''}`);

out(`verify: ${(report.ms / 1000).toFixed(1)} s, explored ${ex.stats.moves} moves / ${ex.stats.archive} cells`);
for (const [k, c] of Object.entries(report.coverage)) out(`  ${k.padEnd(7)} ${String(c.reached).padStart(3)}/${c.of}${c.missing.length ? `   missing: ${c.missing.join(', ')}` : ''}`);
out(`  pacing  worst dead air ${worstGap.min} clock min (at ${worstGap.at}); idle day ${idleGap}`);
out(`  agency  ${VERBS.filter((v) => agency[v]?.changes).length}/${VERBS.length} verbs change an outcome`);
if (base) out(`  diff    ${gained.length ? `+${gained.length} (${gained.slice(0, 6).join(', ')}${gained.length > 6 ? ', ...' : ''})` : '+0'}  ${lost.length ? `-${lost.length} (${lost.join(', ')})` : '-0'}`);
else out('  diff    no baseline yet (run with --update-baseline)');
const brokenRoutes = Object.entries(intents).filter(([, v]) => !v.ok);
out(`  routes  ${Object.keys(intents).length - brokenRoutes.length}/${Object.keys(intents).length} intended routes work for a walking player`);
for (const [id, v] of brokenRoutes) out(`  BROKEN  ${id}: missing ${v.missing.join(', ')}${v.why.length ? ` (${v.why.join('; ')})` : ''}`);
for (const n of notes) out(`  note    ${n}`);
for (const f of failures) out(`  FAIL    ${f.name}: ${f.msg}${f.clock ? ` at ${f.clock}` : ''}`);
out(failures.length ? `\n${failures.length} failure(s). Traces in verify/traces/fail-*.json; replay with ?replay=` : '\nall properties hold');

if (UPDATE) {
  writeFileSync(basePath, JSON.stringify({ version: 1, at: report.at, coverage: cov, intents, witness }, null, 1));
  out('baseline updated: verify/baseline.json');
}
process.exit(failures.length && !UPDATE ? 1 : 0);
