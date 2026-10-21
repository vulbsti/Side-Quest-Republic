// A played day, recorded the way the client records it, replays tick for tick in Node (dist/loop/trace.js).
import assert from 'node:assert/strict';
import * as R from '../dist/loop/rules.js';
import { createRecorder, setInputs, replayRecording } from '../dist/loop/trace.js';

R.setTempo('long');
const day = R.createDay(), rec = createRecorder(day, { by: 'test' });
const act = (cmd) => { rec.act(cmd); return R.act(day, cmd); };
let x = day.player.x, z = day.player.z;
for (let k = 0; k < 3000; k++) {
  if (k === 40) act({ type: 'talk', to: 'nikhil' });
  if (k === 60) act({ type: 'leave' });
  if (k > 80 && k < 900) { x += 0.3; z -= 0.4; } // walk off towards the stage
  const inp = { x, z, unseen: false };
  setInputs(day, inp); rec.inputs(inp);
  R.tick(day, 0.1); rec.tick();
}
const r = JSON.parse(JSON.stringify(rec.recording({ ending: day.ending ?? null })));
const again = replayRecording(r, R);
assert.equal(again.t, day.t);
assert.deepEqual([again.player.x, again.player.z], [day.player.x, day.player.z]);
assert.deepEqual(Object.keys(again.history).sort(), Object.keys(day.history).sort());
assert.equal(again.people.nikhil.mode, day.people.nikhil.mode);
console.log('recording replays exactly:', r.ticks, 'ticks,', r.steps.length, 'steps');
