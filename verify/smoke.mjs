#!/usr/bin/env node
// npm run verify:smoke: open the real game in headless Chromium, start a day, and poke the story layer
// (detention, the bus-andar conversation card, a named officer) to check the client draws it without errors.
// Screenshots go to verify/out/smoke/. It checks wiring, not frame rate.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, serve, launch } from './lib/browser.mjs';

const OUT = join(ROOT, 'verify/out/smoke');
mkdirSync(OUT, { recursive: true });
const server = await serve();
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`${server.url}/dist/index.html?nostings`);
try { await page.waitForFunction(() => window.__loop && document.querySelector('#go'), null, { timeout: 240000 }); }
catch (e) { console.log('did not load:', await page.evaluate(() => document.querySelector('#loadtext')?.textContent), errors); await page.screenshot({ path: join(OUT, '0-load.jpg') }); process.exit(1); }
await page.evaluate(() => window.__loop.startLoop());
await page.waitForTimeout(4000);
const shot = (n) => page.screenshot({ path: join(OUT, `${n}.jpg`), type: 'jpeg', quality: 70, timeout: 180000 }).catch(() => console.log(`(no screenshot for ${n}: the renderer is too slow here)`));
await shot('1-start');
const step = async (label, fn, wait = 3000) => { await page.evaluate(fn); await page.waitForTimeout(wait); await shot(label); };
// A named constable: talk to Yadav.
await step('2-yadav', () => { const L = window.__loop, d = L.day, o = d.officers.c1; Object.assign(L.sim.player, { x: o.x + 1.5, z: o.z }); Object.assign(d.player, { x: o.x + 1.5, z: o.z }); L.act(d, { type: 'talk', to: 'c1' }); });
// Detained at 14:30: the bus-andar card.
await step('3-detained', () => { const L = window.__loop, d = L.day; L.advance(d, L.at(14, 30) - d.t); L.snap(); const o = d.officers.c3; Object.assign(d.player, { x: o.x, z: o.z }); d.player.rep.heat = 60; L.act(d, { type: 'pester', to: 'c3', how: 'detainme' }); }, 2000);
// The card opens once the opening beats have played. Software GL runs at a frame or two a second, so play them on the engine clock.
await page.evaluate(() => { const L = window.__loop; L.act(L.day, { type: 'plead' }); L.advance(L.day, 12); });
await page.waitForFunction(() => !document.querySelector('#choices').classList.contains('hidden'), null, { timeout: 180000, polling: 1000 }).catch(() => {});
await shot('4-bus-andar');
const state = await page.evaluate(() => ({ convo: window.__loop.day.story.convo?.id ?? null, mode: window.__loop.mode, cine: !!window.__loop.cine.active, queue: (window.__loop.day.story.queue || []).length, t: window.__loop.day.t, choices: !document.querySelector('#choices').classList.contains('hidden'), title: document.querySelector('#choicesTitle')?.textContent, items: [...document.querySelectorAll('#choicesList button')].map((b) => b.textContent.trim()) }));
console.log(JSON.stringify(state, null, 1));
console.log(errors.length ? `errors:\n${[...new Set(errors)].join('\n')}` : 'no page errors');
await browser.close(); server.close();
process.exit(errors.length || !state.choices ? 1 : 0);
