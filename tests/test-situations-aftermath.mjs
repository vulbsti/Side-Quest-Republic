// The detention bus always has a way off, and the late afternoon has something to do (pattiyan).
import assert from 'node:assert/strict';
import { R, dayAt, runTo, runMinutes, stand, choose, start, stateOf } from './lib/story.mjs';

let n = 0;
const ok = (name, fn) => { fn(); n++; console.log('ok', name); };
const detain = (s) => { const o = s.officers.c3; Object.assign(s.player, { x: o.x, z: o.z }); s.player.rep.heat = 60; R.act(s, { type: 'pester', to: 'c3', how: 'detainme' }); assert(s.player.detained); runMinutes(s, 1); if (s.story.convo) R.act(s, { type: 'leave' }); };

ok('bus-andar: anyone can sign the maafinama and walk off', () => {
  const s = dayAt('11:00'); detain(s);
  R.act(s, { type: 'plead' });
  choose(s, 'maafinama');
  assert(!s.player.detained, 'signed and off the bus');
  assert(s.callbacks.some((c) => c.key === 'sit:bus-andar:maafi'), 'the ending card can say so');
});

ok('bus-andar: calling Mummy from the jawan\'s phone gets you out', () => {
  const s = dayAt('11:00'); detain(s);
  R.act(s, { type: 'plead' });
  choose(s, 'jawan where he is from'); choose(s, 'mummy');
  R.act(s, { type: 'leave' });
  runMinutes(s, 14);
  assert(!s.player.detained, 'Mummy calls the thana back');
});

ok('bus-andar: waving at friends nobody sees times out back to the bus', () => {
  const s = dayAt('11:00'); detain(s);
  R.act(s, { type: 'plead' });
  choose(s, 'Wave');
  runMinutes(s, 16);
  assert.equal(s.story.convo?.node, 'inside', 'back to working the bus after fifteen minutes');
});

ok('detention: do nothing and you are processed and let go in about twenty minutes', () => {
  const s = dayAt('11:00'); detain(s);
  runMinutes(s, 22);
  if (s.story.convo) R.act(s, { type: 'leave' });
  runMinutes(s, 1);
  assert(!s.player.detained);
});

ok('pattiyan: hooks at 16:15, Meena\'s bottle -> done', () => {
  const s = dayAt('16:16');
  assert.equal(stateOf(s, 'pattiyan'), 'hooked');
  stand(s, 'sana');
  start(s, 'pattiyan');
  choose(s, 'Meena');
  assert.equal(stateOf(s, 'pattiyan'), 'done');
  assert(s.callbacks.some((c) => c.key === 'sit:pattiyan:meena-bottle'));
});

ok('pattiyan: filming the tent -> fail; nobody comes -> fail at 16:58', () => {
  const a = dayAt('16:16'); stand(a, 'sana'); start(a, 'pattiyan'); choose(a, 'Film'); assert.equal(stateOf(a, 'pattiyan'), 'fail');
  const b = dayAt('16:16'); runTo(b, '16:59'); assert.equal(stateOf(b, 'pattiyan'), 'fail');
});
console.log(n, 'aftermath checks pass');
