#!/usr/bin/env node
// npm run eval: score the game against the vision (eval/vision.json), pillar by pillar, and say what to fix next.
// npm run verify answers "does it work?"; this answers "is it the game utkarsh wants?".
//
//   npm run eval                    engine, text and map measures (about a minute)
//   npm run eval -- --browser       also open the 3D client: what is drawn, and screenshots for the judge
//   npm run eval -- --judge         also ask Claude to judge humour, place and look (needs Anthropic credentials)
//   npm run eval -- --record        append this run to eval/history.jsonl, the hill-climb log
//   npm run eval -- --quick         fewer bot days
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, appendFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { timedDay, chaseProbe } from './lib/days.mjs';
import { placeReport } from './lib/place.mjs';
import { corpus, promptCopy, voiceReport } from './lib/text.mjs';
import { latestJudgements, writePackets, judgeWithClaude, saveJudgement } from './lib/judge.mjs';
import { playDay, divergence } from '../verify/lib/bots.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2), flag = (k) => args.includes('--' + k);
const QUICK = flag('quick');
const OUT = join(ROOT, 'eval/out');
mkdirSync(OUT, { recursive: true });
const say = (...x) => console.log(...x);
const t0 = Date.now();
const commit = (() => { try { return execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch { return 'unknown'; } })();
const VISION = JSON.parse(readFileSync(join(ROOT, 'eval/vision.json'), 'utf8'));
const DELHI = JSON.parse(readFileSync(join(ROOT, 'eval/delhi.json'), 'utf8'));
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

// --- engine: bot days tick by tick, the chase probe -------------------------------------------
say('1/4 bot days');
const PEOPLE = ['random', 'helpful', 'chaotic', 'filmer', 'explorer'];
const SEEDS = QUICK ? [1] : [1, 2, 3];
const days = [timedDay('idle', 1), ...PEOPLE.flatMap((p) => SEEDS.map((sd) => timedDay(p, sd)))];
const active = days.filter((d) => d.name !== 'idle' && !d.crashed);
const quiet = PEOPLE.map((p) => playDay(p, { seed: 1 }).metrics).filter(Boolean);
const chase = chaseProbe();
const explorer = active.filter((d) => d.name === 'explorer');
const charges = active.map((d) => d.chargeMinute).filter((x) => x != null);
const pairs = [];
for (let i = 0; i < active.length; i++) for (let j = i + 1; j < active.length; j++) pairs.push(divergence(active[i].milestones, active[j].milestones));

// --- static: words and the map ---------------------------------------------------------------
say('2/4 words and map');
const lines = corpus(ROOT, DELHI.dialogueFiles);
const voice = voiceReport(lines, await promptCopy(ROOT));
const place = await placeReport(ROOT);

// --- browser and judge (optional) ------------------------------------------------------------
say(`3/4 ${flag('browser') ? 'browser' : 'browser skipped (--browser)'}`);
let audit = null;
if (flag('browser')) {
  const { sceneAudit } = await import('./lib/browser.mjs');
  audit = await sceneAudit(join(OUT, 'shots'));
}
const scenes = active.flatMap((d) => d.convoSample ?? []).slice(0, 6);
const packets = writePackets(ROOT, join(OUT, 'judge'), { lines, scenes, shots: audit?.shots ?? [] });
if (flag('judge')) {
  try {
    const results = await judgeWithClaude(ROOT, packets);
    if (!audit) { delete results.recognisable; delete results.quality; } // nothing to look at without --browser
    say(`  judged: ${saveJudgement(ROOT, { by: 'claude-opus-5-5', commit, results })}`);
  } catch (e) { say(`  judge failed: ${e.message}`); }
}
const judged = latestJudgements(ROOT);
const playtestDir = join(ROOT, 'eval/playtests');
const playtests = existsSync(playtestDir) ? readdirSync(playtestDir).filter((f) => f.endsWith('.json') && f !== 'TEMPLATE.json').map((f) => JSON.parse(readFileSync(join(playtestDir, f), 'utf8'))).sort((a, b) => String(a.date).localeCompare(String(b.date))) : [];
const lastPlay = playtests.at(-1) ?? null;

// --- measures ----------------------------------------------------------------------------------
say('4/4 score');
const shotMean = (k) => (audit?.shots?.length ? mean(audit.shots.map((s) => s[k])) : null);
const crowdShot = audit?.shots?.find((s) => s.id === 'crowd-1530');
const games = new Set(active.flatMap((d) => d.games));
const freed = active.flatMap((d) => d.freedAfter);
const VALUES = {
  'action-share': mean(active.map((d) => d.shares.action)),
  'first-action': explorer.length ? mean(explorer.map((d) => d.firstAction ?? d.seconds)) : null,
  'action-beats': mean(active.map((d) => d.beats / (d.seconds / 600))),
  'chase-challenge': chase.challenge,
  'chase-skill': chase.skill,
  'low-games': games.size,
  'reading-share': mean(active.map((d) => d.shares.reading)),
  'words-per-minute': mean(active.map((d) => d.wordsPerMinute)),
  'caught-downtime': freed.length ? freed.slice().sort((a, b) => a - b)[Math.floor(freed.length / 2)] : null,
  'physical-nearby': mean(active.map((d) => d.physicalNearby)),
  'physical-verbs': mean(active.map((d) => d.physicalOffered)),
  'nothing-new': quiet.length ? Math.max(...quiet.map((m) => m.longestNothingNewSeconds)) : null,
  spectacle: mean(active.map((d) => d.spectacle.length)),
  endings: new Set(active.map((d) => d.ending)).size,
  'showdown-places': new Set(active.map((d) => d.showdown)).size,
  'charge-spread': charges.length > 1 ? Math.max(...charges) - Math.min(...charges) : 0,
  divergence: pairs.length ? mean(pairs) : 0,
  callbacks: mean(active.map((d) => d.callbacks)),
  lectures: voice.lectures,
  hinglish: voice.hinglish,
  'ui-voice': voice.uiVoice,
  narration: mean(active.map((d) => d.narration)),
  'screen-repeat': mean(active.map((d) => d.screenRepeat)),
  'play-area': place.area.km2,
  scale: place.scale,
  layout: place.layoutError,
  'real-places': place.realInWorld.length,
  'invented-places': place.invented.length,
  placeholders: shotMean('placeholders'),
  textured: shotMean('textured'),
  'people-on-screen': crowdShot?.people ?? null,
  'draw-distance': shotMean('drawDistance') ?? place.area.fogEnd,
};
for (const [id, j] of Object.entries(judged)) VALUES[id] = j.score;
if (lastPlay) for (const [id, v] of Object.entries(lastPlay.scores || {})) if (v) VALUES[id] = v;

const score01 = (m, v) => {
  if (v == null || Number.isNaN(v)) return null;
  const x = m.better === 'low' ? (m.floor - v) / (m.floor - m.target) : (v - m.floor) / (m.target - m.floor);
  return Math.max(0, Math.min(1, x));
};
const pillars = VISION.pillars.map((p) => {
  const metrics = p.metrics.map((m) => {
    const value = VALUES[m.id] ?? null;
    const j = judged[m.id];
    const stale = j && j.commit !== commit ? j.commit : null;
    return { ...m, value, score: score01(m, value), stale, by: m.how === 'judge' ? j?.by ?? null : m.how === 'human' ? lastPlay?.by ?? null : null };
  });
  const measured = metrics.filter((m) => m.score != null);
  const w = measured.reduce((n, m) => n + m.weight, 0);
  return { id: p.id, name: p.name, weight: p.weight, metrics, score: w ? measured.reduce((n, m) => n + m.score * m.weight, 0) / w : null, measured: measured.length, total: metrics.length };
});
const scored = pillars.filter((p) => p.score != null);
const vision = scored.reduce((n, p) => n + p.score * p.weight, 0) / (scored.reduce((n, p) => n + p.weight, 0) || 1);
const partial = pillars.some((p) => p.measured < p.total);
// What to fix next: the measured metrics with the most weighted headroom.
const next = pillars.flatMap((p) => p.metrics.filter((m) => m.score != null).map((m) => ({ pillar: p.name, ...m, gain: (1 - m.score) * m.weight * p.weight / p.metrics.reduce((n, x) => n + x.weight, 0) })))
  .sort((a, b) => b.gain - a.gain).slice(0, 6);

// --- history -------------------------------------------------------------------------------------
const HIST = join(ROOT, 'eval/history.jsonl');
const history = existsSync(HIST) ? readFileSync(HIST, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
const prev = history.at(-1) ?? null;
const entry = { date: new Date().toISOString(), commit, vision: Math.round(vision * 1000) / 10, pillars: Object.fromEntries(pillars.map((p) => [p.id, p.score == null ? null : Math.round(p.score * 1000) / 10])), values: VALUES };
if (flag('record')) appendFileSync(HIST, JSON.stringify(entry) + '\n');

// --- report ----------------------------------------------------------------------------------------
const fmt = (v) => (v == null ? '–' : typeof v === 'number' ? (Math.abs(v) >= 100 ? String(Math.round(v)) : String(Math.round(v * 100) / 100)) : String(v));
const pct = (x) => (x == null ? 'not measured' : `${Math.round(x * 100)}`);
const delta = (id) => { const a = prev?.pillars?.[id], b = entry.pillars[id]; return a == null || b == null ? '' : ` (${b - a >= 0 ? '+' : ''}${Math.round((b - a) * 10) / 10})`; };
const L = [];
L.push('# Vision scorecard', '');
L.push(`Generated by \`npm run eval\` at ${commit}. **Vision score ${pct(vision)} / 100**${partial ? ' (partial: some metrics not measured, see below)' : ''}${prev ? `, was ${prev.vision} at ${prev.commit}` : ''}.`, '');
L.push('The pillars and their targets are in [vision.json](vision.json), each with the words utkarsh used. `npm run verify` says whether the game works; this says whether it is the game he wants. His own rating after playing (pillar "you") outranks every number here.', '');
L.push('| Pillar | Weight | Score | Measured |', '| --- | --- | --- | --- |');
for (const p of pillars) L.push(`| ${p.name} | ${p.weight} | ${pct(p.score)}${delta(p.id)} | ${p.measured} of ${p.total} |`);
L.push('', '## Fix next', '', 'The measured metrics with the most weighted headroom:', '');
for (const m of next) L.push(`1. **${m.text}** (${m.pillar}): now ${fmt(m.value)}, target ${m.better === 'low' ? '≤' : '≥'} ${fmt(m.target)}.`);
for (const p of pillars) {
  L.push('', `## ${p.name}: ${pct(p.score)}`, '');
  L.push('| Metric | How | Now | Floor → target | Score |', '| --- | --- | --- | --- | --- |');
  for (const m of p.metrics) L.push(`| ${m.text} | ${m.how}${m.by ? ` (${m.by})` : ''}${m.stale ? ` · judged at ${m.stale}` : ''} | ${fmt(m.value)} | ${fmt(m.floor)} → ${fmt(m.target)} | ${m.score == null ? (m.how === 'browser' ? 'run with --browser' : m.how === 'judge' ? 'run with --judge, or add eval/judgements/' : m.how === 'human' ? 'add eval/playtests/' : '–') : Math.round(m.score * 100)} |`);
}
L.push('', '## Evidence', '');
L.push(`- **Where the day goes** (active bots, share of 32 minutes): skill moments ${pct(VALUES['action-share'])}%, conversation cards ${pct(VALUES['reading-share'])}%, detained ${pct(mean(active.map((d) => d.shares.detained)))}%, walking about ${pct(mean(active.map((d) => d.shares.free)))}%.`);
L.push(`- **Low-level games found:** ${[...games].join(', ') || 'none'}. The chase probe (steal the key in front of an officer, then run): standing still escapes ${pct(chase.rates.stand)}%, jogging straight ${pct(chase.rates.jog)}%, sprinting straight ${pct(chase.rates.sprint)}%, jogging for a crowd ${pct(chase.rates.crowd)}%.`);
L.push(`- **Set pieces seen within 30 m:** ${[...new Set(active.flatMap((d) => d.spectacle))].join(', ') || 'none'}.`);
L.push(`- **Map:** ground ${Math.round(place.area.groundM2 ?? 0).toLocaleString('en')} m² (${fmt(place.area.km2)} km², real patch ${DELHI.realExtent.km2} km²), fog at ${place.area.fogEnd} m. ${place.landmarksPlaced} of ${place.landmarksTotal} landmarks placed, at ${fmt(place.scale)}× real distance, layout error ${fmt(place.layoutError)}.`);
L.push(`- **Real places in the world:** ${place.realInWorld.join(', ') || 'none'}. Only named in dialogue: ${place.realOnlySaid.join(', ') || 'none'}. Invented: ${place.invented.join(', ') || 'none'}.`);
L.push(`- **Voice:** ${voice.lines} lines, ${pct(voice.hinglish)}% Hinglish, ${voice.lectures} lecture-like. Prompt copy: ${voice.plainPrompts} of ${voice.prompts} are plain instructions, e.g. ${voice.plainExamples.slice(0, 4).map((x) => `"${x}"`).join(', ')}.`);
if (voice.lectureExamples.length) L.push(`- **Lecture-like lines:** ${voice.lectureExamples.slice(0, 4).map((x) => `"${x}"`).join('; ')}.`);
if (audit) L.push(`- **Browser:** ${audit.shots.map((s) => `${s.id}: ${s.meshes} meshes, ${Math.round(s.textured * 100)}% textured, ${s.placeholders} flat boxes, ${s.people} people`).join('; ')}. Screenshots in eval/out/shots/.`);
for (const [id, j] of Object.entries(judged)) if (j.notes) L.push(`- **Judge, ${id}** (${j.by} at ${j.commit}): ${j.notes}`);
if (lastPlay) L.push(`- **Last playtest** (${lastPlay.by}, ${lastPlay.date}): best "${lastPlay.best}", worst "${lastPlay.worst}".`);
L.push('', `Took ${Math.round((Date.now() - t0) / 1000)} s over ${days.length} bot days.`);
writeFileSync(join(ROOT, 'eval/report.md'), L.join('\n') + '\n');
writeFileSync(join(OUT, 'scorecard.json'), JSON.stringify({ ...entry, pillars, chase, place, voice: { ...voice }, audit }, null, 1));
say('');
say(`vision ${pct(vision)}/100${partial ? ' (partial)' : ''} · ${pillars.map((p) => `${p.id} ${pct(p.score)}`).join(' · ')}`);
say('report: eval/report.md');
