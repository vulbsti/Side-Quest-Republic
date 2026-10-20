#!/usr/bin/env node
// npm run verify:playback [-- verify/witnesses/x.json ...] [--speed 200]
// Plays witness traces in the real 3D client (headless Chromium, ?replay=), takes a screenshot at the
// moment that matters, and checks the browser's day matches the Node day for the same trace (TLA+'s
// "trace validation": the implementation must take the same steps as the model).
// Writes verify/out/playback/<name>.jpg and verify/out/playback/report.md.
import { createServer } from 'node:http';
import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { extname, join, basename } from 'node:path';
import { createRequire } from 'node:module';
import * as H from './lib/harness.mjs';

const ROOT = new URL('../', import.meta.url).pathname;
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const SPEED = Number(opt('speed', 200));
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

async function loadPlaywright() {
  try { return await import('playwright'); } catch {}
  for (const dir of ['/opt/node-tools/node_modules', '/usr/lib/node_modules', '/usr/local/lib/node_modules']) {
    if (existsSync(join(dir, 'playwright'))) return createRequire(join(dir, 'x.js'))('playwright');
  }
  throw new Error('Playwright is not installed (npm i -D playwright, or set it up globally)');
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.svg': 'image/svg+xml' };
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = join(ROOT, path.endsWith('/') ? path + 'index.html' : path);
  if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const ENGINE_KEYS = /^(rule|ending|outcome|role):/;
const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
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
    await page.goto(`http://localhost:${port}/dist/index.html?replay=/${w}&speed=${SPEED}&nostings`, { timeout: 120000 });
    await page.waitForFunction(() => window.__replay, null, { timeout: 240000 });
    // A failure happened in the trace's last step: stop right after it. An ending: play to the card.
    const last = data.trace.length - 1;
    if (failing) await page.evaluate((i) => window.__replay.pauseAfter(i), last);
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
    row = { ...row, ok: !missing.length && !extra.length && !errors.length, clock: got.clock, nodeClock: H.clock(run.s), ending: got.ending, nodeEnding: run.s.over ? { ending: run.s.ending, outcome: run.s.outcome.outcome, role: run.s.outcome.role } : null, missing, extra, errors, shot: `${name}.jpg`, seconds: Math.round((Date.now() - t0) / 1000), drawn: got.drawn, seen: got.seen };
  } catch (e) {
    row = { ...row, errors: [...errors, e.message.split('\n')[0]], seconds: Math.round((Date.now() - t0) / 1000) };
  }
  rows.push(row);
  console.log(`${row.ok ? 'same' : 'DIFFERENT'}  ${name}  ${row.clock ?? ''} (${row.seconds}s)${row.missing?.length ? '  browser missed: ' + row.missing.join(', ') : ''}${row.extra?.length ? '  browser extra: ' + row.extra.join(', ') : ''}${row.errors?.length ? '  errors: ' + row.errors.join(' | ') : ''}`);
  await page.close();
}
await browser.close();
server.close();

const L = ['# Playback in the 3D client', '', `Each witness trace played in headless Chromium at ${SPEED}× (\`npm run verify:playback\`). "Same" means the browser's engine fired the same rules and reached the same ending as Node for that trace.`, ''];
L.push('| Witness | Browser vs Node | Stopped at | Screenshot |', '| --- | --- | --- | --- |');
for (const r of rows) L.push(`| ${r.note} | ${r.ok ? 'same' : `**different**${r.missing?.length ? `: browser missed ${r.missing.join(', ')}` : ''}${r.extra?.length ? `; browser also fired ${r.extra.join(', ')}` : ''}${r.errors?.length ? `; ${r.errors.join(' / ')}` : ''}`} | ${r.clock ?? ''} | ${r.shot ? `![](${r.shot})` : ''} |`);
writeFileSync(join(OUT, 'report.md'), L.join('\n') + '\n');
console.log(`\n${rows.filter((r) => r.ok).length} of ${rows.length} witnesses play the same in the browser · verify/out/playback/report.md`);
process.exit(rows.every((r) => r.ok) ? 0 : 1);
