// Act 2 situations (mira-mic, afwaah, mummy-call) and the 14:00 cannon-request, played through the engine
// the way a player would: stand somewhere, talk, choose, walk. Each reaches `done` by one path and `fail`
// by another, and an idle day runs every `auto`. Run: node tests/test-situations-act2.mjs
import assert from 'node:assert/strict';
import { R, dayAt, runTo, runSeconds, stand, walk, talk, choose, stateOf, heard } from './lib/story.mjs';

const tests = [];
const test = (name, fn) => tests.push([name, fn]);
const flag = (s, f) => !!s.flags[f];
const onScreen = (s) => s.story.convo;
/** Let the queued beats play out and goals be checked. */
const settle = (s, secs = 3) => runSeconds(s, secs);

// --- mira-mic ----------------------------------------------------------------------------------------

test('mira-mic hooks at noon with a chat ping and an overheard line', () => {
  const s = dayAt('11:59');
  heard(s);
  runTo(s, '12:01');
  const lines = heard(s);
  assert.equal(stateOf(s, 'mira-mic'), 'hooked');
  assert.ok(lines.some((l) => l.startsWith('meera:') && l.includes('Mira di')), 'chat ping from Meera');
  assert.ok(lines.some((l) => l.startsWith('mira:') && l.includes('peeche tak')), 'overheard Mira');
});

test('mira-mic done: carry Dev\'s megaphone to Mira, hold the stage, drown out the neta', () => {
  const s = dayAt('12:05');
  stand(s, 'mira');
  const r = talk(s, 'mira');
  assert.equal(r.situation, 'mira-mic');
  assert.equal(onScreen(s).node, 'speech');
  assert.ok(onScreen(s).options.length >= 4);
  choose(s, 'megaphone');
  assert.equal(s.player.carrying, 'megaphone', 'Dev hands it over');
  assert.equal(R.situations(s).find((x) => x.id === 'mira-mic').goal, "Get Dev's megaphone into Mira's hands");
  stand(s, 'mira');
  assert.ok(R.act(s, { type: 'give', to: 'mira' }).ok, 'give it to Mira');
  settle(s);
  assert.equal(s.objects.megaphone.holder, 'mira');
  assert.match(R.situations(s).find((x) => x.id === 'mira-mic').goal, /Hold the stage/);
  stand(s, 'stage');
  runTo(s, '13:00');
  settle(s);
  assert.equal(onScreen(s)?.node, 'neta', 'the neta arrives at 1');
  const meg = onScreen(s).options.find((o) => o.intent.includes('megaphone'));
  assert.ok(meg.ok, 'the megaphone option is open because Mira holds it');
  choose(s, 'megaphone');
  assert.equal(stateOf(s, 'mira-mic'), 'done');
  assert.ok(flag(s, 'mira-kept-mic'));
  assert.equal(s.people.mira.mood, 'proud');
  assert.ok(s.callbacks.some((c) => c.key === 'sit:mira-mic:megaphone'));
});

test('mira-mic: the megaphone option is closed without the megaphone; the quiz path is done', () => {
  const s = dayAt('12:40');
  stand(s, 'mira');
  talk(s, 'mira');
  choose(s, 'chant');
  stand(s, 'stage');
  runTo(s, '13:00'); settle(s);
  assert.equal(onScreen(s).node, 'neta');
  assert.equal(onScreen(s).options.find((o) => o.intent.includes('megaphone')).ok, false);
  choose(s, 'questions');
  assert.equal(stateOf(s, 'mira-mic'), 'done');
  assert.ok(flag(s, 'neta-roasted'));
});

test('mira-mic fail: wander off and the neta takes the mic', () => {
  const s = dayAt('12:10');
  stand(s, 'mira');
  talk(s, 'mira');
  choose(s, 'bouncer');
  stand(s, 'metro');
  runTo(s, '13:11'); settle(s);
  assert.equal(stateOf(s, 'mira-mic'), 'fail');
  assert.ok(flag(s, 'neta-took-mic'), 'outcome do ran');
});

test('mira-mic fail: let the neta have it', () => {
  const s = dayAt('13:01');
  stand(s, 'mira');
  talk(s, 'mira');
  choose(s, 'hand him the mic');
  settle(s);
  assert.equal(onScreen(s).node, 'neta', 'past 13:00 the wait goal holds at once');
  choose(s, 'only a minute');
  assert.equal(stateOf(s, 'mira-mic'), 'fail');
  assert.ok(flag(s, 'neta-photo-with-mira'));
});

// --- afwaah --------------------------------------------------------------------------------------------

test('afwaah done: count the bikes yourself and post the real number', () => {
  const s = dayAt('12:31');
  assert.equal(stateOf(s, 'afwaah'), 'hooked');
  stand(s, 'asha');
  assert.equal(talk(s, 'asha').situation, 'afwaah');
  choose(s, 'count');
  walk(s, 'barricade');
  settle(s);
  assert.equal(onScreen(s)?.node, 'bikes');
  choose(s, 'Film the real count');
  assert.equal(stateOf(s, 'afwaah'), 'done');
  assert.ok(flag(s, 'afwaah-killed'));
  assert.ok(s.story.levers.intensity < 0);
});

test('afwaah done: forward it, carry it to the stage, and shout it plants the DRS rumour there', () => {
  const s = dayAt('12:35');
  stand(s, 'asha');
  talk(s, 'asha');
  choose(s, 'every group');
  assert.ok(s.rumours.sena.places.cp, 'planted at CP');
  walk(s, 'stage'); settle(s);
  assert.equal(onScreen(s)?.node, 'stage');
  choose(s, 'five lakh');
  assert.equal(stateOf(s, 'afwaah'), 'done');
  assert.ok(s.rumours.sena.places.stage, 'planted at the stage');
});

test('afwaah done: count, then walk the real number to Rawat', () => {
  const s = dayAt('12:31');
  stand(s, 'asha'); talk(s, 'asha');
  choose(s, 'count');
  stand(s, 'barricade'); settle(s);
  choose(s, 'Rawat');
  walk(s, 'c4'); settle(s);
  assert.equal(onScreen(s)?.node, 'rawat');
  choose(s, 'correction');
  assert.equal(stateOf(s, 'afwaah'), 'done');
  assert.ok(flag(s, 'rawat-correction'));
  assert.equal(R.officerById(s, 'c4').mood, 'amused');
});

test('afwaah: the source path can kill it with a boring correction', () => {
  const s = dayAt('12:40');
  stand(s, 'asha'); talk(s, 'asha');
  choose(s, 'Call Rawat');
  settle(s);
  assert.equal(onScreen(s).node, 'source');
  choose(s, 'boring');
  assert.equal(stateOf(s, 'afwaah'), 'done');
});

test('afwaah fail: take the forward and never reach the stage', () => {
  const s = dayAt('12:31');
  stand(s, 'asha'); talk(s, 'asha');
  choose(s, 'biryani');
  assert.ok(s.rumours.biryani.places.cp);
  stand(s, 'parliament');
  runTo(s, '13:41'); settle(s);
  assert.equal(stateOf(s, 'afwaah'), 'fail');
  assert.ok(flag(s, 'afwaah-ran-wild'));
});

// --- mummy-call ------------------------------------------------------------------------------------------

test('mummy-call hooks at 13:40 and follows Kabir; telling Mummy the truth keeps him with a curfew', () => {
  const s = dayAt('13:41');
  assert.equal(stateOf(s, 'mummy-call'), 'hooked');
  assert.equal(s.people.kabir.mode, 'onCall');
  stand(s, 'kabir');
  assert.equal(talk(s, 'kabir').situation, 'mummy-call');
  assert.equal(onScreen(s).camera, 'phone');
  assert.equal(onScreen(s).options.find((o) => o.intent.includes('Sharma')).ok, false, 'Sharma is not in the mood yet');
  choose(s, 'where he actually is');
  assert.equal(stateOf(s, 'mummy-call'), 'done');
  assert.ok(flag(s, 'kabir-stays') && flag(s, 'kabir-curfew-16'));
  assert.equal(s.people.kabir.mood, 'shook');
  runTo(s, '14:05');
  assert.notEqual(s.people.kabir.mode, 'leaving', 'Kabir stays past 14:00');
});

test('mummy-call: an amused Sharma plays Verma sir', () => {
  const s = dayAt('13:41');
  s.people.sharma.mood = 'amused';
  stand(s, 'kabir'); talk(s, 'kabir');
  choose(s, 'tuition teacher');
  assert.equal(stateOf(s, 'mummy-call'), 'done');
  assert.ok(flag(s, 'sharma-tuition-teacher'));
  assert.equal(s.people.kabir.mood, 'grateful');
  assert.equal(s.people.sharma.mood, 'soft');
});

test('mummy-call fail: keep filming, and Kabir leaves at 14:00', () => {
  const s = dayAt('13:41');
  stand(s, 'kabir'); talk(s, 'kabir');
  choose(s, 'Keep filming');
  assert.equal(stateOf(s, 'mummy-call'), 'fail');
  assert.ok(flag(s, 'kabir-leaves-at-14'));
  assert.equal(s.people.kabir.mood, 'sulking');
  runTo(s, '14:01');
  assert.equal(s.people.kabir.mode, 'leaving');
});

// --- cannon-request ---------------------------------------------------------------------------------------

test('cannon-request done: ask for the water cannon like room service', () => {
  const s = dayAt('14:01');
  assert.equal(stateOf(s, 'cannon-request'), 'hooked');
  stand(s, 'sharma');
  assert.equal(talk(s, 'sharma').situation, 'cannon-request');
  choose(s, 'room service');
  assert.equal(stateOf(s, 'cannon-request'), 'done');
  assert.ok(flag(s, 'cannon-requested') && flag(s, 'cannon-to-barricade'));
});

test('cannon-request done: the bottle run to Sana and back', () => {
  const s = dayAt('14:01');
  s.waterOk = true; // Sana has her crate
  stand(s, 'sharma'); talk(s, 'sharma');
  choose(s, 'cold bottle');
  walk(s, 'sana'); settle(s);
  assert.equal(onScreen(s)?.node, 'sana');
  choose(s, 'two');
  walk(s, 'sharma'); settle(s);
  assert.equal(onScreen(s)?.node, 'bottle');
  choose(s, 'each of them');
  assert.equal(stateOf(s, 'cannon-request'), 'done');
  assert.equal(s.people.sharma.mood, 'soft');
  assert.equal(R.officerById(s, 'r1').mood, 'soft');
  assert.ok(flag(s, 'sana-short-one'));
});

test('cannon-request fail: drink the bottle in front of him', () => {
  const s = dayAt('14:01');
  s.waterOk = true;
  stand(s, 'sharma'); talk(s, 'sharma');
  choose(s, 'cold bottle');
  stand(s, 'sana'); settle(s);
  choose(s, 'truth');
  stand(s, 'sharma'); settle(s);
  choose(s, 'Drink it yourself');
  assert.equal(stateOf(s, 'cannon-request'), 'fail');
  assert.equal(s.people.sharma.mood, 'annoyed');
});

test('cannon-request: the bottle option needs Sana\'s water', () => {
  const s = dayAt('14:01');
  s.waterOk = false;
  stand(s, 'sharma'); talk(s, 'sharma');
  assert.equal(onScreen(s).options.find((o) => o.intent.includes('bottle')).ok, false);
});

// --- an idle day ------------------------------------------------------------------------------------------

test('an idle day runs every auto: the neta gets the mic, the forward runs wild, Kabir leaves, the heat climbs', () => {
  const s = dayAt('10:00');
  runTo(s, '14:40');
  assert.equal(stateOf(s, 'mira-mic'), 'fail');
  assert.ok(flag(s, 'neta-took-mic'));
  assert.equal(stateOf(s, 'afwaah'), 'fail');
  assert.ok(s.rumours.sena.places.barricade, 'the forward reached the barricade');
  assert.equal(stateOf(s, 'mummy-call'), 'fail');
  assert.ok(flag(s, 'kabir-leaves-at-14'));
  assert.equal(stateOf(s, 'cannon-request'), 'fail');
});

test('no line repeats inside a situation path', () => {
  for (const [at, who, picks] of [['12:05', 'mira', ['chant']], ['12:35', 'asha', ['Call Rawat', 'Remix']], ['13:41', 'kabir', ['deep voice']], ['14:01', 'sharma', ['RAF jawan']]]) {
    const s = dayAt(at);
    R.drainEvents(s);
    stand(s, who); talk(s, who);
    for (const p of picks) { settle(s); choose(s, p); }
    runSeconds(s, 60);
    const lines = R.drainEvents(s).filter((e) => e.text && /^(situation|hook):/.test(e.key || '')).map((e) => `${e.who}: ${e.text}`);
    assert.ok(lines.length >= 8, `${who}: heard ${lines.length} situation lines`);
    const dupes = lines.filter((l, i) => lines.indexOf(l) !== i);
    assert.deepEqual(dupes, [], 'no line said twice');
  }
});

let failed = 0;
for (const [name, fn] of tests) {
  try { fn(); console.log(`ok   ${name}`); } catch (e) { failed++; console.log(`FAIL ${name}\n     ${e.message}`); }
}
console.log(failed ? `\n${failed} of ${tests.length} failed` : `\nall ${tests.length} passed`);
process.exit(failed ? 1 : 0);
