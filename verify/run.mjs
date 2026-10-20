#!/usr/bin/env node
// npm run verify: build the system map, lint it, explore the day, play bot days, measure, and write
// verify/report.md. Compares against verify/baseline.json and fails on anything that got worse.
//
//   npm run verify                       the full check (about two minutes)
//   npm run verify -- --quick            a smaller search, for a fast look while working
//   npm run verify -- --update           accept today's results as the new baseline
//   npm run verify -- --steps 6000       search harder
import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync } from 'node:fs';
import * as H from './lib/harness.mjs';
import { buildMap, causeGraph } from './lib/map.mjs';
import { lint, LINT_RULES } from './lib/lint.mjs';
import { explore, checkDeterminism } from './lib/explore.mjs';
import { INVARIANTS, RUN_CHECKS } from './lib/properties.mjs';
import { playDay, constableProbe, divergence, PERSONAS } from './lib/bots.mjs';
import { renderMapPage } from './lib/page.mjs';

const { R } = H;
const args = process.argv.slice(2);
const flag = (k) => args.includes('--' + k);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? Number(args[i + 1]) : d; };
const QUICK = flag('quick');
const STEPS = opt('steps', QUICK ? 600 : 3000);
const SEEDS = QUICK ? [1] : [1, 2, 3];
const DIR = new URL('./', import.meta.url);
const OUT = new URL('./out/', DIR), WIT = new URL('./witnesses/', DIR);
const say = (...x) => console.log(...x);
const t0 = Date.now();
const pct = (x) => `${Math.round(x * 100)}%`;
const slug = (k) => k.replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80);

mkdirSync(OUT, { recursive: true });
rmSync(WIT, { recursive: true, force: true });
mkdirSync(WIT, { recursive: true });

// --- 1. the map and the linter ------------------------------------------------------
say('1/5 map and lint');
const map = buildMap();
const findings = lint(map);
const edges = causeGraph(map);

// --- 2. the explorer -------------------------------------------------------------------
say(`2/5 explore (${STEPS} decisions)`);
const ex = explore({ steps: STEPS, tempo: 'long', log: say });
say(`  ${ex.cells} situations, ${ex.days} finished days, ${ex.hits.size} distinct things, ${Math.round(ex.seconds)}s`);

// --- 3. bot players and the constable probe ---------------------------------------------
say(`3/5 bots (${Object.keys(PERSONAS).length} personalities × ${SEEDS.length} seeds)`);
const days = [];
for (const name of Object.keys(PERSONAS)) for (const seed of name === 'idle' ? [1] : SEEDS) days.push(playDay(name, { seed, tempo: 'long' }));
const probe = constableProbe();

// --- 4. replay checks ---------------------------------------------------------------------
say('4/5 replays');
const witnessOf = (key) => ex.hits.get(key)?.trace ?? days.find((d) => key in d.run.s.history)?.run.trace ?? null;
const endingKeys = [...ex.hits.keys()].filter((k) => k.startsWith('ending:'));
const determinism = endingKeys.slice(0, 6).map((k) => ({ key: k, ok: checkDeterminism(ex.hits.get(k).trace, 'long', k) }));
const tempo = [...ex.endings.values()].slice(0, 8).map((e) => {
  const slice = H.replay(e.trace, 'slice');
  const got = slice.s.over ? `${slice.s.ending} · ${slice.s.outcome.outcome} · ${slice.s.outcome.role}` : 'unfinished';
  return { want: `${e.ending} · ${e.outcome} · ${e.role}`, got, same: got === `${e.ending} · ${e.outcome} · ${e.role}` };
});
R.setTempo('long');

// --- 5. judge -------------------------------------------------------------------------------
say('5/5 report');
const active = days.filter((d) => d.metrics && d.name !== 'idle');
const mean = (f, list = active) => (list.length ? list.reduce((n, d) => n + f(d.metrics), 0) / list.length : 0);
const crashes = days.filter((d) => d.crash).map((d) => ({ who: `${d.name} #${d.seed}`, msg: d.crash, trace: d.run.trace }));

const hits = new Set([...ex.hits.keys(), ...days.flatMap((d) => Object.keys(d.run.s.history))]);
const cover = (label, ids, prefix) => {
  const reached = ids.filter((id) => hits.has(prefix + id));
  return { label, total: ids.length, reached: reached.length, ids: reached, missing: ids.filter((id) => !hits.has(prefix + id)) };
};
const coverage = {
  endings: cover('Ending headlines', map.endings, 'ending:'),
  outcomes: cover('Showdown outcomes', map.outcomes, 'outcome:'),
  roles: cover('Player roles', map.roles, 'role:'),
  rules: cover('Rules ("when X, Y does Z")', map.rules.map((r) => r.id), 'rule:'),
  callbacks: cover('Ending-card callbacks', map.callbacks.map((c) => c.id), 'callback:'),
  links: cover('Chaos-board links learned', map.links.map((l) => l.id), 'link:'),
  situationsDone: cover('Situations played to done', map.situations.map((s) => s.id + ':done'), 'situation:'),
  situationsFail: cover('Situations played to fail', map.situations.map((s) => s.id + ':fail'), 'situation:'),
  nodes: cover('Situation stages reached', map.situations.flatMap((s) => s.nodes.map((n) => `${s.id}:${n.id}`)), 'node:situation:'),
  choices: cover('Situation choices taken', map.situations.flatMap((s) => s.nodes.flatMap((n) => n.options.map((o) => `${s.id}:${n.id}:${o.i}`))), 'choice:'),
  lines: cover('Lines the player saw or heard', map.lines.filter((l) => l.emitted && l.speakers.length).map((l) => l.id), 'seen:'),
};
// A line that is said but never reaches the player is a hole in the screen.
const unseenLines = map.lines.filter((l) => hits.has('said:' + l.id) && !hits.has('seen:' + l.id)).map((l) => l.id);

const silentActs = new Map(ex.silent);
for (const d of days) for (const a of d.acts) if (a.silent) { const k = `${a.cmd.type}${a.cmd.how ? ':' + a.cmd.how : ''} ${JSON.stringify(a.cmd)}`; if (!silentActs.has(k)) silentActs.set(k, { count: 1, clock: a.clock, trace: d.run.trace }); else silentActs.get(k).count++; }
const rawCodes = new Map(ex.raw);
for (const d of days) for (const a of d.acts) if (a.raw && !rawCodes.has(a.raw)) rawCodes.set(a.raw, { count: 1, clock: a.clock, trace: d.run.trace });
const violationsBy = (id) => [...ex.violations.values()].filter((v) => v.id === id);

const prop = (id, text, fails, example = null) => ({ id, text, ok: !fails, fails, example });
const examples = (list) => list[0] ? { msg: list[0].msg ?? list[0].verb ?? '', clock: list[0].clock, trace: list[0].trace } : null;
const properties = [
  ...Object.entries(INVARIANTS).map(([id, text]) => { const v = violationsBy(id); return prop(id, text, v.reduce((n, x) => n + x.count, 0), examples(v)); }),
  prop('no-crash', RUN_CHECKS['no-crash'], violationsBy('no-crash').length + crashes.length, examples([...violationsBy('no-crash'), ...crashes])),
  prop('day-ends', RUN_CHECKS['day-ends'], days.filter((d) => !d.run.s.over).length),
  prop('ending-card', RUN_CHECKS['ending-card'], violationsBy('ending-card').length, examples(violationsBy('ending-card'))),
  prop('ending-card-thin', RUN_CHECKS['ending-card-thin'], violationsBy('ending-card-thin').length, examples(violationsBy('ending-card-thin'))),
  prop('no-silent-act', RUN_CHECKS['no-silent-act'], silentActs.size, silentActs.size ? (() => { const [k, v] = [...silentActs][0]; return { msg: k, clock: v.clock, trace: v.trace }; })() : null),
  prop('prompt-works', RUN_CHECKS['prompt-works'], violationsBy('prompt-works').length, examples(violationsBy('prompt-works'))),
  prop('no-raw-code', RUN_CHECKS['no-raw-code'], rawCodes.size, rawCodes.size ? (() => { const [k, v] = [...rawCodes][0]; return { msg: `"${k}"`, clock: v.clock, trace: v.trace }; })() : null),
  prop('chase-ends', RUN_CHECKS['chase-ends'], violationsBy('chase-ends').length, examples(violationsBy('chase-ends'))),
  prop('detention-exit', RUN_CHECKS['detention-exit'], violationsBy('detention-exit').length, examples(violationsBy('detention-exit'))),
  prop('lines-reach-player', 'Every line the engine says reaches the player somewhere (in earshot, on screen or on the phone)', unseenLines.length, unseenLines.length ? { msg: unseenLines.slice(0, 6).join(', ') } : null),
  prop('replay-deterministic', 'A witness trace replays from 10:00 to the same result', determinism.filter((d) => !d.ok).length),
];

// Experience targets. `better` says which way is good.
const metric = (id, text, value, target, better, fmt = (x) => String(Math.round(x * 10) / 10), detail = '') =>
  ({ id, text, value, target, better, ok: better === 'low' ? value <= target : value >= target, shown: fmt(value), targetShown: (better === 'low' ? '≤ ' : '≥ ') + fmt(target), detail });
const endingsByBots = new Set(active.map((d) => d.metrics.ending));
const pairs = [];
for (let i = 0; i < active.length; i++) for (let j = i + 1; j < active.length; j++) pairs.push(divergence(active[i].metrics.milestones, active[j].metrics.milestones));
const feedPerHour = mean((m) => m.phonePerHour);
const metrics = [
  metric('talk-repeat', 'Talking to someone gets a line you already heard', mean((m) => m.talkRepeat), 0.1, 'low', pct, 'share of talks, active bots'),
  metric('screen-repeat', 'Lines on screen that are repeats', mean((m) => m.lineRepeat), 0.15, 'low', pct, 'bubbles, toasts, wireless'),
  metric('constables-shared', 'Officer lines shared with another officer', probe.sharedFraction, 0.2, 'low', pct, `${probe.distinctLines} distinct lines across ${probe.officers} officers`),
  metric('things-per-hour', 'New things to do per game hour (situations, objects, people to help, provocateurs, crowds)', mean((m) => m.storyThingsPerHour), 6, 'high'),
  metric('nothing-new', 'Longest stretch with nothing new to do (real seconds, 32-minute day)', Math.max(...active.map((d) => d.metrics.longestNothingNewSeconds)), 90, 'low', (x) => `${Math.round(x)} s`),
  metric('quiet', 'Longest stretch with nothing new on screen or phone (real seconds)', Math.max(...active.map((d) => d.metrics.longestQuietSeconds)), 60, 'low', (x) => `${Math.round(x)} s`),
  metric('phone-rate', 'Phone posts per game hour (feed, chat, ticker)', feedPerHour, 10, 'high'),
  metric('endings-by-bots', 'Different ending headlines across the bot days', endingsByBots.size, 4, 'high'),
  metric('divergence', 'How different two bot days are (milestones not shared)', pairs.length ? pairs.reduce((a, b) => a + b, 0) / pairs.length : 0, 0.3, 'high', pct),
  metric('silent-acts', 'Accepted commands that showed nothing, per bot day', mean((m) => m.silentActs), 0, 'low'),
];

// --- baseline ---------------------------------------------------------------------------------
const BASE = new URL('./baseline.json', DIR);
const now = {
  properties: Object.fromEntries(properties.map((p) => [p.id, p.ok])),
  lint: [...new Set(findings.filter((f) => f.level === 'error').map((f) => `${f.id}: ${f.msg}`))].sort(),
  coverage: Object.fromEntries(Object.entries(coverage).map(([k, c]) => [k, c.ids])),
  metrics: Object.fromEntries(metrics.map((m) => [m.id, { value: m.value, ok: m.ok }])),
};
const base = existsSync(BASE) ? JSON.parse(readFileSync(BASE, 'utf8')) : null;
const regressions = [], improvements = [];
if (base) {
  for (const [id, ok] of Object.entries(now.properties)) if (base.properties[id] === true && !ok) regressions.push(`property "${id}" held before and fails now`); else if (base.properties[id] === false && ok) improvements.push(`property "${id}" holds now`);
  for (const e of now.lint) if (!base.lint.includes(e)) regressions.push(`new lint error: ${e}`);
  for (const e of base.lint) if (!now.lint.includes(e)) improvements.push(`lint error gone: ${e}`);
  for (const [k, ids] of Object.entries(now.coverage)) {
    for (const id of base.coverage[k] || []) if (!ids.includes(id)) regressions.push(`${coverage[k].label}: "${id}" was reachable and is not now`);
    for (const id of ids) if (!(base.coverage[k] || []).includes(id)) improvements.push(`${coverage[k].label}: "${id}" is reachable now`);
  }
  for (const m of metrics) { const b = base.metrics[m.id]; if (b?.ok && !m.ok) regressions.push(`metric "${m.id}" met its target before (${b.value}) and misses it now (${m.shown})`); else if (b && !b.ok && m.ok) improvements.push(`metric "${m.id}" meets its target now (${m.shown})`); }
}
if (flag('update') || !base) writeFileSync(BASE, JSON.stringify(now, null, 1) + '\n');

// --- witnesses ------------------------------------------------------------------------------------
const witnessFiles = {};
const saveWitness = (name, trace, expect, note = '') => {
  if (!trace) return null;
  const file = `${slug(name)}.json`;
  writeFileSync(new URL(file, WIT), JSON.stringify({ name, note, tempo: 'long', expect, trace }, null, 1) + '\n');
  return (witnessFiles[name] = `verify/witnesses/${file}`);
};
for (const p of properties) if (!p.ok && p.example?.trace) p.witness = saveWitness(`fails ${p.id}`, p.example.trace, null, p.example.msg);
for (const [k, e] of ex.endings) saveWitness(`ending ${k}`, e.trace, { ending: e.ending, outcome: e.outcome, role: e.role });
for (const id of [...coverage.situationsDone.ids, ...coverage.situationsFail.ids]) saveWitness(`situation ${id}`, witnessOf('situation:' + id), { history: 'situation:' + id });

// --- the report -------------------------------------------------------------------------------------
const failing = properties.filter((p) => !p.ok), lintErrors = findings.filter((f) => f.level === 'error'), lintWarn = findings.filter((f) => f.level === 'warn');
const missed = metrics.filter((m) => !m.ok);
const verdict = regressions.length ? `FAIL: ${regressions.length} thing(s) got worse than the baseline` : base ? 'PASS: nothing got worse than the baseline' : 'BASELINE: first run, recorded as the baseline';
const L = [];
L.push('# Verification report', '');
L.push(`Generated by \`npm run verify\`${QUICK ? ' (quick)' : ''}. ${verdict}.`, '');
L.push(`- **Properties:** ${properties.length - failing.length} of ${properties.length} hold.`);
L.push(`- **Experience targets:** ${metrics.length - missed.length} of ${metrics.length} met.`);
L.push(`- **Lint:** ${lintErrors.length} errors, ${lintWarn.length} warnings.`);
L.push(`- **Search:** ${ex.cells} distinct situations from ${ex.steps} decisions and ${ex.days} finished days, plus ${days.length} bot days. Took ${Math.round((Date.now() - t0) / 1000)} s.`, '');
if (regressions.length) { L.push('## Got worse since the baseline', ''); for (const r of regressions) L.push(`- ${r}`); L.push(''); }
if (improvements.length) { L.push('## Got better since the baseline', ''); for (const r of improvements.slice(0, 40)) L.push(`- ${r}`); L.push(''); }
L.push('## Properties', '', 'Each must hold in every situation the search reaches. A failing one links a witness: a trace that replays the failure from 10:00 (`npm run verify:replay -- <file>`, or open the game with `?replay=<file>`).', '');
L.push('| Property | Holds? | Example |', '| --- | --- | --- |');
for (const p of properties) L.push(`| ${p.text} | ${p.ok ? 'yes' : `**no** (${p.fails})`} | ${p.ok ? '' : `${(p.example?.msg || '').replace(/\|/g, '/').slice(0, 140)}${p.example?.clock ? ` at ${p.example.clock}` : ''}${p.witness ? ` · [witness](${p.witness.replace('verify/', '')})` : ''}`} |`);
L.push('', '## Experience targets', '', 'Measured from what reached the bot players\' screens over whole days at the 32-minute tempo.', '');
L.push('| What | Now | Target | Met? |', '| --- | --- | --- | --- |');
for (const m of metrics) L.push(`| ${m.text}${m.detail ? ` (${m.detail})` : ''} | ${m.shown} | ${m.targetShown} | ${m.ok ? 'yes' : '**no**'} |`);
L.push('', '## What the search reached', '');
L.push('| Content | Reached | Never reached |', '| --- | --- | --- |');
for (const c of Object.values(coverage)) L.push(`| ${c.label} | ${c.reached} of ${c.total} | ${c.missing.slice(0, 12).join(', ')}${c.missing.length > 12 ? `, and ${c.missing.length - 12} more` : ''} |`);
L.push('', '### Endings found', '', '| Headline · showdown · role | First found at | Witness |', '| --- | --- | --- |');
for (const [k, e] of [...ex.endings].sort()) L.push(`| ${k} | ${e.clock} after ${e.trace.length} decisions | [trace](${witnessFiles['ending ' + k]?.replace('verify/', '')}) |`);
L.push('', '## Bot days', '', '| Bot | Ending | Showdown | Role | Commands (ok) | Talk repeats | Screen repeats | Phone/hour | Nothing new for |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const d of days) {
  if (!d.metrics) { L.push(`| ${d.name} #${d.seed} | **crashed**: ${d.crash.slice(0, 80)} | | | | | | | |`); continue; }
  const m = d.metrics;
  L.push(`| ${d.name} #${d.seed} | ${m.ending} | ${m.outcome} | ${m.role} | ${m.acts} (${m.actsOk}) | ${pct(m.talkRepeat)} | ${pct(m.lineRepeat)} | ${Math.round(m.phonePerHour)} | ${m.longestNothingNewSeconds} s from ${m.longestNothingNewAt} |`);
}
L.push('', '## The police, line by line', '', `Walking up to each officer at 14:30, fresh each time, and asking for career advice, calling him cute, asking about the water cannon and asking to be detained:`, '');
L.push('| Officer | What he said |', '| --- | --- |');
for (const [id, lines] of Object.entries(probe.said)) L.push(`| ${id} | ${[...new Set(lines)].map((l) => l.replace(/\|/g, '/')).join(' / ')} |`);
L.push('', '## Lint', '');
if (!findings.length) L.push('Nothing.');
for (const f of findings.filter((x) => x.level !== 'info')) L.push(`- **${f.level}** ${f.msg}`);
if (unseenLines.length) L.push(`- **warn** said but never reached the player in any run: ${unseenLines.join(', ')}`);
L.push('', '## Tempo', '', 'Each ending\'s witness replayed at the 10-minute tempo. Walking takes more game minutes when the clock runs faster, so some timing windows close.', '');
L.push('| At 32 minutes | At 10 minutes | Same? |', '| --- | --- | --- |');
for (const t of tempo) L.push(`| ${t.want} | ${t.got} | ${t.same ? 'yes' : 'no'} |`);
L.push('', '## The system map', '', `${map.verbs.length} verbs, ${map.rules.length} rules, ${map.routines.length} timed routines, ${map.cues.length} cues, ${map.lines.length} line keys, ${map.links.length} board links, ${map.callbacks.length} callbacks, ${map.situations.length} situations, ${edges.length} cause→effect edges. Open \`verify/out/map.html\` for the whole map.`, '');
writeFileSync(new URL('./report.md', DIR), L.join('\n') + '\n');
const { clientMentions: _cm, ...mapJson } = map;
writeFileSync(new URL('map.json', OUT), JSON.stringify({ ...mapJson, edges }, null, 1));
writeFileSync(new URL('map.html', OUT), renderMapPage({ map, edges, coverage, hits, properties, metrics, findings }));
writeFileSync(new URL('report.json', OUT), JSON.stringify({ verdict, properties, metrics, coverage, regressions, improvements, findings, endings: [...ex.endings.keys()], probe, tempo, determinism }, (k, v) => (k === 'trace' ? undefined : v), 1));

say('');
say(verdict);
say(`properties ${properties.length - failing.length}/${properties.length} · targets ${metrics.length - missed.length}/${metrics.length} · lint errors ${lintErrors.length} · endings ${coverage.endings.reached}/${coverage.endings.total} · rules ${coverage.rules.reached}/${coverage.rules.total}`);
say('report: verify/report.md · map: verify/out/map.html');
process.exit(regressions.length ? 1 : 0);
