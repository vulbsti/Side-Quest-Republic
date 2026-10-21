#!/usr/bin/env node
// npm run verify:playback [-- verify/witnesses/x.json ...] [--speed 200]
// Plays witness traces in the real 3D client (headless Chromium, ?replay=), takes a screenshot at the
// moment that matters, and checks the browser's day matches the Node day for the same trace (TLA+'s
// "trace validation": the implementation must take the same steps as the model).
// Also checks the 3D world against the engine: at fixed clock times in each ending's day it pauses, lets people
// walk into place and compares where they are drawn with where the engine has them (rules that ask "who saw
// you" use the engine's positions); and checks verify/world-obstacles.json, the walls the verifier's sight
// lines use, still matches the live world (--snapshot-world rewrites it).
// Writes verify/out/playback/<name>.jpg and verify/out/playback/report.md.
import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import * as H from './lib/harness.mjs';
import { serve, launch, frames } from './lib/browser.mjs';

const ROOT = new URL('../', import.meta.url).pathname;
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const SPEED = Number(opt('speed', 200));
const DRIFT_MAX = 2.5; // metres between drawn and engine position, after people settle
const CHECKPOINTS = [10 * 60 + 30, 12 * 60, 13 * 60 + 30, 14 * 60 + 30, 15 * 60 + 30, 16 * 60 + 30, 17 * 60 + 30];
// Drift already filed (one entry per person; whether a body sticks depends on frame timing, so it moves
// between days). Listed drift is reported but doesn't fail the run; new drift does.
const KNOWN_PATH = join(ROOT, 'verify/playback-known.json');
const known = existsSync(KNOWN_PATH) ? JSON.parse(readFileSync(KNOWN_PATH, 'utf8')) : [];
const files = args.filter((a) => a.endsWith('.json'));
// By default: every failure, and one ending per headline (each playback takes a minute or two headless).
const all = readdirSync(join(ROOT, 'verify/witnesses')).sort();
const perHeadline = new Map();
for (const f of all.filter((x) => x.startsWith('ending_'))) {
  const head = f.split('_')[1], n = JSON.parse(readFileSync(join(ROOT, 'verify/witnesses', f), 'utf8')).trace.length;
  if (!perHeadline.has(head) || n < perHeadline.get(head).n) perHeadline.set(head, { f, n });
}
const witnesses = files.length ? files : [...all.filter((f) => f.startsWith('fails_')), ...[...perHeadline.values()].map((x) => x.f)].map((f) => `verify/witnesses/${f}`);
const OUT = join(ROOT, 'verify/out/playback');
mkdirSync(OUT, { recursive: true });

const server = await serve();

const ENGINE_KEYS = /^(rule|ending|outcome|role):/;
const browser = await launch();

// The walls the verifier's sight lines use must be the live world's.
let world = null;
{
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  await page.goto(`${server.url}/dist/index.html?dev`, { timeout: 120000 });
  await page.waitForFunction(() => window.__loop?.world, null, { timeout: 240000 });
  const live = await page.evaluate(() => ({ obstacles: window.__loop.obstacles(), shuttle: window.__loop.shuttle() }));
  const path = join(ROOT, 'verify/world-obstacles.json');
  if (args.includes('--snapshot-world') || !existsSync(path)) {
    writeFileSync(path, JSON.stringify({ source: 'window.__loop.obstacles() at boot (npm run verify:playback -- --snapshot-world)', ...live }) + '\n');
    console.log(`world snapshot written: ${live.obstacles.length} obstacles`);
  }
  const snap = JSON.parse(readFileSync(path, 'utf8'));
  const key = (o) => `${o.x},${o.z},${o.w},${o.d},${o.h}`;
  const a = new Set(live.obstacles.map(key)), b = new Set(snap.obstacles.map(key));
  world = { added: [...a].filter((k) => !b.has(k)).length, removed: [...b].filter((k) => !a.has(k)).length };
  console.log(world.added || world.removed ? `WORLD CHANGED  +${world.added} -${world.removed} obstacles: refresh with --snapshot-world` : 'world walls match verify/world-obstacles.json');
  await page.close();
}
const rows = [];
for (const w of witnesses) {
  const data = JSON.parse(readFileSync(join(ROOT, w), 'utf8'));
  const name = basename(w, '.json');
  const failing = name.startsWith('fails_');
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const t0 = Date.now();
  let row = { name, note: data.note || data.name, ok: false };
  try {
    await page.goto(`${server.url}/dist/index.html?replay=/${w}&speed=${SPEED}&nostings`, { timeout: 120000 });
    await page.waitForFunction(() => window.__replay, null, { timeout: 240000 });
    // A failure happened in the trace's last step: stop right after it. An ending: play to the card.
    const last = data.trace.length - 1;
    const drift = [];
    if (failing) await page.evaluate((i) => window.__replay.pauseAfter(i), last);
    else for (const m of CHECKPOINTS) {
      // Pause at the clock time, let people walk to where they belong, compare drawn and engine positions.
      await page.evaluate((m) => window.__replay.pauseAtClock(m), m);
      await page.waitForFunction(() => window.__replay.done || window.__replay.paused, null, { timeout: 600000, polling: 250 });
      const done = await page.evaluate(() => window.__replay.done);
      if (done) break;
      await frames(page, 180);
      const v = await page.evaluate(() => window.__loop.render());
      for (const p of [...v.people, ...v.officers]) {
        if (p.rx === undefined) continue;
        const d = Math.hypot(p.ex - p.rx, p.ez - p.rz);
        if (d > DRIFT_MAX) drift.push({ who: p.id, clock: v.clock, m: +d.toFixed(1) });
        else if (!p.shown) drift.push({ who: p.id, clock: v.clock, m: 0, hidden: true });
      }
      await page.evaluate(() => window.__replay.resume());
    }
    await page.waitForFunction(() => window.__replay.done || window.__replay.paused, null, { timeout: 600000, polling: 1000 });
    if (!failing) await page.waitForTimeout(2500); // the ending card fades in
    else { await page.evaluate(() => window.__loop.snap()); await page.waitForTimeout(1500); }
    const shot = join(OUT, `${name}.jpg`);
    await page.screenshot({ path: shot, type: 'jpeg', quality: 72 });
    const got = await page.evaluate(() => ({ history: window.__replay.history, t: window.__replay.t, clock: window.__replay.clock, ending: window.__replay.ending, drawn: window.__replay.drawn.length, seen: window.__replay.drawn.filter((d) => d.seen).length }));
    // The same trace in Node, stopped at the same place.
    const run = H.newRun(data.tempo || 'long');
    for (const step of data.trace) { const { clock: _c, reached: _r, ...rest } = step; H.perform(run, rest); if (run.s.over) break; }
    const want = Object.keys(run.s.history).filter((k) => ENGINE_KEYS.test(k)).sort();
    const have = Object.keys(got.history).filter((k) => ENGINE_KEYS.test(k)).sort();
    const missing = want.filter((k) => !have.includes(k)), extra = have.filter((k) => !want.includes(k));
    const newDrift = drift.filter((d) => !known.includes(d.who));
    row = { ...row, drift, newDrift, ok: !missing.length && !extra.length && !errors.length && !newDrift.length, clock: got.clock, nodeClock: H.clock(run.s), ending: got.ending, nodeEnding: run.s.over ? { ending: run.s.ending, outcome: run.s.outcome.outcome, role: run.s.outcome.role } : null, missing, extra, errors, shot: `${name}.jpg`, seconds: Math.round((Date.now() - t0) / 1000), drawn: got.drawn, seen: got.seen };
  } catch (e) {
    row = { ...row, errors: [...errors, e.message.split('\n')[0]], seconds: Math.round((Date.now() - t0) / 1000) };
  }
  rows.push(row);
  const worst = (row.drift || []).reduce((w, d) => (d.m > (w?.m ?? 0) ? d : w), null);
  console.log(`${row.ok ? 'same' : 'DIFFERENT'}  ${name}  ${row.clock ?? ''} (${row.seconds}s)${row.missing?.length ? '  browser missed: ' + row.missing.join(', ') : ''}${row.extra?.length ? '  browser extra: ' + row.extra.join(', ') : ''}${row.errors?.length ? '  errors: ' + row.errors.join(' | ') : ''}${worst ? `  drift: ${worst.who} ${worst.m} m at ${worst.clock}${row.newDrift?.length ? ` (NEW: ${[...new Set(row.newDrift.map((d) => d.who))].join(', ')})` : ''}` : ''}`);
  await page.close();
}
await browser.close();
server.close();

const L = ['# Playback in the 3D client', '', `Each witness trace played in headless Chromium at ${SPEED}× (\`npm run verify:playback\`). "Same" means the browser's engine fired the same rules and reached the same ending as Node for that trace, with nobody drawn more than ${DRIFT_MAX} m from where the engine has them (beyond the people listed in \`verify/playback-known.json\`).`, ''];
L.push(world.added || world.removed ? `**The world's walls changed** (+${world.added} −${world.removed}): refresh \`verify/world-obstacles.json\` with \`--snapshot-world\`.` : 'The world\'s walls match `verify/world-obstacles.json`.', '');
const drifters = new Map();
for (const r of rows) for (const d of r.drift || []) if (!drifters.has(d.who) || d.m > drifters.get(d.who).m) drifters.set(d.who, { ...d, day: r.name });
if (drifters.size) L.push('Drawn away from the engine (worst per person): ' + [...drifters.values()].map((d) => `${d.who} ${d.hidden ? 'not drawn' : `${d.m} m`} at ${d.clock} (${d.day})${known.includes(d.who) ? '' : ' **new**'}`).join('; ') + '.', '');
L.push('| Witness | Browser vs Node | Stopped at | Screenshot |', '| --- | --- | --- | --- |');
for (const r of rows) L.push(`| ${r.note} | ${r.ok ? 'same' : `**different**${r.missing?.length ? `: browser missed ${r.missing.join(', ')}` : ''}${r.extra?.length ? `; browser also fired ${r.extra.join(', ')}` : ''}${r.errors?.length ? `; ${r.errors.join(' / ')}` : ''}`} | ${r.clock ?? ''} | ${r.shot ? `![](${r.shot})` : ''} |`);
writeFileSync(join(OUT, 'report.md'), L.join('\n') + '\n');
console.log(`\n${rows.filter((r) => r.ok).length} of ${rows.length} witnesses play the same in the browser · verify/out/playback/report.md`);
if (args.includes('--update-known')) {
  writeFileSync(KNOWN_PATH, JSON.stringify([...new Set([...known, ...drifters.keys()])].sort()) + '\n');
  console.log(`known drift: ${KNOWN_PATH}`);
}
process.exit(rows.every((r) => r.ok) && !world.added && !world.removed ? 0 : 1);
