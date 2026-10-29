// The window escape off the detention bus: climb out of the open pane while Pandey looks at his phone, edge
// along the outside while the hands below are down, drop, and run. Climb while he's watching and the pane shuts.
import assert from 'node:assert/strict';
import { R, dayAt, runMinutes, choose } from './lib/story.mjs';

const detain = (s) => { const o = s.officers.c3; Object.assign(s.player, { x: o.x, z: o.z }); s.player.rep.heat = 60; R.act(s, { type: 'pester', to: 'c3', how: 'detainme' }); assert(s.player.detained); runMinutes(s, 1); if (s.story.convo) R.act(s, { type: 'leave' }); };
const tickUntil = (s, ok, max = 200) => { for (let i = 0; i < max && !ok(); i++) R.tick(s, 0.1); };
const cues = (s) => s.cues.map((c) => c.cue);
function onTheWindow() {
  const s = dayAt('11:00'); detain(s);
  R.act(s, { type: 'plead' });
  choose(s, 'pane');
  tickUntil(s, () => s.action);
  assert.equal(s.action?.game, 'window', 'the window game starts');
  assert(cues(s).includes('action:window:start'));
  assert(R.affordances(s).some((a) => a.id === 'window:climb'), 'climbing is on offer');
  return s;
}

// Clean escape: wait for the look-away, then step only while the hands are down.
let s = onTheWindow();
tickUntil(s, () => !R.jawanWatching(s));
assert(R.act(s, { type: 'window', step: 'climb' }).ok);
assert.equal(s.action.phase, 'edge');
for (let k = 0; k < 4; k++) { tickUntil(s, () => !R.handsUp(s)); R.act(s, { type: 'window', step: 'edge' }); R.tick(s, 0.1); }
assert(!s.player.detained, 'off the bus');
assert(cues(s).includes('action:window:win'));
assert(s.flags['window-escaped']);

// Climb while he's watching: back down, and the pane is shut for the rest of the day.
s = onTheWindow();
tickUntil(s, () => R.jawanWatching(s));
R.act(s, { type: 'window', step: 'climb' });
assert(s.player.detained && !s.action, 'spotted: still on the bus');
assert(cues(s).includes('action:window:fail'));
R.act(s, { type: 'plead' });
assert(!s.story.convo || !s.story.convo.options.some((o) => /pane/.test(o.intent) && o.ok), 'the pane is shut now');

// Step while the hands are up: grabbed by the ankle.
s = onTheWindow();
tickUntil(s, () => !R.jawanWatching(s));
R.act(s, { type: 'window', step: 'climb' });
tickUntil(s, () => R.handsUp(s));
R.act(s, { type: 'window', step: 'edge' });
assert(s.player.detained && cues(s).includes('action:window:fail'), 'grabbed off the side');

// Do nothing: Pandey shuts it after half a minute.
s = onTheWindow();
tickUntil(s, () => !s.action, 400);
assert(cues(s).includes('action:window:fail') && s.player.detained);

console.log('Window escape: a clean climb gets you off the bus; spotted, grabbed or slow shuts the pane.');
