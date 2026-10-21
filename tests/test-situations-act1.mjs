// Act 1 situations (nikhil-lost, career-counselling, chabi, speaker-run) played through the engine:
// each reaches done by one path and fail by another, and an idle day runs every auto.
// node tests/test-situations-act1.mjs
import assert from 'node:assert/strict';
import { R, dayAt, runTo, runMinutes, runSeconds, stand, walk, talk, choose, stateOf, heard } from './lib/story.mjs';

let failures = 0;
function test(name, fn) {
  try { fn(); console.log('ok  ', name); } catch (e) { failures++; console.log('FAIL', name, '\n    ', e.message); }
}
const node = (s, id) => s.story.sits[id]?.node;
/** Run the world until pred holds, or throw after n game minutes. */
function until(s, pred, n = 60, what = 'condition') {
  for (let i = 0; i < n * 10; i++) { if (pred()) return s; runSeconds(s, R.mins(0.1)); }
  throw new Error(`timed out waiting for ${what}`);
}

// --- nikhil-lost ---------------------------------------------------------------------------
test('nikhil-lost: hooks at 10:00 with Nikhil\'s pillar updates', () => {
  const s = dayAt('10:00'); runSeconds(s, 0.5);
  assert.equal(stateOf(s, 'nikhil-lost'), 'hooked');
  assert.ok(heard(s).some((l) => l.includes('pillar')));
});
test('nikhil-lost: find him, walk him to the stage, Kabir arrives: done', () => {
  const s = dayAt('10:00'); runSeconds(s, 0.5);
  stand(s, 'nikhil');
  const r = talk(s, 'nikhil');
  assert.equal(r.situation, 'nikhil-lost');
  choose(s, 'follow you and keep up');
  assert.equal(s.people.nikhil.mode, 'follow');
  assert.equal(node(s, 'nikhil-lost'), 'escort');
  walk(s, 'kabirStage');
  until(s, () => node(s, 'nikhil-lost') === 'wait-kabir', 5, 'Nikhil at the stage');
  runTo(s, '11:00');
  until(s, () => s.story.convo?.node === 'reunion', 20, 'the reunion');
  assert.ok(s.nikhilFound);
  choose(s, 'first slogan');
  assert.equal(stateOf(s, 'nikhil-lost'), 'done');
  assert.ok(s.flags['nikhil-found'] && s.flags['exit-chant']);
  assert.ok(s.callbacks.some((c) => c.key === 'sit:nikhil-lost:slogan'));
});
test('nikhil-lost: send him off with directions: fail, and he is lost', () => {
  const s = dayAt('10:00'); runSeconds(s, 0.5);
  stand(s, 'nikhil'); talk(s, 'nikhil');
  choose(s, 'landmark directions');
  assert.equal(stateOf(s, 'nikhil-lost'), 'fail');
  assert.equal(s.people.nikhil.mode, 'lost');
  assert.ok(s.flags['nikhil-left']);
});

// --- career-counselling ----------------------------------------------------------------------
test('career-counselling: panel assembles, "uncle aap cute ho", Tomar notices: done', () => {
  const s = dayAt('10:15'); runSeconds(s, 0.5);
  assert.equal(stateOf(s, 'career-counselling'), 'hooked');
  stand(s, 'sharma');
  assert.equal(talk(s, 'sharma').situation, 'career-counselling');
  choose(s, 'what you should do with your life');
  until(s, () => s.story.convo?.node === 'panel', 15, 'Yadav and Meena to walk over');
  choose(s, 'cute');
  assert.equal(s.people.sharma.mood, 'amused');
  assert.equal(R.officerById(s, 'c2').mood, 'amused');
  assert.equal(s.story.convo?.node, 'tomar');
  choose(s, 'mama');
  assert.equal(stateOf(s, 'career-counselling'), 'done');
  assert.ok(s.flags['tomar-noticed'] && s.flags['sharma-bhanja']);
  assert.equal(s.people.sharma.mood, 'soft');
});
test('career-counselling: fetch Meera, she films the panel as a reel', () => {
  const s = dayAt('10:15');
  stand(s, 'sharma'); talk(s, 'sharma');
  choose(s, 'fetch Meera');
  walk(s, 'meera');
  walk(s, 'barricade');
  until(s, () => s.story.convo?.node === 'panel', 15, 'the panel with Meera');
  choose(s, 'film the whole panel');
  choose(s, 'career advice too');
  assert.equal(stateOf(s, 'career-counselling'), 'done');
  assert.ok(s.flags['counselling-reel'] && s.flags['tomar-noticed']);
  assert.ok(!s.story.followers.includes('meera'));
});
test('career-counselling: ask to cross the barricade: fail', () => {
  const s = dayAt('10:15');
  stand(s, 'sharma'); talk(s, 'sharma');
  choose(s, 'cross the barricade');
  assert.equal(stateOf(s, 'career-counselling'), 'fail');
  assert.equal(s.people.sharma.mood, 'annoyed');
});

// --- chabi -------------------------------------------------------------------------------------
function toLift(s, how) {
  stand(s, 'asha');
  assert.equal(talk(s, 'asha').situation, 'chabi');
  choose(s, 'corner Iqbal');
  until(s, () => s.story.convo?.node === 'rishta', 40, 'Iqbal\'s chai break');
  choose(s, how);
  assert.equal(node(s, 'chabi'), 'lift');
}
test('chabi: lure Meena away, lift the key clean, drop it in the chai: done', () => {
  const s = dayAt('10:50');
  toLift(s, 'Meena over');
  runMinutes(s, 4);
  walk(s, 'keyHook');
  assert.ok(R.act(s, { type: 'take', object: 'key' }).ok);
  assert.equal(s.player.chasedBy, null, 'nobody saw');
  until(s, () => s.story.convo?.node === 'decide', 2, 'the decide node');
  choose(s, 'pateela');
  assert.equal(stateOf(s, 'chabi'), 'done');
  assert.equal(s.objects.key.holder, null);
  runTo(s, '11:45');
  assert.ok(s.bus.stalled || s.people.iqbal.mode !== 'chai', 'the bus stalled and Iqbal went looking');
});
test('chabi: lift it under Meena\'s nose: she chases you', () => {
  const s = dayAt('10:50');
  toLift(s, 'right now');
  walk(s, 'keyHook');
  R.act(s, { type: 'take', object: 'key' });
  assert.equal(s.player.chasedBy, 'c2');
});
test('chabi: carry the key to Kabir at the stage: done, Kabir has it', () => {
  const s = dayAt('10:50');
  toLift(s, 'Meena over');
  runMinutes(s, 4);
  walk(s, 'keyHook');
  R.act(s, { type: 'take', object: 'key' });
  until(s, () => s.story.convo?.node === 'decide', 2, 'the decide node');
  choose(s, 'Kabir');
  walk(s, 'kabir');
  until(s, () => s.story.convo?.node === 'kabir-key', 3, 'Kabir');
  choose(s, 'speech');
  assert.equal(stateOf(s, 'chabi'), 'done');
  assert.equal(s.objects.key.holder, 'kabir');
});
test('chabi: give it back to Iqbal: done once he has it', () => {
  const s = dayAt('10:50');
  toLift(s, 'Meena over');
  runMinutes(s, 4);
  walk(s, 'keyHook');
  R.act(s, { type: 'take', object: 'key' });
  until(s, () => s.story.convo?.node === 'decide', 2, 'the decide node');
  choose(s, 'own up');
  walk(s, 'iqbal');
  assert.ok(R.act(s, { type: 'give', to: 'iqbal' }).ok);
  until(s, () => s.story.convo?.node === 'returned', 30, 'Iqbal with his key');
  choose(s, 'monkey');
  assert.equal(stateOf(s, 'chabi'), 'done');
});
test('chabi: become the rishta consultant: fail, the key never moves', () => {
  const s = dayAt('10:50');
  toLift(s, 'Kabir as a better rishta'); // into the lift goal, then never lift it
  runTo(s, '11:31');
  assert.equal(stateOf(s, 'chabi'), 'fail');
  const t = dayAt('10:50');
  stand(t, 'asha'); talk(t, 'asha'); choose(t, 'corner Iqbal');
  until(t, () => t.story.convo?.node === 'rishta', 40, 'the break');
  choose(t, 'rishta consultant');
  assert.equal(stateOf(t, 'chabi'), 'fail');
  assert.ok(t.flags['rishta-consultant']);
});

// --- speaker-run ---------------------------------------------------------------------------------
test('speaker-run: carry it to the stage, mic check, the speech is big', () => {
  const s = dayAt('10:12'); runSeconds(s, 0.5);
  assert.equal(stateOf(s, 'speaker-run'), 'hooked');
  stand(s, 'ravi');
  assert.equal(talk(s, 'ravi').situation, 'speaker-run');
  choose(s, 'Lift it yourself');
  assert.equal(s.player.carrying, 'speaker');
  walk(s, 'stageSpeaker');
  until(s, () => s.story.convo?.node === 'setup', 2, 'the setup node');
  choose(s, 'mic check');
  assert.equal(stateOf(s, 'speaker-run'), 'done');
  runTo(s, '12:01');
  assert.equal(s.speech, 'big');
});
test('speaker-run: blast it at CP and let the party run: fail', () => {
  const s = dayAt('10:12');
  stand(s, 'ravi'); talk(s, 'ravi');
  choose(s, 'right here at CP');
  assert.equal(s.story.convo?.node, 'party');
  choose(s, 'party run');
  assert.equal(stateOf(s, 'speaker-run'), 'fail');
  assert.ok(s.objects.speaker.on);
});
test('speaker-run: push-cart path reaches the stage too', () => {
  const s = dayAt('10:12');
  stand(s, 'ravi'); talk(s, 'ravi');
  choose(s, 'thela');
  walk(s, 'stageSpeaker');
  until(s, () => s.story.convo?.node === 'setup', 2, 'the setup node');
  choose(s, 'warm up');
  assert.equal(stateOf(s, 'speaker-run'), 'done');
  assert.ok(s.flags['speaker-cart']);
});

// --- nobody comes ----------------------------------------------------------------------------------
test('idle day: every Act 1 auto runs and the world moves', () => {
  const s = dayAt('10:00');
  Object.assign(s.player, { x: 60, z: 30 }); // far from everyone
  runTo(s, '11:50');
  assert.equal(stateOf(s, 'nikhil-lost'), 'fail');
  assert.ok(s.flags['nikhil-left']);
  assert.equal(stateOf(s, 'speaker-run'), 'missed');
  assert.ok(s.flags['ravi-alone']);
  assert.equal(stateOf(s, 'career-counselling'), 'missed');
  assert.equal(stateOf(s, 'chabi'), 'missed');
  assert.ok(R.dist(R.officerById(s, 'c1'), R.PLACES.barricade) < 3, 'Yadav wandered over to Sharma');
  runTo(s, '12:01');
  assert.equal(s.speech, 'big', 'Ravi hauled the speaker himself');
});

if (failures) { console.log(`\n${failures} failed`); process.exit(1); }
console.log('\nall act 1 situation tests passed');
