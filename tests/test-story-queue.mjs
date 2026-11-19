// Found by the verifier (prompt-works) while exploring the place dares: answer Nikhil's last question, then press E
// on "Regroup at the Rajiv Chowk Metro exit" at once. The new situation's first lines queued behind the old
// conversation's closing beats and nothing new showed for three seconds. Starting a situation now plays the
// queued beats first (as answering does), so its own lines come straight after.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as H from '../verify/lib/harness.mjs';

const w = JSON.parse(readFileSync(new URL('./fixtures/situation-after-convo.json', import.meta.url), 'utf8'));
const run = H.replay(w.trace.slice(0, -1), w.tempo);
const last = w.trace.at(-1);
assert.equal(last.cmd.type, 'situation', 'the last step starts a situation');
const n = run.log.length;
const out = H.perform(run, last);
assert(out.r?.ok, 'the situation starts');
assert(!out.silent, 'and the player sees something within three seconds');
assert(run.log.slice(n).some((l) => l.seen && l.text && String(l.key).startsWith(`situation:${last.cmd.id}`)), "the new situation's own first line is on screen");
console.log('PASS story queue');
