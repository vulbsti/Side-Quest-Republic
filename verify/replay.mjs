#!/usr/bin/env node
// npm run verify:replay -- verify/witnesses/<file>.json [--all]
// Replays a witness trace in Node and prints the day as the player lived it: each decision, and what
// reached the screen (bubbles, toasts, the wireless; --all adds the phone). Ends with the ending card.
import { readFileSync } from 'node:fs';
import * as H from './lib/harness.mjs';

const args = process.argv.slice(2);
const file = args.find((a) => a.endsWith('.json'));
if (!file) { console.error('usage: npm run verify:replay -- verify/witnesses/<file>.json [--all]'); process.exit(2); }
const ALL = args.includes('--all');
const data = JSON.parse(readFileSync(file, 'utf8'));
const run = H.newRun(data.tempo || 'long');
const SCREEN = new Set(['bubble', 'officer', 'player', 'toast', 'radio']);
const show = (i) => i.seen && i.text && (SCREEN.has(i.channel) || (ALL && ['feed', 'chat', 'ticker', 'stream'].includes(i.channel)));
console.log(`${data.name}${data.note ? `: ${data.note}` : ''}\n`);
for (const step of data.trace) {
  if (run.s.over) break;
  const { clock: _c, reached: _r, ...rest } = step;
  const from = run.log.length;
  const what = rest.wait != null ? `wait ${rest.wait} min` : rest.finish ? 'stand still until 18:00' : rest.cmd ? `${rest.do}` : `go to ${rest.do}${rest.hold ? `, stay ${rest.hold} min` : ''}`;
  const out = H.perform(run, rest);
  const r = out.r ? ` → ${out.r.ok ? 'ok' : 'refused'}${out.r.say ? ` (${out.r.say})` : ''}${out.silent ? '  ⚠ nothing visible' : ''}` : '';
  console.log(`${out.entry.clock}  ${what}${r}${out.crash ? `  ✖ CRASH ${out.crash}` : ''}`);
  for (const i of run.log.slice(from).filter(show)) console.log(`        ${i.clock} ${i.channel.padEnd(7)} ${i.who ?? ''}: ${i.text}`);
}
if (run.s.over && run.s.outcome) {
  const c = run.s.outcome;
  console.log(`\n${c.title} · ${c.roleTitle} · ${run.s.ending}\n${c.text}`);
  for (const cb of c.callbacks) console.log(`  - ${cb.text}`);
} else console.log(`\nstopped at ${H.clock(run.s)}${run.s.player.detained ? ' (on the bus)' : ''}`);
if (data.expect?.ending) {
  const ok = run.s.ending === data.expect.ending && run.s.outcome?.outcome === data.expect.outcome && run.s.outcome?.role === data.expect.role;
  console.log(ok ? '\nreplays as recorded' : `\nDOES NOT replay as recorded: expected ${JSON.stringify(data.expect)}`);
  process.exit(ok ? 0 : 1);
}
