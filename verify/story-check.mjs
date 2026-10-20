#!/usr/bin/env node
// npm run story:check [-- --all]: the story content against its format (plans/story-rebuild.md).
// Errors exit 1. Warnings are the plan's counts and soft rules; --all also prints info.
import { storyCheck, storyCounts } from './lib/story-check.mjs';

const all = process.argv.includes('--all');
const only = process.argv.slice(2).find((a) => !a.startsWith('--')); // a filter on the message, e.g. a situation id
const found = storyCheck().filter((x) => (all || x.level !== 'info') && (!only || x.msg.includes(only)));
for (const lvl of ['error', 'warn', 'info']) for (const x of found.filter((y) => y.level === lvl)) console.log(`${lvl.padEnd(5)} ${x.id.padEnd(18)} ${x.msg}`);
console.log('\n' + Object.entries(storyCounts()).map(([k, v]) => `${k} ${v}`).join(' · '));
const errors = found.filter((x) => x.level === 'error').length;
console.log(errors ? `${errors} error(s)` : 'no errors');
process.exit(errors ? 1 : 0);
