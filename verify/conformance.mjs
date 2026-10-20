#!/usr/bin/env node
// npm run verify:browser [-- --only=roast --speed=30]
//
// Model checking proves the engine; this checks the 3D game shows it (TLA+-style trace validation).
// Each ending's witness trace (verify/traces/ending-*.json) replays in headless Chrome through the real
// game (?replay=). At clock checkpoints the replay pauses, people settle, and we check:
//   - everyone the engine has on the street is drawn, where the engine says (within TOLERANCE m);
//   - the browser day reaches the same ending as the Node day;
//   - no console errors;
// and save a storyboard frame. Once per run: the live world's obstacles still match
// verify/world-obstacles.json (the sight lines verify/ uses). Writes verify/conformance.json.
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright-core';

const ROOT = new URL('..', import.meta.url).pathname;
const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const SPEED = Number(arg('speed', 100)), ONLY = arg('only', null);
const TOLERANCE = 2.5; // metres between engine and drawn position, after the replay pauses and bodies settle
const CHECKPOINTS = ['10:30', '12:00', '13:30', '14:30', '15:30', '16:30', '17:30'];
const CHROME = process.env.CHROME ?? ['/usr/bin/google-chrome', '/usr/bin/chromium', '/opt/pw-browsers/chromium'].find(existsSync);

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.svg': 'image/svg+xml' };
const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  const file = join(ROOT, path.endsWith('/') ? path + 'index.html' : path);
  if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(0);
const BASE = `http://127.0.0.1:${server.address().port}`;

// The GPU (60 fps headless here); CONFORMANCE_GL=swiftshader for machines without one (about 1 fps).
const GL = process.env.CONFORMANCE_GL === 'swiftshader' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--use-gl=angle', '--use-angle=gl', '--enable-gpu', '--ignore-gpu-blocklist'];
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: [...GL, '--mute-audio'] });
const frames = (page, n) => page.evaluate((n) => new Promise((r) => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
const results = { at: new Date().toISOString(), speed: SPEED, tolerance: TOLERANCE, endings: {}, world: null, failures: [], known: [] };
// Known findings (verify/conformance-known.json, extended by --update-known) are reported but don't fail
// the run, so a drift someone has already filed doesn't hide a new one. Drift is matched per person, not
// per ending: whether a body gets stuck behind a wall depends on frame timing, so it moves between days.
const KNOWN_PATH = ROOT + 'verify/conformance-known.json';
const known = existsSync(KNOWN_PATH) ? new Set(JSON.parse(readFileSync(KNOWN_PATH, 'utf8')).map((k) => k.key)) : new Set();
const fail = (where, msg, key = `${where}|${msg}`) => {
  const isKnown = known.has(key);
  (isKnown ? results.known : results.failures).push({ where, msg, key });
  console.log(`  ${isKnown ? 'known' : 'FAIL '} ${where}: ${msg}`);
};
const clockMin = (c) => { const [h, m] = c.split(':').map(Number); return h * 60 + m; };

async function openGame(query) {
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push(m.text()); });
  await page.goto(`${BASE}/dist/index.html?${query}`);
  await page.waitForFunction(() => window.__loop?.world, null, { timeout: 120000 });
  return { page, errors };
}

// 1. The world the sight lines are computed against is still the one verify/ snapshotted.
{
  const { page, errors } = await openGame('dev');
  const live = await page.evaluate(() => window.__loop.obstacles());
  const snap = JSON.parse(readFileSync(ROOT + 'verify/world-obstacles.json', 'utf8')).obstacles;
  const key = (o) => `${o.x},${o.z},${o.w},${o.d},${o.h}`;
  const a = new Set(live.map(key)), b = new Set(snap.map(key));
  const added = [...a].filter((k) => !b.has(k)).length, removed = [...b].filter((k) => !a.has(k)).length;
  results.world = { live: live.length, snapshot: snap.length, added, removed };
  if (added || removed) fail('world', `obstacles changed (+${added} -${removed}); refresh verify/world-obstacles.json with: node verify/conformance.mjs --snapshot-world`);
  if (process.argv.includes('--snapshot-world')) {
    writeFileSync(ROOT + 'verify/world-obstacles.json', JSON.stringify({ source: 'window.__loop.obstacles() at boot, minus the moving shuttle', capturedAt: new Date().toISOString(), shuttle: { w: 2.8, d: 10, h: 3.4 }, obstacles: live }));
    console.log('  world snapshot written');
  }
  for (const e of errors) fail('boot', e);
  const bootErrors = errors.length;
  // Live play: start a day, walk for two seconds; the recorder must have captured the inputs it fed the engine.
  await page.evaluate(() => window.__loop.startLoop());
  await page.keyboard.down('w');
  await frames(page, 120);
  await page.keyboard.up('w');
  const played = await page.evaluate(() => { const t = window.__loop.trace(); const d = window.__loop.day; return { ticks: t.ticks, inputs: t.steps.filter((s) => s.in).length, ex: d.player.x, ez: d.player.z }; });
  results.live = played;
  if (!(played.ticks > 0 && played.inputs > 1)) fail('live-play', `recorder captured ${played.ticks} ticks and ${played.inputs} input changes while walking`);
  for (const e of errors.slice(bootErrors)) fail('live-play', e);
  await page.close();
}

// 2. Every ending's witness trace, replayed through the real game.
const TR = ROOT + 'verify/traces/';
const traces = readdirSync(TR).filter((f) => f.startsWith('ending-') && (!ONLY || f === `ending-${ONLY}.json`));
for (const file of traces) {
  const id = file.replace(/^ending-|\.json$/g, '');
  const want = JSON.parse(readFileSync(TR + file, 'utf8')).meta?.ending;
  const { page, errors } = await openGame(`replay=/verify/traces/${file}&speed=${SPEED}`);
  const dir = `${ROOT}verify/storyboards/${id}/`;
  mkdirSync(dir, { recursive: true });
  const r = { want, got: null, checkpoints: [], worst: 0 };
  for (const cp of CHECKPOINTS) {
    // Wait for the replay to pass the checkpoint, freeze the day, let people walk to where they belong.
    const ok = await page.waitForFunction((m) => { const d = window.__loop.day; return d.over || (600 + d.t / (d.tempo || 1.25)) >= m; }, clockMin(cp), { timeout: 180000 }).then(() => true, () => false);
    if (!ok) { fail(id, `replay never reached ${cp}`); break; }
    await page.evaluate(() => window.__loop.pause(true));
    await frames(page, 180); // people walk to where the engine has them (about 3 s of frames)
    const v = await page.evaluate(() => window.__loop.render());
    const off = [...v.people, ...v.officers].filter((p) => p.rx !== undefined)
      .map((p) => ({ id: p.id, d: Math.hypot(p.ex - p.rx, p.ez - p.rz), shown: p.shown }));
    const worst = off.reduce((m, p) => (p.d > m.d ? p : m), { d: 0 });
    const hidden = off.filter((p) => !p.shown).map((p) => p.id);
    r.checkpoints.push({ clock: v.clock, worst: worst.id ? `${worst.id} ${worst.d.toFixed(1)} m` : null, notDrawn: hidden });
    r.worst = Math.max(r.worst, worst.d);
    for (const p of off.filter((p) => p.d > TOLERANCE)) fail(id, `at ${v.clock} ${p.id} is drawn ${p.d.toFixed(1)} m from where the engine has them`, `drift|${p.id}`);
    for (const h of hidden) fail(id, `at ${v.clock} the engine has ${h} on the street but they are not drawn`, `hidden|${h}`);
    await page.screenshot({ path: `${dir}${cp.replace(':', '')}.jpg`, type: 'jpeg', quality: 60 });
    await page.evaluate(() => window.__loop.pause(false));
    if (v.over) break;
  }
  await page.waitForFunction(() => window.__loop.day.over, null, { timeout: 180000 }).catch(() => {});
  r.got = await page.evaluate(() => window.__loop.day.ending);
  if (r.got !== want) fail(id, `the browser day ended "${r.got}", the Node day "${want}"`);
  for (const e of errors) fail(id, `console: ${e}`);
  results.endings[id] = r;
  console.log(`  ${id.padEnd(10)} ${r.got === want ? 'same ending' : 'DIFFERENT ending'}; worst drift ${r.worst.toFixed(1)} m; ${r.checkpoints.length} frames`);
  await page.close();
}

await browser.close();
server.close();
writeFileSync(ROOT + 'verify/conformance.json', JSON.stringify(results, null, 1));
if (process.argv.includes('--update-known')) {
  const old = existsSync(KNOWN_PATH) ? JSON.parse(readFileSync(KNOWN_PATH, 'utf8')) : [];
  const keys = new Map([...old.map((k) => [k.key, k]), ...[...results.known, ...results.failures].map((f) => [f.key, { key: f.key, first: `${f.where}: ${f.msg}` }])]);
  writeFileSync(KNOWN_PATH, JSON.stringify([...keys.values()], null, 1));
  console.log(`known findings updated: ${keys.size} in verify/conformance-known.json`);
}
console.log(results.failures.length ? `\n${results.failures.length} conformance failure(s); storyboards in verify/storyboards/` : '\nthe game draws what the engine says; storyboards in verify/storyboards/');
if (results.known.length) console.log(`${results.known.length} known finding(s) not counted (verify/conformance-known.json)`);
process.exit(results.failures.length && !process.argv.includes('--update-known') ? 1 : 0);
