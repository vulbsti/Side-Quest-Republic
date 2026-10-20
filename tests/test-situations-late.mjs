// The late-day situations (naye-joote, detain-me, dhuan, ghar-jaana-hai) played through the engine:
// each to done by one path and to fail by another, plus the auto that runs if the player never comes.
import assert from 'node:assert/strict';
import { R, dayAt, runTo, runSeconds, stand, walk, choose, start, stateOf, heard, posOf } from './lib/story.mjs';

const near = (s, who) => { const p = posOf(s, 'player'); Object.assign(s.people[who], { x: p.x + 1.5, z: p.z, path: [] }); };
const node = (s, id) => s.story.sits[id]?.node;
const flag = (s, f) => !!s.flags[f];
const settle = (s) => runSeconds(s, 0.5);
let n = 0;
const ok = (name, fn) => { fn(); n++; console.log('ok', name); };

// --- naye-joote -------------------------------------------------------------------------------
ok('naye-joote: hooks at 14:30 with a chat ping', () => {
  const s = dayAt('14:31');
  assert.equal(stateOf(s, 'naye-joote'), 'hooked');
  assert.ok(heard(s).some((l) => l.includes('charger')), 'Nikhil pings about the charger');
});

ok('naye-joote: overhear, take Nikhil to Sharma, make Meena laugh -> done', () => {
  const s = dayAt('14:31');
  stand(s, 'suv'); near(s, 'nikhil');
  start(s, 'naye-joote');
  choose(s, 'receipt');
  assert.equal(s.story.convo.node, 'overhear');
  choose(s, 'Sharma at the barricade');
  assert.equal(node(s, 'naye-joote'), 'report');
  walk(s, 'barricade');
  settle(s);
  assert.equal(s.story.convo?.node, 'sharma', 'reaching the barricade with Nikhil opens the Sharma node');
  choose(s, 'Meena laugh');
  assert.equal(stateOf(s, 'naye-joote'), 'done');
  assert.ok(flag(s, 'fixer-reported'));
  assert.ok(s.story.levers.intensity < 0, 'reporting lowers the intensity lever');
});

ok('naye-joote: drag Nikhil back to the stage -> done', () => {
  const s = dayAt('14:31');
  stand(s, 'suv'); near(s, 'nikhil');
  start(s, 'naye-joote');
  choose(s, 'Drag Nikhil');
  walk(s, 'stage');
  runSeconds(s, 15);
  assert.equal(s.story.convo?.node, 'pulled');
  choose(s, 'power bank');
  assert.equal(stateOf(s, 'naye-joote'), 'done');
});

ok('naye-joote: report to Tomar -> fail, you are detained', () => {
  const s = dayAt('14:31');
  stand(s, 'suv'); near(s, 'nikhil');
  start(s, 'naye-joote');
  choose(s, 'listen');
  settle(s);
  runTo(s, '14:46');
  assert.equal(s.story.convo?.node, 'overhear', 'the call starts at 14:45');
  choose(s, 'Tomar');
  assert.equal(stateOf(s, 'naye-joote'), 'fail');
  assert.ok(s.player.detained);
});

ok('naye-joote: never visited, Nikhil ends up on the bus at 15:15', () => {
  const s = dayAt('15:16');
  assert.equal(stateOf(s, 'naye-joote'), 'fail');
  assert.equal(s.people.nikhil.mode, 'detained');
  assert.ok(flag(s, 'nikhil-on-bus'));
});

// --- detain-me --------------------------------------------------------------------------------
const busDay = () => { const s = dayAt('15:16'); assert.equal(stateOf(s, 'detain-me'), 'hooked', 'friends on the bus hook detain-me'); return s; };

ok('detain-me: ask Sharma, climb on, friends escape, out the front -> done', () => {
  const s = busDay();
  stand(s, 'busJantar');
  start(s, 'detain-me');
  choose(s, 'ask Sharma');
  assert.equal(node(s, 'detain-me'), 'fetch');
  walk(s, 'barricade');
  settle(s);
  assert.equal(s.story.convo?.node, 'ask');
  choose(s, 'window seat');
  choose(s, 'Climb on');
  assert.ok(s.player.detained, 'you are on the bus');
  assert.ok(!s.people.nikhil.hidden, 'Nikhil got out the back');
  assert.equal(s.story.convo?.node, 'update');
  choose(s, 'back door');
  assert.equal(stateOf(s, 'detain-me'), 'done');
  assert.ok(!s.player.detained, 'and you are off it');
});

ok('detain-me: stay on the bus for the show -> done, still detained (bus-andar takes over)', () => {
  const s = busDay();
  stand(s, 'barricade');
  start(s, 'detain-me');
  choose(s, 'ask Sharma');
  settle(s);
  choose(s, 'dosti');
  choose(s, 'Kabir give your name');
  choose(s, 'run a show');
  assert.equal(stateOf(s, 'detain-me'), 'done');
  assert.ok(s.player.detained && flag(s, 'player-stays-detained'));
});

ok('detain-me: film them instead -> fail', () => {
  const s = busDay();
  stand(s, 'busJantar');
  start(s, 'detain-me');
  choose(s, 'Film them');
  assert.equal(stateOf(s, 'detain-me'), 'fail');
});

ok('detain-me: never visited, they let themselves out at 16:50', () => {
  const s = busDay();
  runTo(s, '16:51');
  assert.equal(stateOf(s, 'detain-me'), 'fail');
  assert.ok(!s.people.nikhil.hidden);
});

// --- dhuan ------------------------------------------------------------------------------------
ok('dhuan: shield Kabir, pull Meera out, regroup -> done, friends on the card', () => {
  const s = dayAt('16:01');
  assert.equal(stateOf(s, 'dhuan'), 'hooked');
  start(s, 'dhuan');
  choose(s, 'Kabir');
  choose(s, 'Throw yourself');
  assert.equal(s.story.convo?.node, 'hub');
  choose(s, 'Meera next');
  choose(s, 'Pull Meera out');
  choose(s, 'Head for the Metro');
  assert.equal(stateOf(s, 'dhuan'), 'done');
  assert.deepEqual({ ...s.story.friends }, { kabir: 'ok', nikhil: 'missing', meera: 'ok' });
  assert.ok(flag(s, 'meera-phone-gone') && flag(s, 'kabir-safe'));
});

ok('dhuan: find Nikhil by the Dettol at Sana\'s tent', () => {
  const s = dayAt('14:31'); // keep Nikhil off the bus first
  stand(s, 'suv'); near(s, 'nikhil');
  start(s, 'naye-joote');
  choose(s, 'Drag Nikhil');
  walk(s, 'stage');
  runSeconds(s, 15);
  choose(s, 'new shoes');
  assert.equal(stateOf(s, 'naye-joote'), 'done');
  runTo(s, '16:01');
  assert.ok(!s.people.nikhil.hidden);
  start(s, 'dhuan');
  Object.assign(s.people.nikhil, { ...R.SPOTS.nikhilStart, mode: 'lost', path: [] }); // the charge scattered him to the Metro
  stand(s, 'metro');
  choose(s, 'Nikhil');
  choose(s, 'smell');
  assert.equal(node(s, 'dhuan'), 'nikhil-go');
  stand(s, 'sanaTent');
  for (let i = 0; i < 120 && s.story.convo?.node !== 'nikhil-found'; i++) runSeconds(s, 1);
  assert.equal(s.story.convo?.node, 'nikhil-found');
  choose(s, 'Grab his hand');
  assert.equal(s.story.friends.nikhil, 'ok');
  choose(s, 'Head for the Metro');
  assert.equal(stateOf(s, 'dhuan'), 'done');
});

ok('dhuan: Nikhil is still on the bus (idle day) -> he stays there, detained on the card', () => {
  const s = dayAt('16:01');
  start(s, 'dhuan');
  choose(s, 'Nikhil');
  choose(s, 'still on the bus');
  assert.equal(s.story.friends.nikhil, 'detained');
  assert.equal(s.story.convo?.node, 'hub');
});

ok('dhuan: run for the Metro yourself -> fail', () => {
  const s = dayAt('16:01');
  start(s, 'dhuan');
  choose(s, 'Save yourself');
  assert.equal(stateOf(s, 'dhuan'), 'fail');
  assert.equal(s.story.friends.nikhil, 'missing');
});

ok('dhuan: never visited, the smoke decides at 16:35', () => {
  const s = dayAt('16:36');
  assert.equal(stateOf(s, 'dhuan'), 'fail');
  assert.equal(s.story.friends.meera, 'hurt');
});

// --- ghar-jaana-hai ---------------------------------------------------------------------------
ok('ghar-jaana-hai: gate, count, mummy, escalator -> done', () => {
  const s = dayAt('17:01');
  assert.equal(stateOf(s, 'ghar-jaana-hai'), 'hooked');
  stand(s, 'metro');
  start(s, 'ghar-jaana-hai');
  settle(s);
  assert.equal(s.story.convo?.node, 'gate', 'already at the Metro: straight to the gate');
  choose(s, 'Count heads');
  choose(s, 'Stop counting');
  choose(s, 'Kabir\'s mummy');
  choose(s, 'truth');
  assert.ok(flag(s, 'mummy-knows-truth'));
  const c = s.story.convo;
  assert.ok(!c.options.find((o) => o.intent.startsWith('Count heads')).ok, 'counted once');
  choose(s, 'escalator');
  assert.equal(stateOf(s, 'ghar-jaana-hai'), 'done');
});

ok('ghar-jaana-hai: go back for Nikhil at the chai stall and walk him to the gate', () => {
  const s = dayAt('17:01');
  stand(s, 'metro');
  start(s, 'ghar-jaana-hai');
  settle(s);
  choose(s, 'Count heads');
  choose(s, 'Go back for Nikhil');
  assert.equal(node(s, 'ghar-jaana-hai'), 'pillars');
  walk(s, 'cp');
  settle(s);
  assert.equal(s.story.convo?.node, 'nikhil-back');
  choose(s, 'right thing');
  walk(s, 'metro');
  for (let i = 0; i < 120 && s.story.convo?.node !== 'gate'; i++) runSeconds(s, 1);
  assert.equal(s.story.convo?.node, 'gate');
  assert.equal(s.story.friends.nikhil, 'ok');
});

ok('ghar-jaana-hai: never come to the Metro -> fail at 17:45', () => {
  const s = dayAt('17:46');
  assert.equal(stateOf(s, 'ghar-jaana-hai'), 'fail');
  assert.ok(flag(s, 'went-home-without-you'));
});

ok('ghar-jaana-hai: miss the gate -> fail', () => {
  const s = dayAt('17:01');
  stand(s, 'parliament');
  start(s, 'ghar-jaana-hai');
  runTo(s, '17:56');
  assert.equal(s.story.convo?.node, 'late');
  choose(s, 'thumbs up');
  assert.equal(stateOf(s, 'ghar-jaana-hai'), 'fail');
});

console.log(`${n} late-day situation checks pass`);
